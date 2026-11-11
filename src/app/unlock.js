// src/app/unlock.js
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import { colors } from "../theme/colors";

export default function Unlock() {
  const router = useRouter();
  const { pointId, pointsEarned } = useLocalSearchParams();

  // Safely parse pointsEarned, falling back to 10 if missing or invalid
  const parsedPoints = Number(pointsEarned);
  const earnedPoints =
    !isNaN(parsedPoints) && parsedPoints > 0 ? parsedPoints : 10;

  const handleViewStory = () => {
    if (pointId) {
      router.push({ pathname: "/story", params: { pointId } });
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.badgeCircle}>
        <Ionicons name="location" size={40} color={colors.white} />
      </View>
      <Text style={styles.title}>Location Reached!{"\n"}Story Unlocked</Text>

      <View style={styles.pointsPill}>
        <Ionicons name="star" size={16} color={colors.terracotta} />
        <Text style={styles.pointsText}>+{earnedPoints} Points</Text>
      </View>

      <View style={{ marginTop: 40, width: "100%" }}>
        <Button title="View Story" onPress={handleViewStory} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  badgeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.white,
    textAlign: "center",
    marginTop: 20,
  },
  pointsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  pointsText: { color: colors.white, fontWeight: "700", fontSize: 13.5 },
});
