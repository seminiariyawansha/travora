// src/app/onboarding.js
import { useRouter } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import { colors } from "../theme/colors";

export default function Onboarding() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Discover Sri Lanka{"\n"}in a whole new way
        </Text>
        <Text style={styles.subtitle}>
          Visit real-world places, walk to points of interest, and unlock
          stories, images and videos.
        </Text>
      </View>
      <Button title="Get Started" onPress={() => router.push("/register")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
    padding: 24,
    justifyContent: "space-between",
  },
  content: { flex: 1, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700", color: colors.ink, lineHeight: 34 },
  subtitle: {
    fontSize: 13.5,
    color: colors.gray,
    marginTop: 14,
    lineHeight: 20,
  },
});
