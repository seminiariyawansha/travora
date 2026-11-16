// src/app/story.js  — "Field Notes" journal style
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getCachedPointById } from "../db/offlineContentService";
import { isOnlineNow } from "../db/networkService";
import { auth } from "../services/firebaseConfig";
import { resolvePointContent } from "../services/contentResolver";
import { getPoints } from "../services/destinationService";
import { getUserProgress } from "../services/progressService";
import { colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { getPointPhoto } from "../utils/destinationImages";

// ─── tiny helpers ────────────────────────────────────────────────────────────
const TEAL       = "#10534a";
const CREAM      = "#F5F0E8";
const INK        = "#1B1611";
const RUST       = "#C0470A";
const GOLD       = "#D4A843";
const PAPER_LINE = "#DDD5C8";

/** Decorative drop-cap letter */
function DropCap({ char }) {
  return (
    <View style={dc.wrap}>
      <Text style={dc.letter}>{char}</Text>
    </View>
  );
}
const dc = StyleSheet.create({
  wrap: {
    float: "left", // hint only — we'll use inline layout trick below
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginBottom: 2,
    alignSelf: "flex-start",
  },
  letter: { fontSize: 32, fontWeight: "900", color: "#fff", lineHeight: 38 },
});

/** Horizontal rule with diamond ornament */
function Ornament() {
  return (
    <View style={orn.row}>
      <View style={orn.line} />
      <Text style={orn.diamond}>◆</Text>
      <View style={orn.line} />
    </View>
  );
}
const orn = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: PAPER_LINE },
  diamond: { color: GOLD, fontSize: 10, marginHorizontal: 10 },
});

