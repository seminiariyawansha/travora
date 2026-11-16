// src/app/destination.js
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../components/Button";
import ScreenContainer from "../components/ScreenContainer";
import Tag from "../components/Tag";
import WeatherBanner from "../components/WeatherBanner";
import { downloadDestination } from "../db/downloadService";
import {
  getCachedDestinationById,
  getCachedPoints,
} from "../db/offlineContentService";
import { getDestination, getPoints } from "../services/destinationService";
import { auth } from "../services/firebaseConfig";
import { getUserProgress } from "../services/progressService";
import { colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useResponsive } from "../theme/responsive";
import { getDestinationPhoto } from "../utils/destinationImages";
import { getWeatherForDestination } from "../weather/weatherFetchService";
import {
  getBannerWeatherReason,
  showWeatherExplanationAlert,
} from "../weather/weatherReasonService";
import { sortPointsByWeather } from "../weather/weatherSortingService";

export default function Destination() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { moderateScale, height } = useResponsive();
  const { destinationId } = useLocalSearchParams();
  const { colors: themeColors, isDark } = useTheme();

  const [destination, setDestination] = useState(null);
  const [points, setPoints] = useState([]);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");

  // Hero height scales with the screen, but stays within a sensible range
  const heroHeight = Math.min(Math.max(height * 0.2, 150), 230);

  const loadScreen = useCallback(
    async (isActive) => {
      setLoading(true);
      setLoadError("");
      setWeatherInfo(null);

      // 1. Try Firebase first (works when online)
      let dest = null;
      let rawPoints = [];
      let onlineFailed = false;

      try {
        dest = await getDestination(destinationId);
        rawPoints = await getPoints(destinationId);
      } catch (error) {
        onlineFailed = true;
        console.log("Online load failed, trying offline data:", error.message);
      }

      // If online destination fetch failed or returned null, fall back to cached destination
      if (!dest) {
        try {
          const cachedDest = await getCachedDestinationById(destinationId);
          if (cachedDest) dest = cachedDest;
        } catch (destErr) {
          console.log("Offline destination load failed:", destErr?.message);
        }
      }

      // 2. If Firebase gave no points, fall back to the downloaded (offline) points
      if (rawPoints.length === 0) {
        try {
          const cached = await getCachedPoints(destinationId);
          if (cached.length > 0) rawPoints = cached;
        } catch (cacheError) {
          console.log("Offline points load failed:", cacheError.message);
        }
      }

      // 3. Fetch user progress (optional)
      let unlockedIds = [];
      try {
        const userId = auth.currentUser?.uid ?? "guest";
        const progress = await getUserProgress(userId, destinationId);
        unlockedIds = progress?.unlockedPoints ?? [];
      } catch (progressError) {
        console.log("Progress load failed:", progressError.message);
      }

      if (!isActive()) return;

      // 4. Merge unlocked status into points
      const mergedPoints = rawPoints.map((p) => ({
        ...p,
        unlocked: unlockedIds.includes(p.id),
      }));

      setDestination(dest);
      setPoints(mergedPoints);

      // Only show an error if we had no data at all
      if (onlineFailed && mergedPoints.length === 0) {
        setLoadError("Couldn't load this destination. Check your connection.");
      }
      setLoading(false);

      // 5. Fetch weather in the background (live if online, cached if not)
      const lat = dest?.latitude != null ? Number(dest.latitude) : null;
      const lng = dest?.longitude != null ? Number(dest.longitude) : null;
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

      try {
        // Offline, coordinates aren't needed: the cached weather is used
        const weather = await getWeatherForDestination(
          destinationId,
          hasCoords ? lat : null,
          hasCoords ? lng : null,
        );
        if (!isActive()) return;

        if (weather) {
          setWeatherInfo(weather);
          // 6. Reorder points when weather arrives, preserving unlocked status
          setPoints((currentPoints) =>
            sortPointsByWeather(currentPoints, weather),
          );
        }
      } catch (weatherErr) {
        console.log(
          "Weather fetch error on destination screen:",
          weatherErr?.message,
        );
      }
    },
    [destinationId],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadScreen(() => active);
      return () => {
        active = false;
      };
    }, [loadScreen]),
  );

  async function handleDownload() {
    setDownloading(true);
    setDownloadMessage("");
    try {
      const result = await downloadDestination(destinationId);
      console.log("Download result:", result);

      const pointCount = result?.pointCount ?? 0;
      const savedCount = result?.savedCount ?? 0;
      const skipped = Array.isArray(result?.skipped) ? result.skipped : [];

      if (pointCount === 0) {
        setDownloadMessage(
          "Nothing to download yet. An admin needs to add points first.",
        );
      } else if (savedCount === 0) {
        setDownloadMessage(
          "Points were found but could not be saved. Check that each point has content.",
        );
      } else if (skipped.length > 0) {
        const firstReason = skipped[0]?.reason ? ` (${skipped[0].reason})` : "";
        setDownloadMessage(
          `Downloaded ${savedCount} of ${pointCount} points. ${skipped.length} could not be saved.${firstReason}`,
        );
        loadScreen(() => true);
      } else {
        setDownloadMessage(
          `Downloaded all ${pointCount} points. This destination now works offline.`,
        );
        loadScreen(() => true);
      }
    } catch (error) {
      console.log("Download failed:", error.message);
      setDownloadMessage("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const handlePressWhy = () => {
    showWeatherExplanationAlert(weatherInfo);
  };

  const bannerReason = getBannerWeatherReason(weatherInfo);
  const isValidPhoto = (url) =>
    typeof url === "string" &&
    (url.startsWith("http://") || url.startsWith("https://")) &&
    !url.includes("wikimedia.org") &&
    !url.includes("wikipedia.org") &&
    !url.includes("placeholder");

  const heroPhotoUri =
    (isValidPhoto(destination?.imageUrl) && destination.imageUrl) ||
    (isValidPhoto(destination?.photoUrl) && destination.photoUrl) ||
    getDestinationPhoto(destinationId, destination?.name);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* Hero spans the full width, with real destination photography */}
      <ImageBackground
        source={{ uri: heroPhotoUri }}
        style={[
          styles.hero,
          { height: heroHeight + insets.top, paddingTop: insets.top + 12 },
        ]}
      >
        <View style={styles.heroDim} />
        <View style={styles.heroTopRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/progress",
                params: { destinationId: destinationId ?? "sigiriya" },
              })
            }
            style={styles.progressBtn}
          >
            <Ionicons name="ribbon-outline" size={15} color={colors.white} />
            <Text style={styles.progressBtnText}>Progress</Text>
          </Pressable>
        </View>
        <Text style={[styles.heroTitle, { fontSize: moderateScale(26) }]}>
          {destination?.name || "Destination"}
        </Text>
      </ImageBackground>

      <ScreenContainer>
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <WeatherBanner
            reasonText={bannerReason}
            onPressWhy={handlePressWhy}
          />

          {loading && (
            <ActivityIndicator color={colors.teal} style={{ marginTop: 20 }} />
          )}

          {!loading && loadError ? (
            <Text style={styles.errorText}>{loadError}</Text>
          ) : null}

          {!loading && !loadError && points.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="location-outline" size={28} color={colors.gray} />
              <Text style={styles.emptyTitle}>No points added yet</Text>
              <Text style={styles.emptyText}>
                This destination doesn't have any points yet. They appear here
                as soon as an admin adds them.
              </Text>
            </View>
          )}

          {points.map((point) => (
            <Pressable
              key={point.id}
              onPress={() =>
                router.push({
                  pathname: "/story",
                  params: { pointId: point.id, destinationId },
                })
              }
              style={[
                styles.pointCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.cardBorder,
                },
              ]}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.pointTitleRow}>
                  <Text
                    style={[
                      styles.pointName,
                      { fontSize: moderateScale(14), color: themeColors.textPrimary },
                    ]}
                  >
                    {point.name}
                  </Text>
                  {point.suggested && (
                    <Tag label="SUGGESTED" variant="suggested" />
                  )}
                </View>
                <Text
                  style={[
                    styles.pointMeta,
                    { fontSize: moderateScale(11.5), color: themeColors.textSecondary },
                  ]}
                >
                  {point.indoorFriendly ? "Indoor" : "Outdoor"} ·{" "}
                  {point.pointsValue ?? 0} pts
                </Text>
              </View>
              <Ionicons
                name={point.unlocked ? "checkmark-circle" : "lock-closed"}
                size={moderateScale(20)}
                color={point.unlocked ? themeColors.teal : themeColors.gray}
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* Pinned bottom action, clear of the system navigation bar */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: themeColors.bg }]}>
          {downloadMessage ? (
            <Text style={styles.downloadMessage}>{downloadMessage}</Text>
          ) : null}
          {downloading ? (
            <ActivityIndicator color={colors.teal} />
          ) : (
            <Button title="Download for Offline" onPress={handleDownload} />
          )}
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  hero: {
    backgroundColor: colors.tealDark,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    paddingBottom: 18,
    position: "relative",
    overflow: "hidden",
  },
  heroDim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  progressBtnText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontWeight: "700", color: colors.white },
  pointCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
  },
  pointTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  pointName: { fontWeight: "600", color: colors.ink },
  pointMeta: { color: colors.gray },
  emptyBox: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: colors.ink },
  emptyText: {
    fontSize: 12.5,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 18,
  },
  errorText: { color: "#C0392B", fontSize: 12.5, fontWeight: "600" },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 8,
    backgroundColor: colors.sand,
  },
  downloadMessage: {
    fontSize: 12,
    color: colors.teal,
    fontWeight: "600",
    textAlign: "center",
  },
});
