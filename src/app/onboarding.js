// src/app/onboarding.js
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Button from "../components/Button";
import ScreenContainer from "../components/ScreenContainer";
import { colors } from "../theme/colors";
import { useResponsive } from "../theme/responsive";

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { moderateScale } = useResponsive();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenContainer style={{ padding: 24, justifyContent: "space-between" }}>
        <View style={styles.content}>
          <Text style={[styles.title, { fontSize: moderateScale(26) }]}>
            Discover Sri Lanka{"\n"}in a whole new way
          </Text>
          <Text style={[styles.subtitle, { fontSize: moderateScale(13.5) }]}>
            Visit real-world places, walk to points of interest, and unlock
            stories, images and videos.
          </Text>
        </View>
        <View style={{ paddingBottom: insets.bottom + 16 }}>
          <Button
            title="Get Started"
            onPress={() => router.push("/register")}
          />
        </View>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  content: { flex: 1, justifyContent: "center" },
  title: { fontWeight: "700", color: colors.ink, lineHeight: 34 },
  subtitle: { color: colors.gray, marginTop: 14, lineHeight: 20 },
});
