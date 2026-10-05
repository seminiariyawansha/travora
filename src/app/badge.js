// src/app/badge.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import { colors } from "../theme/colors";

export default function Badge() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.badgeHex}>
        <Ionicons name="trophy" size={44} color={colors.terracotta} />
      </View>
      <Text style={styles.title}>Destination Completed!</Text>
      <Text style={styles.destName}>Sigiriya</Text>

      <View style={styles.pointsRow}>
        <Ionicons name="star" size={18} color={colors.terracotta} />
        <Text style={styles.pointsText}>40 Total Points Earned</Text>
      </View>

      <View style={{ width: "100%", gap: 10, marginTop: 40 }}>
        <Button title="Share Badge" onPress={() => {}} />
        <Button
          title="View Details"
          variant="secondary"
          onPress={() => router.push("/progress")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.tealDark,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  badgeHex: {
    width: 110,
    height: 110,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.white,
    marginTop: 20,
  },
  destName: {
    fontSize: 15,
    color: colors.terracotta,
    fontWeight: "600",
    marginTop: 4,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  pointsText: { color: colors.white, fontWeight: "600", fontSize: 13.5 },
});
