// src/app/destination.js
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import { mockWeather } from "../data/mockData"; // still mock until Member 5's weather is wired
import { downloadDestination } from "../db/downloadService";
import { getDestination, getPoints } from "../services/destinationService";
import { auth } from "../services/firebaseConfig";
import { getUserProgress } from "../services/progressService";
import { colors } from "../theme/colors";
import { useResponsive } from "../theme/responsive";

export default function Destination() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { moderateScale, height } = useResponsive();
  const { destinationId } = useLocalSearchParams();

  const [destination, setDestination] = useState(null);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");

  // Hero height scales with the screen, but stays within a sensible range
  const heroHeight = Math.min(Math.max(height * 0.2, 150), 230);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        setLoading(true);
        setLoadError("");
        try {
          const dest = await getDestination(destinationId);
          const rawPoints = await getPoints(destinationId);

          // Progress is optional: if it fails, still show the points
          let unlockedIds = [];
          try {
            const userId = auth.currentUser?.uid ?? "guest";
            const progress = await getUserProgress(userId, destinationId);
            unlockedIds = progress?.unlockedPoints ?? [];
          } catch (progressError) {
            console.log("Progress load failed:", progressError.message);
          }

          if (!active) return;
          setDestination(dest);
          setPoints(
            rawPoints.map((p) => ({
              ...p,
              unlocked: unlockedIds.includes(p.id),
            })),
          );
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
    }, [destinationId]),
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

  return (
    <View style={styles.container}>
      {/* Hero spans the full width, even on tablets */}
      <View
        style={[
          styles.hero,
          { height: heroHeight + insets.top, paddingTop: insets.top + 12 },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>
        <Text style={[styles.heroTitle, { fontSize: moderateScale(26) }]}>
          {destination?.name || "Destination"}
        </Text>
      </View>

      <ScreenContainer>
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <WeatherBanner
            reasonText={mockWeather.reasonText}
            onPressWhy={() => {}}
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
              style={styles.pointCard}
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

        {/* Pinned bottom action, clear of the system navigation bar */}
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
  hero: {
    backgroundColor: colors.teal,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    paddingBottom: 18,
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
