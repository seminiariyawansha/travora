import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/onboarding");
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Ionicons name="location" size={42} color={colors.ink} />
      </View>
      <Text style={styles.title}>Travora</Text>
      <Text style={styles.tagline}>EXPLORE · UNLOCK · DISCOVER</Text>
      <ActivityIndicator color={colors.white} style={{ marginTop: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.white,
    marginTop: 20,
  },
  tagline: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.terracotta,
    letterSpacing: 2,
    marginTop: 8,
  },
});