/** Points pill — small stamp style */
function PointsStamp({ value }) {
  return (
    <View style={ps.wrap}>
      <Text style={ps.label}>+{value}</Text>
      <Text style={ps.sub}>PTS</Text>
    </View>
  );
}
const ps = StyleSheet.create({
  wrap: {
    borderWidth: 2,
    borderColor: GOLD,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  label: { color: GOLD, fontSize: 15, fontWeight: "900", letterSpacing: 0.5 },
  sub: { color: GOLD, fontSize: 7, fontWeight: "700", letterSpacing: 2, marginTop: -2 },
});

// ─── loading / error screens ──────────────────────────────────────────────────
function LoadingScreen() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <SafeAreaView style={[s.root, { justifyContent: "center", alignItems: "center", gap: 14 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />
      <Animated.Text style={{ fontSize: 32, opacity: pulse }}>📖</Animated.Text>
      <Text style={{ color: INK, fontWeight: "700", letterSpacing: 1, fontSize: 13 }}>
        TURNING THE PAGE…
      </Text>
    </SafeAreaView>
  );
}

function ErrorScreen({ message, onBack }) {
  return (
    <SafeAreaView style={[s.root, { justifyContent: "center", alignItems: "center", padding: 32 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />
      <Text style={{ fontSize: 36, marginBottom: 12 }}>🗺️</Text>
      <Text style={{ color: INK, fontWeight: "700", fontSize: 15, textAlign: "center", marginBottom: 6 }}>
        Lost the trail
      </Text>
      <Text style={{ color: "#7A6F65", fontSize: 13, textAlign: "center", marginBottom: 24 }}>
        {message || "Story not found."}
      </Text>
      <Pressable onPress={onBack} style={err.btn}>
        <Ionicons name="arrow-back" size={14} color="#fff" />
        <Text style={err.btnTxt}>Head Back</Text>
      </Pressable>
    </SafeAreaView>
  );
}
const err = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: TEAL,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
});

// ─── main screen ─────────────────────────────────────────────────────────────
export default function Story() {
  const router = useRouter();
  const { pointId, destinationId } = useLocalSearchParams();
  const { isDark } = useTheme();

  const paperBg   = isDark ? "#141716" : CREAM;
  const paperInk  = isDark ? "#EDE8E0" : INK;
  const paperLine = isDark ? "#28302D" : PAPER_LINE;
  const cardBg    = isDark ? "#1C211F" : "#fff";

  const [point,     setPoint]     = useState(null);
  const [content,   setContent]   = useState(null);
  const [allPoints, setAllPoints] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // scroll-driven header parallax
  const scrollY   = useRef(new Animated.Value(0)).current;
  const imgTransY = scrollY.interpolate({ inputRange: [0, 200], outputRange: [0, -60], extrapolate: "clamp" });
  const imgOpacity = scrollY.interpolate({ inputRange: [0, 160], outputRange: [1, 0.3], extrapolate: "clamp" });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        let found = null, resolvedContent = null, pointsList = [];

        const online = await isOnlineNow();
        const cached = await getCachedPointById(pointId);

        if (cached) {
          found = cached;
          resolvedContent = {
            storyText: cached.storyText ?? "",
            images: cached.imageLocalPaths || [],
            imageUrl: cached.imageLocalPaths?.[0] || null,
            videoUrl: cached.videoLocalPath || null,
          };
        }

        if (!found && online) {
          try {
            pointsList = await getPoints(destinationId);
            found = pointsList.find((p) => p.id === pointId);
            resolvedContent = await resolvePointContent(destinationId, pointId);
          } catch (err) {
            console.log("Online story fetch failed:", err?.message || err);
          }
        }

        setPoint(found);
        setContent(resolvedContent);
        setAllPoints(pointsList);
      } catch {
        setError("Could not load story. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pointId, destinationId]);

  const player = useVideoPlayer(null, (p) => { p.loop = false; });
  useEffect(() => { if (content?.videoUrl) player.replace(content.videoUrl); }, [content]);

  const handleContinue = async () => {
    try {
      const uid       = auth.currentUser?.uid ?? "guest";
      const progress  = await getUserProgress(uid, destinationId ?? "sigiriya");
      const unlockedIds  = progress?.unlockedPoints ?? [];
      const totalPoints  = progress?.totalPoints ?? 0;
      const allUnlocked  = allPoints.length > 0 && allPoints.every((p) => unlockedIds.includes(p.id));
      if (allUnlocked) {
        router.push({ pathname: "/badge", params: { destinationName: destinationId ?? "Sigiriya", totalPoints } });
      } else {
        router.push({ pathname: "/destination", params: { destinationId: destinationId ?? "sigiriya" } });
      }
    } catch { router.back(); }
  };

  if (loading) return <LoadingScreen />;
  if (error || !point || !content) return <ErrorScreen message={error} onBack={() => router.back()} />;

  // Split story into paragraphs for journal feel
  const rawStory = (content.storyText || "").trim();
  const paragraphs = (rawStory || "Story coming soon.").split(/\n+/).filter(Boolean);
  const firstChar  = paragraphs[0]?.[0] ?? "";
  const firstRest  = paragraphs[0]?.slice(1) ?? "";

  const isValidPhoto = (url) => typeof url === "string" && (url.startsWith("http") || url.startsWith("file://"));
  const hasLocalPhotos = Array.isArray(point?.imageLocalPaths) && point.imageLocalPaths.length > 0;
  const photoUri =
    (Array.isArray(point?.imageLocalPaths) && isValidPhoto(point.imageLocalPaths[0]) && point.imageLocalPaths[0]) ||
    (isValidPhoto(content?.imageUrl) && content.imageUrl) ||
    (Array.isArray(content?.images) && isValidPhoto(content.images[0]) && content.images[0]) ||
    (isValidPhoto(point?.imageUrl) && point.imageUrl) ||
    getPointPhoto(point?.id || pointId, point?.name, destinationId);

  return (
    <View style={[s.root, { backgroundColor: paperBg }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── FULL-BLEED PARALLAX HEADER IMAGE ── */}
      <View style={s.heroWrap}>
        <Animated.View style={[s.heroImgWrap, { transform: [{ translateY: imgTransY }], opacity: imgOpacity }]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={s.heroImg} resizeMode="cover" />
          ) : (
            <View style={[s.heroImg, { backgroundColor: "#1B3A35" }]} />
          )}
        </Animated.View>

        {/* dark vignette gradient overlay */}
        <View style={s.heroDimTop} />
        <View style={s.heroDimBottom} />

        {/* back button */}
        <SafeAreaView style={s.heroControls}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </Pressable>
          <PointsStamp value={point.pointsValue ?? 0} />
        </SafeAreaView>

        {/* title block at bottom of hero */}
        <View style={s.heroTitleBlock}>
          <Text style={s.heroEyebrow}>
            {destinationId ? destinationId.toUpperCase() : "DESTINATION"} · FIELD NOTES
          </Text>
          <Text style={s.heroTitle} numberOfLines={3}>{point.name}</Text>
        </View>
      </View>

      {/* ── PAPER BODY ── */}
      <Animated.ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        {/* torn paper top edge */}
        <View style={[s.tornEdge, { backgroundColor: paperBg }]}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View
              key={i}
              style={[
                s.tornTooth,
                { height: 8 + (i % 3) * 4, marginTop: i % 2 === 0 ? -4 : 0, backgroundColor: paperBg },
              ]}
            />
          ))}
        </View>

        <View style={[s.paperBody, { backgroundColor: paperBg }]}>
          {/* chapter marker */}
          <View style={s.chapterRow}>
            <View style={[s.chapterLine, { backgroundColor: paperLine }]} />
            <Text style={s.chapterLabel}>CHAPTER I</Text>
            <View style={[s.chapterLine, { backgroundColor: paperLine }]} />
          </View>

          {/* first paragraph with drop-cap */}
          {paragraphs.length > 0 && (
            <View style={s.firstParaWrap}>
              <DropCap char={firstChar} />
              <Text style={[s.bodyText, { color: paperInk }]}>{firstRest}</Text>
            </View>
          )}

          <Ornament />

          {/* remaining paragraphs */}
          {paragraphs.slice(1).map((para, i) => (
            <Text key={i} style={[s.bodyText, { marginBottom: 14, color: paperInk }]}>{para}</Text>
          ))}

          {/* media — full bleed with caption strip */}
          {((hasLocalPhotos && photoUri) || (Array.isArray(content?.images) && content.images.length > 0)) && !content.videoUrl && (
            <View style={[s.mediaCard, { backgroundColor: cardBg, borderColor: paperLine }]}>
              <Image source={{ uri: photoUri }} style={s.mediaImg} resizeMode="cover" />
              <View style={s.captionStrip}>
                <Ionicons name="camera-outline" size={11} color={GOLD} />
                <Text style={s.captionTxt}>  On location — {point.name}</Text>
              </View>
            </View>
          )}

          {!!content.videoUrl && (
            <View style={[s.mediaCard, { backgroundColor: cardBg, borderColor: paperLine }]}>
              <View style={s.videoBox}>
                <VideoView
                  style={{ width: "100%", height: "100%" }}
                  player={player}
                  allowsFullscreen
                  nativeControls
                />
              </View>
              <View style={s.captionStrip}>
                <Ionicons name="videocam-outline" size={11} color={GOLD} />
                <Text style={s.captionTxt}>  Field recording — {point.name}</Text>
              </View>
            </View>
          )}

          <Ornament />

          {/* CTA — stamped button feel */}
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [s.ctaBtn, pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]}
          >
            <Text style={s.ctaTxt}>Continue Exploring</Text>
            <Ionicons name="arrow-forward" size={16} color={isDark ? "#fff" : CREAM} style={{ marginLeft: 8 }} />
          </Pressable>

          {/* footer stamp */}
          <View style={s.footerStamp}>
            <Text style={[s.footerTxt, { color: paperLine }]}>TRAVORA  ·  FIELD JOURNAL</Text>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const HERO_H = 340;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },

  // hero
  heroWrap:       { width: "100%", height: HERO_H, overflow: "hidden" },
  heroImgWrap:    { position: "absolute", top: 0, left: 0, right: 0, height: HERO_H + 60 },
  heroImg:        { width: "100%", height: "100%" },
  heroDimTop: {
    position: "absolute", top: 0, left: 0, right: 0, height: 100,
    // manual gradient via stacked views
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  heroDimBottom: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 160,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  heroControls: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 18, paddingTop: 12,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  heroTitleBlock: {
    position: "absolute", bottom: 20, left: 20, right: 20,
  },
  heroEyebrow: {
    color: GOLD, fontSize: 9.5, fontWeight: "800",
    letterSpacing: 2.5, marginBottom: 5,
  },
  heroTitle: {
    color: "#fff", fontSize: 26, fontWeight: "900",
    lineHeight: 31, letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },

  // torn edge
  tornEdge: {
    flexDirection: "row", height: 20,
    backgroundColor: CREAM, marginTop: -1,
  },
  tornTooth: {
    flex: 1, backgroundColor: CREAM,
    borderTopLeftRadius: 3, borderTopRightRadius: 3,
  },

  // scroll / paper body
  scroll: { flex: 1, marginTop: -20 },
  scrollContent: { paddingBottom: 50 },
  paperBody: { backgroundColor: CREAM, paddingHorizontal: 24, paddingTop: 4 },

  // chapter marker
  chapterRow: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  chapterLine: { flex: 1, height: 1, backgroundColor: PAPER_LINE },
  chapterLabel: {
    color: RUST, fontSize: 9, fontWeight: "800",
    letterSpacing: 3, marginHorizontal: 12,
  },

  // first paragraph drop-cap layout
  firstParaWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },

  // body text — serif-ish feel via increased lineHeight
  bodyText: {
    fontSize: 14.5, lineHeight: 25,
    color: INK, letterSpacing: 0.1,
  },

  // media card — polaroid style
  mediaCard: {
    marginVertical: 10,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: PAPER_LINE,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  mediaImg: { width: "100%", aspectRatio: 4 / 3 },
  videoBox: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#0D0D0D" },
  captionStrip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: INK, paddingVertical: 7, paddingHorizontal: 12,
  },
  captionTxt: { color: "#C8BEA8", fontSize: 10.5, fontStyle: "italic", letterSpacing: 0.5 },

  // CTA button — solid stamp feel
  ctaBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEAL,
    paddingVertical: 15,
    borderRadius: 6,
    borderBottomWidth: 4,
    borderBottomColor: "#072E29",
  },
  ctaTxt: {
    color: CREAM, fontSize: 14, fontWeight: "800",
    letterSpacing: 1.2, textTransform: "uppercase",
  },

  // footer
  footerStamp: { alignItems: "center", marginTop: 32, marginBottom: 8 },
  footerTxt: {
    color: PAPER_LINE, fontSize: 9, fontWeight: "700",
    letterSpacing: 3, textTransform: "uppercase",
  },
});
