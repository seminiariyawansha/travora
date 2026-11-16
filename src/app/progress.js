// src/app/progress.js
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Tag from "../components/Tag";
import { getCachedPoints } from "../db/offlineContentService";
import { auth } from "../services/firebaseConfig";
import { getDestination, getPoints } from "../services/destinationService";
import { getUserProgress } from "../services/progressService";
import { colors } from "../theme/colors";

export default function Progress() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const destinationId = params.destinationId || "sigiriya";

  const [points, setPoints] = useState([]);
  const [destName, setDestName] = useState(
    destinationId === "galle-fort" ? "Galle Fort" : "Sigiriya"
  );
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProgress() {
        setLoading(true);
        try {
          // 0. Load destination name
          try {
            const dest = await getDestination(destinationId);
            if (dest?.name && active) {
              setDestName(dest.name);
            }
          } catch {
            // keep fallback
          }

          // 1. Load points (Firebase first, SQLite fallback)
          let rawPoints = [];
          try {
            rawPoints = await getPoints(destinationId);
          } catch {
            rawPoints = await getCachedPoints(destinationId);
          }

          // 2. Load which ones the user has actually unlocked
          let unlockedIds = [];
          try {
            const uid = auth.currentUser?.uid ?? "guest";
            const progress = await getUserProgress(uid, destinationId);
            unlockedIds = progress?.unlockedPoints ?? [];
          } catch {
            // offline — show all as locked
          }

          if (!active) return;

          setPoints(
            rawPoints.map((p) => ({
              ...p,
              unlocked: unlockedIds.includes(p.id),
            }))
          );
        } catch (e) {
          console.error("Progress load error:", e);
        } finally {
          if (active) setLoading(false);
        }
      }

      loadProgress();
      return () => {
        active = false;
      };
    }, [destinationId])
  );

  const unlockedCount = points.filter((p) => p.unlocked).length;
  const totalPoints = points.reduce(
    (sum, p) => sum + (p.unlocked ? p.pointsValue ?? 0 : 0),
    0
  );
  const percent =
    points.length > 0 ? Math.round((unlockedCount / points.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>{destName}</Text>
        <View style={{ width: 20 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={styles.progressLabel}>
              {unlockedCount}/{points.length} points unlocked · {totalPoints} pts earned
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
            {points.length === 0 && (
              <Text style={{ color: colors.gray, textAlign: "center", marginTop: 20 }}>
                No points found. Download Sigiriya first.
              </Text>
            )}
            {points.map((point) => (
              <View key={point.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pointName}>{point.name}</Text>
                  <Tag
                    label={
                      point.unlocked
                        ? "Unlocked"
                        : point.indoorFriendly
                          ? "Indoor"
                          : "Outdoor"
                    }
                    variant={
                      point.unlocked
                        ? "unlocked"
                        : point.suggested
                          ? "suggested"
                          : "neutral"
                    }
                  />
                </View>
                <Text style={styles.pts}>+{point.pointsValue ?? 0} pts</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 16, fontWeight: "700", color: colors.ink },
  progressLabel: { fontSize: 12, color: colors.gray, marginBottom: 6 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.divider,
  },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.teal },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
  },
  pointName: {
    fontSize: 13.5,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 4,
  },
  pts: { fontSize: 12, fontWeight: "700", color: colors.teal },
});
