// src/components/OnboardingMedia.js
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";

// Plays a short muted video on loop, only while its slide is on screen
function LoopingVideo({ source, isActive }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
      allowsFullscreen={false}
    />
  );
}

export default function OnboardingMedia({ media, icon, size, isActive }) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {media?.type === "video" ? (
        <LoopingVideo source={media.source} isActive={isActive} />
      ) : media?.type === "image" ? (
        <Image
          source={media.source}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.fallback}>
          <Ionicons name={icon} size={size * 0.34} color={colors.teal} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: "hidden",
    backgroundColor: "#CFE6E1",
    shadowColor: colors.teal,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center" },
});
