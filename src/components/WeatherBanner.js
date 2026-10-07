// src/components/WeatherBanner.js
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function WeatherBanner({ reasonText, onPressWhy }) {
  if (!reasonText) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.iconCircle}>
        <Ionicons name="rainy-outline" size={18} color={colors.terracotta} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>{reasonText}</Text>
        <Pressable onPress={onPressWhy}>
          <Text style={styles.link}>Why this order?</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.teal,
    borderRadius: 16,
    padding: 14,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: colors.white, fontSize: 13, fontWeight: "600" },
  link: {
    color: colors.terracotta,
    fontSize: 12.5,
    fontWeight: "600",
    marginTop: 4,
    textDecorationLine: "underline",
  },
});
