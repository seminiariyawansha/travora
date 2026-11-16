// src/app/badge.js
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, SafeAreaView, Share, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import { colors } from "../theme/colors";

export default function Badge() {
  const router = useRouter();
  // Accept destinationName, destinationId, and totalPoints as optional nav params
  const { destinationName, destinationId, totalPoints } = useLocalSearchParams();

  const name = destinationName ?? "Sigiriya";
  const currentDestId = destinationId ?? "sigiriya";
  const pts = totalPoints ? Number(totalPoints) : 40;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🏆 I just completed ${name} on Travora and earned ${pts} points! #Travora #SriLanka`,
      });
    } catch (e) {
      // Share cancelled or failed — silently ignore
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={22} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.badgeHex}>
          <Ionicons name="trophy" size={48} color={colors.terracotta} />
        </View>
        <Text style={styles.title}>Destination Completed!</Text>
        <Text style={styles.destName}>{name}</Text>

        <View style={styles.pointsRow}>
          <Ionicons name="star" size={18} color={colors.terracotta} />
          <Text style={styles.pointsText}>{pts} Total Points Earned</Text>
        </View>

        <View style={{ width: "100%", gap: 12, marginTop: 40 }}>
          <Button title="Share Badge" onPress={handleShare} />
          <Button
            title="View Details"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: "/progress",
                params: { destinationId: currentDestId },
              })
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.tealDark,
    padding: 24,
  },
  topBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  badgeHex: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.white,
    marginTop: 20,
    textAlign: "center",
  },
  destName: {
    fontSize: 16,
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
