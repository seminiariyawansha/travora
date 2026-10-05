// src/app/unlock.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import { colors } from "../theme/colors";

export default function Unlock() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.badgeCircle}>
        <Ionicons name="location" size={40} color={colors.white} />
      </View>
      <Text style={styles.title}>Location Reached!{"\n"}Story Unlocked</Text>

      <View style={styles.pointsPill}>
        <Ionicons name="star" size={16} color={colors.terracotta} />
        <Text style={styles.pointsText}>+10 Points</Text>
      </View>

      <View style={{ marginTop: 40, width: "100%" }}>
        <Button title="View Story" onPress={() => router.back()} />
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
