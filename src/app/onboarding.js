// src/app/onboarding.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OnboardingMedia from "../components/OnboardingMedia";
import { onboardingSlides } from "../data/onboardingSlides";
import { colors } from "../theme/colors";
import { useResponsive } from "../theme/responsive";

function Chip({ chip, size }) {
  const offset = size * 0.07;
  return (
    <View
      style={[
        styles.chip,
        { top: size * chip.top },
        chip.side === "left" ? { left: -offset } : { right: -offset },
      ]}
    >
      <Ionicons name={chip.icon} size={15} color={colors.terracotta} />
      <Text style={styles.chipText}>{chip.label}</Text>
    </View>
  );
}

function Slide({
  item,
  width,
  height,
  circleSize,
  isActive,
  topPadding,
  bottomPadding,
}) {
  const { moderateScale } = useResponsive();

  return (
    <View
      style={{
        width,
        paddingTop: topPadding,
        paddingBottom: bottomPadding,
        alignItems: "center",
      }}
    >
      <View style={{ width: circleSize, height: circleSize }}>
        <View style={[styles.ring, { borderRadius: (circleSize + 40) / 2 }]} />
        <OnboardingMedia
          media={item.media}
          icon={item.icon}
          size={circleSize}
          isActive={isActive}
        />
        {item.chips.map((chip) => (
          <Chip key={chip.label} chip={chip} size={circleSize} />
        ))}
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.title, { fontSize: moderateScale(26) }]}>
          {item.title}
        </Text>
        <Text style={[styles.subtitle, { fontSize: moderateScale(13.5) }]}>
          {item.subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { moderateScale } = useResponsive();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const isLast = index === onboardingSlides.length - 1;
  const circleSize = Math.min(width * 0.74, height * 0.36, 340);
  const controlsWidth = Math.min(width - 56, 520);

  function goToLogin() {
    router.replace("/login");
  }

  function handleNext() {
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }

  function handleScrollEnd(event) {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={onboardingSlides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item, index: itemIndex }) => (
          <Slide
            item={item}
            width={width}
            height={height}
            circleSize={circleSize}
            isActive={itemIndex === index}
            topPadding={insets.top + height * 0.07}
            bottomPadding={150}
          />
        )}
      />

      {/* Controls stay fixed while the slides swipe */}
      <View style={[styles.controls, { bottom: insets.bottom + 24 }]}>
        <View style={{ width: controlsWidth, alignSelf: "center" }}>
          {isLast ? (
            <>
              <Pressable onPress={goToLogin} style={styles.startButton}>
                <Text
                  style={[styles.startText, { fontSize: moderateScale(15) }]}
                >
                  Get Started
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.replace("/register")}
                hitSlop={8}
              >
                <Text style={styles.linkText}>
                  New here?{" "}
                  <Text style={styles.linkStrong}>Create an account</Text>
                </Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.row}>
              <Pressable
                onPress={goToLogin}
                hitSlop={10}
                style={styles.skipWrap}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>

              <View style={styles.dots}>
                {onboardingSlides.map((slide, i) => (
                  <View
                    key={slide.id}
                    style={[styles.dot, i === index && styles.dotActive]}
                  />
                ))}
              </View>

              <Pressable onPress={handleNext} style={styles.nextButton}>
                <Text style={styles.nextText}>Next</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBF7EF" },
  ring: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(11,79,74,0.2)",
  },
  chip: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 11,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  chipText: { fontSize: 11.5, fontWeight: "700", color: colors.ink },
  textBlock: {
    marginTop: 56,
    paddingHorizontal: 38,
    alignItems: "center",
    maxWidth: 520,
  },
  title: {
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
    lineHeight: 33,
  },
  subtitle: {
    color: colors.gray,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 21,
  },
  controls: { position: "absolute", left: 0, right: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skipWrap: { minWidth: 70, paddingVertical: 8 },
  skipText: { fontSize: 14, fontWeight: "500", color: colors.gray },
  dots: { flexDirection: "row", alignItems: "center", gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#DCD3C4" },
  dotActive: { width: 24, backgroundColor: colors.terracotta },
  nextButton: {
    backgroundColor: colors.teal,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 30,
    shadowColor: colors.teal,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  nextText: { color: colors.white, fontSize: 14.5, fontWeight: "600" },
  startButton: {
    backgroundColor: colors.teal,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: "center",
    shadowColor: colors.teal,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  startText: { color: colors.white, fontWeight: "600", letterSpacing: 0.3 },
  linkText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 12.5,
    color: colors.gray,
  },
  linkStrong: { color: colors.teal, fontWeight: "600" },
});
