// src/app/story.js
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Button from "../components/Button";
import { resolvePointContent } from "../services/contentResolver";
import { getPoints } from "../services/destinationService";
import { colors } from "../theme/colors";

export default function Story() {
  const router = useRouter();
  const { pointId, destinationId } = useLocalSearchParams();
  const [point, setPoint] = useState(null);
  const [content, setContent] = useState(null);

  // Data loading — always runs
  useEffect(() => {
    async function load() {
      const points = await getPoints(destinationId);
      const found = points.find((p) => p.id === pointId);
      const resolvedContent = await resolvePointContent(destinationId, pointId);
      setPoint(found);
      setContent(resolvedContent);
    }
    load();
  }, [pointId, destinationId]);

  // Video player — always called, starts with no source
  const player = useVideoPlayer(null, (player) => {
    player.loop = false;
  });

  // Once content arrives, load its real video into the existing player
  useEffect(() => {
    if (content?.videoUrl) {
      player.replace(content.videoUrl);
    }
  }, [content]);

  // Every hook above runs on every render — only the JSX below is conditional
  if (!point || !content) return null;

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

        <View style={styles.videoBox}>
          <VideoView
            style={{ width: "100%", height: "100%" }}
            player={player}
            allowsFullscreen
            nativeControls
          />
        </View>

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
  videoBox: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0D0D0D",
    aspectRatio: 16 / 9,
  },
});
