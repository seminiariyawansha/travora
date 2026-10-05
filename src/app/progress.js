// src/app/progress.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Tag from "../components/Tag";
import { mockPoints } from "../data/mockData";
import { colors } from "../theme/colors";

export default function Progress() {
  const router = useRouter();
  const points = mockPoints.sigiriya;
  const unlockedCount = points.filter((p) => p.unlocked).length;
  const percent = Math.round((unlockedCount / points.length) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Sigiriya</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.progressLabel}>
          {unlockedCount}/{points.length} points unlocked
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
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
            <Text style={styles.pts}>+{point.pointsValue} pts</Text>
          </View>
        ))}
      </ScrollView>
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
