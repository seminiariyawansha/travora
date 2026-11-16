// src/app/story.js
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import {
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Button from "../components/Button";
import { getCachedPointById } from "../db/offlineContentService";
import { auth } from "../services/firebaseConfig";
import { resolvePointContent } from "../services/contentResolver";
import { getPoints } from "../services/destinationService";
import { getUserProgress } from "../services/progressService";
import { colors } from "../theme/colors";

export default function Story() {
  const router = useRouter();
  const { pointId, destinationId } = useLocalSearchParams();
  const [point, setPoint] = useState(null);
  const [content, setContent] = useState(null);
  const [allPoints, setAllPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data loading — always runs; falls back to SQLite cache offline
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        let found = null;
        let resolvedContent = null;
        let pointsList = [];

        try {
          pointsList = await getPoints(destinationId);
          found = pointsList.find((p) => p.id === pointId);
          resolvedContent = await resolvePointContent(destinationId, pointId);
        } catch (networkErr) {
          // Offline fallback: SQLite cache
          const cached = await getCachedPointById(pointId);
          if (cached) {
            found = cached;
            resolvedContent = {
              storyText: cached.storyText || "No story available offline.",
              imageUrl: cached.imageLocalPaths?.[0] || null,
              videoUrl: cached.videoLocalPath || null,
            };
          }
        }

        setPoint(found);
        setContent(resolvedContent);
        setAllPoints(pointsList);
      } catch (e) {
        setError("Could not load story. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pointId, destinationId]);

  // Video player — always called (hook rules), starts with no source
  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  // Once content arrives with a video, load it into the player
  useEffect(() => {
    if (content?.videoUrl) {
      player.replace(content.videoUrl);
    }
  }, [content]);

  // "Continue Exploring" — goes to badge if all points unlocked, else back to destination
  const handleContinue = async () => {
    try {
      const uid = auth.currentUser?.uid ?? "guest";
      const progress = await getUserProgress(uid, destinationId ?? "sigiriya");
      const unlockedIds = progress?.unlockedPoints ?? [];
      const totalPoints = progress?.totalPoints ?? 0;

      const allUnlocked =
        allPoints.length > 0 &&
        allPoints.every((p) => unlockedIds.includes(p.id));

      if (allUnlocked) {
        router.push({
          pathname: "/badge",
          params: {
            destinationName: destinationId ?? "Sigiriya",
            totalPoints,
          },
        });
      } else {
        // Go back to the destination screen
        router.push({
          pathname: "/destination",
          params: { destinationId: destinationId ?? "sigiriya" },
        });
      }
    } catch {
      // Fallback: just go back
      router.back();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.ink }}>Loading story…</Text>
      </SafeAreaView>
    );
  }

  if (error || !point || !content) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.ink }}>{error || "Story not found."}</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.teal, fontWeight: "700" }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>
        <Text style={styles.ptsBadge}>+{point.pointsValue} pts earned</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={styles.title}>{point.name}</Text>
        <Text style={styles.storyText}>{content.storyText}</Text>

        {/* Show image if available and no video */}
        {content.imageUrl && !content.videoUrl && (
          <Image
            source={{ uri: content.imageUrl }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        )}

        {/* Show video player only when there's an actual video URL */}
        {content.videoUrl && (
          <View style={styles.videoBox}>
            <VideoView
              style={{ width: "100%", height: "100%" }}
              player={player}
              allowsFullscreen
              nativeControls
            />
          </View>
        )}

        <Button title="Continue Exploring" onPress={handleContinue} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  hero: {
    height: 90,
    backgroundColor: colors.teal,
    padding: 18,
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
  },
  title: { fontSize: 21, fontWeight: "700", color: colors.ink },
  storyText: { fontSize: 13.5, lineHeight: 22, color: "#3A332C" },
  mediaImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
  },
  videoBox: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0D0D0D",
    aspectRatio: 16 / 9,
  },
});

export default function Story() {
  const router = useRouter();
  const { pointId, destinationId } = useLocalSearchParams();
  const [point, setPoint] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data loading — always runs; falls back to SQLite cache offline
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        let found = null;
        let resolvedContent = null;

        try {
          const points = await getPoints(destinationId);
          found = points.find((p) => p.id === pointId);
          resolvedContent = await resolvePointContent(destinationId, pointId);
        } catch (networkErr) {
          // Offline fallback: SQLite cache
          const cached = await getCachedPointById(pointId);
          if (cached) {
            found = cached;
            resolvedContent = {
              storyText: cached.story || "No story available offline.",
              imageUrl: cached.imageUrl || null,
              videoUrl: cached.videoUrl || null,
            };
          }
        }

        setPoint(found);
        setContent(resolvedContent);
      } catch (e) {
        setError("Could not load story. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pointId, destinationId]);

  // Video player — always called (hook rules), starts with no source
  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  // Once content arrives with a video, load it into the player
  useEffect(() => {
    if (content?.videoUrl) {
      player.replace(content.videoUrl);
    }
  }, [content]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.ink }}>Loading story…</Text>
      </SafeAreaView>
    );
  }

  if (error || !point || !content) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.ink }}>{error || "Story not found."}</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.teal, fontWeight: "700" }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>
        <Text style={styles.ptsBadge}>+{point.pointsValue} pts earned</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={styles.title}>{point.name}</Text>
        <Text style={styles.storyText}>{content.storyText}</Text>

        {/* Show image if available and no video */}
        {content.imageUrl && !content.videoUrl && (
          <Image
            source={{ uri: content.imageUrl }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        )}

        {/* Show video player only when there's an actual video URL */}
        {content.videoUrl && (
          <View style={styles.videoBox}>
            <VideoView
              style={{ width: "100%", height: "100%" }}
              player={player}
              allowsFullscreen
              nativeControls
            />
          </View>
        )}

        <Button
          title="Continue Exploring"
          onPress={() => router.push("/unlock")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  hero: {
    height: 90,
    backgroundColor: colors.teal,
    padding: 18,
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
  },
  title: { fontSize: 21, fontWeight: "700", color: colors.ink },
  storyText: { fontSize: 13.5, lineHeight: 22, color: "#3A332C" },
  mediaImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
  },
  videoBox: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0D0D0D",
    aspectRatio: 16 / 9,
  },
});
