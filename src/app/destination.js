// src/app/destination.js
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { getDestination, getPoints } from "../services/destinationService";
import { auth } from "../services/firebaseConfig";
import { colors } from "../theme/colors";
import { useResponsive } from "../theme/responsive";
import { loadVisitedIds } from "../utils/visitedPoints";
import * as WeatherOverride from "../weather/devWeatherOverride";
import * as WeatherFetch from "../weather/weatherFetchService";
import * as WeatherSort from "../weather/weatherSortingService";

// The weather helpers come from Member 5's files. Each one is optional here:
// if a function is missing or was renamed, the screen simply skips that part.
async function fetchWeather(destinationId, destination) {
  if (typeof WeatherFetch.getWeatherForDestination !== "function") return null;
  if (destination?.latitude == null || destination?.longitude == null)
    return null;
  return WeatherFetch.getWeatherForDestination(
    destinationId,
    destination.latitude,
    destination.longitude,
  );
}

function sortWithWeather(points, weather) {
  const sorter = WeatherSort.sortPointsByWeather;
  return typeof sorter === "function" ? sorter(points, weather) : points;
}

function bannerText(weather) {
  if (!weather || typeof WeatherSort.getSuggestionReason !== "function")
    return null;
  return WeatherSort.getSuggestionReason(weather) ?? null;
}

function whyText(weather) {
  if (typeof WeatherSort.getWhyExplanation === "function") {
    return WeatherSort.getWhyExplanation(weather);
  }
  return "Points are ordered using the weather at this destination. Indoor points come first when it's wet. This is only a suggestion.";
}

export default function Destination() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { moderateScale, height } = useResponsive();
  const { destinationId } = useLocalSearchParams();

  const [destination, setDestination] = useState(null);
  const [points, setPoints] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const heroHeight = Math.min(Math.max(height * 0.22, 170), 250);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        setLoading(true);
        setLoadError("");
        try {
          const dest = await getDestination(destinationId);
          const rawPoints = await getPoints(destinationId);

          // Which points has this person visited? Works online and offline.
          const visited = await loadVisitedIds(
            auth.currentUser?.uid,
            destinationId,
          );
          const withStatus = rawPoints.map((p) => ({
            ...p,
            unlocked: visited.has(p.id),
          }));

          // Weather is optional: if it fails, points stay in their normal order
          let weatherInfo = null;
          try {
            weatherInfo = await fetchWeather(destinationId, dest);
          } catch (weatherError) {
            console.log("Weather failed:", weatherError.message);
          }

          if (!active) return;
          setDestination(dest);
          setWeather(weatherInfo);
          setPoints(sortWithWeather(withStatus, weatherInfo));
        } catch (error) {
          console.log("Destination load failed:", error.message);
          if (active)
            setLoadError(
              "Couldn't load this destination. Check your connection.",
            );
        } finally {
          if (active) setLoading(false);
        }
      }

      load();
      return () => {
        active = false;
      };
    }, [destinationId, reloadKey]),
  );

  async function handleDownload() {
    setDownloading(true);
    setDownloadMessage("");
    try {
      await downloadDestination(destinationId);
      setDownloadMessage("Downloaded. This destination now works offline.");
    } catch (error) {
      console.log("Download failed:", error.message);
      setDownloadMessage("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  // Locked points can't be opened until the tourist visits the place
  function openPoint(point) {
    if (!point.unlocked) {
      Alert.alert(
        "Locked",
        `Visit ${point.name} in person to unlock its story, photos, video and quiz.`,
        [
          { text: "Show on map", onPress: () => router.push("/(tabs)/map") },
          { text: "OK", style: "cancel" },
        ],
      );
      return;
    }
    router.push({
      pathname: "/story",
      params: { pointId: point.id, destinationId },
    });
  }

  // DEV TOOL: long-press the title to cycle Live -> Rain -> Clear -> Live
  function cycleWeatherOverride() {
    if (
      typeof WeatherOverride.getWeatherOverride !== "function" ||
      typeof WeatherOverride.setWeatherOverride !== "function"
    ) {
      return;
    }
    const current = WeatherOverride.getWeatherOverride();
    const next =
      current === null ? "rain" : current === "rain" ? "clear" : null;
    WeatherOverride.setWeatherOverride(next);
    setReloadKey((k) => k + 1);
  }

  const reasonText = bannerText(weather);

  return (
    <View style={styles.container}>
      {/* Hero: cover photo, back button, Progress button and the name */}
      <View style={[styles.hero, { height: heroHeight + insets.top }]}>
        {destination?.coverImage ? (
          <Image
            source={{ uri: destination.coverImage }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
          />
        ) : null}
        <View style={styles.heroShade} />

        <View style={[styles.heroContent, { paddingTop: insets.top + 12 }]}>
          <View style={styles.heroTop}>
            <Pressable
              onPress={() => router.back()}
              style={styles.roundButton}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={20} color={colors.white} />
            </Pressable>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/progress",
                  params: { destinationId },
                })
              }
              style={styles.progressButton}
              hitSlop={8}
            >
              <Ionicons name="ribbon-outline" size={16} color={colors.white} />
              <Text style={styles.progressText}>Progress</Text>
            </Pressable>
          </View>

          <Pressable onLongPress={cycleWeatherOverride} delayLongPress={600}>
            <Text
              style={[styles.heroTitle, { fontSize: moderateScale(26) }]}
              numberOfLines={2}
            >
              {destination?.name || "Destination"}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScreenContainer>
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <WeatherBanner
            reasonText={reasonText}
            onPressWhy={() => Alert.alert("Why this order?", whyText(weather))}
          />

          {weather && (
            <Text style={styles.weatherMeta}>
              {weather.condition}
              {weather.temperature != null
                ? ` · ${Math.round(weather.temperature)}°C`
                : ""}
              {weather.isSimulated
                ? " · simulated"
                : weather.isStale
                  ? " · saved weather (offline)"
                  : " · live"}
            </Text>
          )}

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
              onPress={() => openPoint(point)}
              style={[
                styles.pointCard,
                !point.unlocked && styles.pointCardLocked,
              ]}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.pointTitleRow}>
                  <Text
                    style={[styles.pointName, { fontSize: moderateScale(14) }]}
                  >
                    {point.name}
                  </Text>
                  {point.suggested && (
                    <Tag label="SUGGESTED" variant="suggested" />
                  )}
                </View>
                <Text
                  style={[styles.pointMeta, { fontSize: moderateScale(11.5) }]}
                >
                  {point.indoorFriendly ? "Indoor" : "Outdoor"} ·{" "}
                  {point.pointsValue ?? 0} pts
                  {point.unlocked ? " · Visited" : ""}
                </Text>
              </View>
              <Ionicons
                name={point.unlocked ? "checkmark-circle" : "lock-closed"}
                size={moderateScale(20)}
                color={point.unlocked ? colors.teal : colors.gray}
              />
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
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

  hero: { backgroundColor: colors.teal, overflow: "hidden" },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 20,
    paddingBottom: 18,
    justifyContent: "space-between",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  progressText: { color: colors.white, fontSize: 13, fontWeight: "600" },
  heroTitle: { fontWeight: "700", color: colors.white },

  weatherMeta: { fontSize: 11.5, color: colors.gray, fontWeight: "600" },

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
  pointCardLocked: { backgroundColor: "#FBF9F5" },
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
