// src/app/story.js
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Button from "../components/Button";
import QuizCard from "../components/QuizCard";
import ScreenContainer from "../components/ScreenContainer";
import { resolvePointContent } from "../services/contentResolver";
import { getPoints } from "../services/destinationService";
import { auth } from "../services/firebaseConfig";
import { colors } from "../theme/colors";
import { useResponsive } from "../theme/responsive";
import { extractQuiz, getImageList } from "../utils/pointContent";
import { loadVisitedIds } from "../utils/visitedPoints";

export default function Story() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, moderateScale } = useResponsive();
  const { pointId, destinationId } = useLocalSearchParams();

  const [access, setAccess] = useState("checking"); // checking | locked | unlocked
  const [point, setPoint] = useState(null);
  const [content, setContent] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [viewerImage, setViewerImage] = useState(null);

  // Data loading: always runs. The content is only fetched if the point is unlocked.
  useEffect(() => {
    let active = true;

    async function load() {
      setAccess("checking");
      const userId = auth.currentUser?.uid;

      let visited = await loadVisitedIds(userId, destinationId);

      // Right after an unlock, the save can still be finishing. Check once more.
      if (!visited.has(pointId)) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        visited = await loadVisitedIds(userId, destinationId);
      }

      const points = await getPoints(destinationId);
      const found = points.find((p) => p.id === pointId);
      if (!active) return;
      setPoint(found);

      if (!visited.has(pointId)) {
        setContent(null);
        setAccess("locked");
        return;
      }

      const resolvedContent = await resolvePointContent(destinationId, pointId);
      if (!active) return;
      setContent(resolvedContent);
      setAccess("unlocked");
    }

    load();
    return () => {
      active = false;
    };
  }, [pointId, destinationId]);

  // Video player: always called, starts with no source
  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  // Once content arrives, load its real video into the existing player
  useEffect(() => {
    if (content?.videoUrl) {
      player.replace(content.videoUrl);
    }
  }, [content]);

  const images = useMemo(() => getImageList(point, content), [point, content]);
  const questions = useMemo(
    () => extractQuiz(point, content),
    [point, content],
  );

  // Every hook above runs on every render: only the JSX below is conditional
  if (access === "checking") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.teal} />
        </View>
      </SafeAreaView>
    );
  }

  if (access === "locked") {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.hero}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.lockedBox}>
          <View style={styles.lockCircle}>
            <Ionicons name="lock-closed" size={34} color={colors.white} />
          </View>
          <Text style={styles.lockedTitle}>
            {point?.name ?? "This place"} is locked
          </Text>
          <Text style={styles.lockedText}>
            Visit this place in person to unlock its story, photos, video and
            quiz.
          </Text>

          <View style={{ width: "100%", maxWidth: 360, marginTop: 8 }}>
            <Button
              title="Find it on the map"
              onPress={() => router.push("/(tabs)/map")}
            />
          </View>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.lockedBack}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!point || !content) return null;

  const imageWidth = contentMaxWidth - 40;
  const imageHeight = imageWidth * 0.62;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.hero}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>
        <Text style={styles.ptsBadge}>
          +{point.pointsValue ?? 0} pts earned
        </Text>
      </View>

      <ScreenContainer>
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            gap: 16,
            paddingBottom: insets.bottom + 28,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { fontSize: moderateScale(21) }]}>
            {point.name}
          </Text>

          {/* Images */}
          {images.length > 0 && (
            <View style={{ gap: 8 }}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={imageWidth}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) =>
                  setImageIndex(
                    Math.round(e.nativeEvent.contentOffset.x / imageWidth),
                  )
                }
                style={{ width: imageWidth, alignSelf: "center" }}
              >
                {images.map((uri, i) => (
                  <Pressable
                    key={`${uri}-${i}`}
                    onPress={() => setViewerImage(uri)}
                  >
                    <Image
                      source={{ uri }}
                      style={{
                        width: imageWidth,
                        height: imageHeight,
                        borderRadius: 16,
                        backgroundColor: colors.divider,
                      }}
                      contentFit="cover"
                      transition={200}
                    />
                  </Pressable>
                ))}
              </ScrollView>

              {images.length > 1 && (
                <View style={styles.dots}>
                  {images.map((uri, i) => (
                    <View
                      key={`${uri}-dot-${i}`}
                      style={[styles.dot, i === imageIndex && styles.dotActive]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Story */}
          {content.storyText ? (
            <Text style={[styles.storyText, { fontSize: moderateScale(13.5) }]}>
              {content.storyText}
            </Text>
          ) : null}

          {/* Video */}
          {content.videoUrl ? (
            <View style={styles.videoBox}>
              <VideoView
                style={{ width: "100%", height: "100%" }}
                player={player}
                allowsFullscreen
                nativeControls
              />
            </View>
          ) : null}

          {/* Quiz */}
          <QuizCard questions={questions} />

          <Button title="Continue Exploring" onPress={() => router.back()} />
        </ScrollView>
      </ScreenContainer>

      {/* Tap an image to see it full size */}
      <Modal
        visible={!!viewerImage}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
      >
        <Pressable style={styles.viewer} onPress={() => setViewerImage(null)}>
          {viewerImage && (
            <Image
              source={{ uri: viewerImage }}
              style={styles.viewerImage}
              contentFit="contain"
            />
          )}
          <View style={styles.viewerClose}>
            <Ionicons name="close" size={22} color={colors.white} />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: {
    height: 70,
    backgroundColor: colors.teal,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  ptsBadge: {
    backgroundColor: colors.terracotta,
    color: colors.ink,
    fontSize: 11.5,
    fontWeight: "700",
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    overflow: "hidden",
  },
  title: { fontWeight: "700", color: colors.ink },
  storyText: { lineHeight: 22, color: "#3A332C" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#DCD3C4" },
  dotActive: { width: 20, backgroundColor: colors.terracotta },
  videoBox: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0D0D0D",
    aspectRatio: 16 / 9,
  },
  lockedBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  lockCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.gray,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
  },
  lockedText: {
    fontSize: 13.5,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 20,
  },
  lockedBack: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.gray,
    marginTop: 6,
  },
  viewer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerImage: { width: "100%", height: "80%" },
  viewerClose: {
    position: "absolute",
    top: 54,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});
