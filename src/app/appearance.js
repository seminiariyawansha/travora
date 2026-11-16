// src/app/appearance.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

const OPTIONS = [
  {
    value: "light",
    label: "Light",
    desc: "Classic bright interface",
    icon: "sunny-outline",
  },
  {
    value: "dark",
    label: "Dark",
    desc: "Easy on the eyes at night",
    icon: "moon-outline",
  },
  {
    value: "system",
    label: "System Default",
    desc: "Follows your phone's setting",
    icon: "phone-portrait-outline",
  },
];

export default function Appearance() {
  const router = useRouter();
  const { theme, setTheme, colors, isDark } = useTheme();

  const bg         = colors.bg;
  const surface    = colors.surface;
  const primary    = colors.textPrimary;
  const secondary  = colors.textSecondary;
  const border     = colors.cardBorder;
  const accent     = colors.teal;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.headerBg} />

      {/* header */}
      <View style={[s.header, { backgroundColor: colors.headerBg }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>Appearance</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.body}>
        {/* preview card */}
        <View style={[s.preview, { backgroundColor: surface, borderColor: border }]}>
          <View style={[s.previewHeader, { backgroundColor: accent }]}>
            <Text style={s.previewHeaderTxt}>Travora Preview</Text>
          </View>
          <View style={[s.previewBody, { backgroundColor: isDark ? "#1E1E1E" : "#F9F9F9" }]}>
            <View style={[s.previewCard, { backgroundColor: surface, borderColor: border }]}>
              <Ionicons name="map-outline" size={18} color={accent} />
              <Text style={[s.previewTxt, { color: primary }]}>Destination card</Text>
            </View>
            <Text style={[s.previewSub, { color: secondary }]}>
              {isDark ? "🌙 Dark mode active" : "☀️ Light mode active"}
            </Text>
          </View>
        </View>

        <Text style={[s.sectionLabel, { color: secondary }]}>CHOOSE THEME</Text>

        {/* options */}
        <View style={[s.card, { backgroundColor: surface, borderColor: border }]}>
          {OPTIONS.map((opt, i) => {
            const selected = theme === opt.value;
            return (
              <View key={opt.value}>
                <Pressable
                  onPress={() => setTheme(opt.value)}
                  style={({ pressed }) => [
                    s.row,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  {/* icon bubble */}
                  <View style={[s.iconBubble, { backgroundColor: selected ? accent + "22" : (isDark ? "#2A2A2A" : "#F2F2F2") }]}>
                    <Ionicons name={opt.icon} size={22} color={selected ? accent : secondary} />
                  </View>

                  {/* text */}
                  <View style={s.rowText}>
                    <Text style={[s.rowLabel, { color: primary, fontWeight: selected ? "700" : "500" }]}>
                      {opt.label}
                    </Text>
                    <Text style={[s.rowDesc, { color: secondary }]}>{opt.desc}</Text>
                  </View>

                  {/* radio */}
                  <View style={[s.radio, { borderColor: selected ? accent : border }]}>
                    {selected && <View style={[s.radioDot, { backgroundColor: accent }]} />}
                  </View>
                </Pressable>

                {i < OPTIONS.length - 1 && (
                  <View style={[s.divider, { backgroundColor: border }]} />
                )}
              </View>
            );
          })}
        </View>

        <Text style={[s.footNote, { color: secondary }]}>
          Your preference is saved automatically and applies across all screens.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  header:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle:   { color: "#fff", fontSize: 16, fontWeight: "700" },
  body:          { flex: 1, padding: 20, gap: 14 },
  preview:       { borderRadius: 16, overflow: "hidden", borderWidth: 1 },
  previewHeader: { paddingHorizontal: 14, paddingVertical: 10 },
  previewHeaderTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  previewBody:   { padding: 14, gap: 10 },
  previewCard:   { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 10, borderWidth: 1 },
  previewTxt:    { fontSize: 13, fontWeight: "600" },
  previewSub:    { fontSize: 12, textAlign: "center" },
  sectionLabel:  { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginTop: 4 },
  card:          { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row:           { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  iconBubble:    { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowText:       { flex: 1 },
  rowLabel:      { fontSize: 14.5 },
  rowDesc:       { fontSize: 12, marginTop: 2 },
  radio:         { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot:      { width: 11, height: 11, borderRadius: 6 },
  divider:       { height: 1, marginLeft: 16 },
  footNote:      { fontSize: 12, textAlign: "center", lineHeight: 18 },
});
