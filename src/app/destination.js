// src/app/destination.js
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Button from "../components/Button";
import Tag from "../components/Tag";
import WeatherBanner from "../components/WeatherBanner";
import { mockWeather } from "../data/mockData"; // still mock until Member 5 is merged
import { getDestination, getPoints } from "../services/destinationService";
import { auth } from "../services/firebaseConfig";
import { getUserProgress } from "../services/progressService";
import { colors } from "../theme/colors";

export default function Destination() {
  const router = useRouter();
  const { destinationId } = useLocalSearchParams();
  const [destination, setDestination] = useState(null);
  const [points, setPoints] = useState([]);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const dest = await getDestination(destinationId);
        const rawPoints = await getPoints(destinationId);
        const userId = auth.currentUser?.uid ?? "guest";
        const progress = await getUserProgress(userId, destinationId);

        const pointsWithStatus = rawPoints.map((p) => ({
          ...p,
          unlocked: progress.unlockedPoints.includes(p.id),
        }));

        setDestination(dest);
        setPoints(pointsWithStatus);
      }
      load();
    }, [destinationId]),
  );

  if (!destination) return null; // simple loading guard, swap for a spinner later if you want

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>
        <Text style={styles.heroTitle}>{destination.name}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <WeatherBanner
          reasonText={mockWeather.reasonText}
          onPressWhy={() => {}}
        />

        {points.map((point) => (
          <Pressable
            key={point.id}
            onPress={() =>
              router.push({ pathname: "/story", params: { pointId: point.id } })
            }
            style={styles.pointCard}
          >
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={styles.pointName}>{point.name}</Text>
                {point.suggested && (
                  <Tag label="SUGGESTED" variant="suggested" />
                )}
              </View>
              <Text style={styles.pointMeta}>
                {point.indoorFriendly ? "Indoor" : "Outdoor"} ·{" "}
                {point.pointsValue} pts
              </Text>
            </View>
            <Ionicons
              name={point.unlocked ? "checkmark-circle" : "lock-closed"}
              size={20}
              color={point.unlocked ? colors.teal : colors.gray}
            />
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ padding: 20 }}>
        <Button title="Download for Offline" onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  hero: {
    height: 180,
    backgroundColor: colors.teal,
    padding: 20,
    justifyContent: "space-between",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 26, fontWeight: "700", color: colors.white },
  pointCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
  },
  pointName: { fontSize: 14, fontWeight: "600", color: colors.ink },
  pointMeta: { fontSize: 11.5, color: colors.gray, marginTop: 3 },
});
