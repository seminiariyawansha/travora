// src/components/Button.js
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";

export default function Button({ title, onPress, variant = "primary", icon }) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, isPrimary ? styles.primary : styles.secondary]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          isPrimary ? styles.textPrimary : styles.textSecondary,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  primary: { backgroundColor: colors.teal },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.teal,
  },
  text: { fontSize: 14.5, fontWeight: "600" },
  textPrimary: { color: colors.white },
  textSecondary: { color: colors.teal },
});
