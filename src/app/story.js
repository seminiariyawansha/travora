// src/app/story.js
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Button from "../components/Button";
import { mockPoints } from "../data/mockData";
import { colors } from "../theme/colors";

export default function Story() {
  const router = useRouter();
  const { pointId } = useLocalSearchParams();
  const allPoints = Object.values(mockPoints).flat();
  const point = allPoints.find((p) => p.id === pointId) || allPoints[0];

  const player = useVideoPlayer(
    "https://www.w3schools.com/html/mov_bbb.mp4",
    (player) => {
      player.loop = false;
    },
  );

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
        <Text style={styles.storyText}>{point.content.storyText}</Text>

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
