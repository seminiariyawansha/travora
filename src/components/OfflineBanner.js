// src/components/OfflineBanner.js
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function OfflineBanner({ visible }) {
  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.teal} />
      <Text style={styles.text}>
        Using downloaded content — no internet required
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.divider,
    borderRadius: 12,
    padding: 10,
  },
  text: { color: colors.ink, fontSize: 11.5, fontWeight: "600" },
});
