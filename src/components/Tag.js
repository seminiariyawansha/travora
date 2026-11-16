// src/components/Tag.js
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function Tag({ label, variant = "neutral" }) {
  const styleMap = {
    suggested: { backgroundColor: colors.terracotta, color: colors.ink },
    locked: { backgroundColor: colors.divider, color: colors.gray },
    unlocked: { backgroundColor: colors.teal, color: colors.white },
    neutral: { backgroundColor: colors.divider, color: colors.gray },
  };
  const chosen = styleMap[variant] || styleMap.neutral;

  return (
    <View style={[styles.tag, { backgroundColor: chosen.backgroundColor }]}>
      <Text style={[styles.text, { color: chosen.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: { fontSize: 10.5, fontWeight: "700" },
});
