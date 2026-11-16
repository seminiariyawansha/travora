// src/app/location-permissions.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

function PermRow({ icon, title, subtitle, status, onPress, textPrimary, textSecondary }) {
  const color =
    status === "granted" ? "#10534a" : status === "denied" ? "#C0392B" : "#7A6F65";
  const label =
    status === "granted" ? "Allowed" : status === "denied" ? "Denied" : "Not set";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, textPrimary && { color: textPrimary }]}>{title}</Text>
        <Text style={[styles.rowSub, textSecondary && { color: textSecondary }]}>{subtitle}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: color + "22" }]}>
        <Text style={[styles.badgeTxt, { color }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export default function LocationPermissions() {
  const router = useRouter();
  const { colors: themeColors, isDark } = useTheme();
  const [fgStatus, setFgStatus] = useState("undetermined");
  const [bgStatus, setBgStatus] = useState("undetermined");

  useEffect(() => {
    (async () => {
      const fg = await Location.getForegroundPermissionsAsync();
      setFgStatus(fg.status);
      const bg = await Location.getBackgroundPermissionsAsync();
      setBgStatus(bg.status);
    })();
  }, []);

  const requestFg = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setFgStatus(status);
  };

  const requestBg = async () => {
    if (fgStatus !== "granted") {
      Alert.alert("Allow location first", "Please allow 'While Using' location first.");
      return;
    }
    const { status } = await Location.requestBackgroundPermissionsAsync();
    setBgStatus(status);
  };

  const openSettings = () => Linking.openSettings();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bgSecondary }]}>
      {/* header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Location Permissions</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* info banner */}
        <View style={[styles.banner, { backgroundColor: isDark ? "#172A3A" : "#E8F4FD" }]}>
          <Ionicons name="information-circle-outline" size={18} color="#0A6EBD" />
          <Text style={[styles.bannerTxt, { color: isDark ? "#A0CBE8" : "#1A3D5C" }]}>
            Travora uses your location to unlock nearby points of interest and show
            you relevant destinations on the map.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>PERMISSIONS</Text>
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.cardBorder }]}>
          <PermRow
            icon="navigate-outline"
            title="While Using the App"
            subtitle="Required to unlock nearby points on the map"
            status={fgStatus}
            onPress={fgStatus === "denied" ? openSettings : requestFg}
            textPrimary={themeColors.textPrimary}
            textSecondary={themeColors.textSecondary}
          />
          <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />
          <PermRow
            icon="location-outline"
            title="Always (Background)"
            subtitle="Allows geofence alerts even when app is closed"
            status={bgStatus}
            onPress={bgStatus === "denied" ? openSettings : requestBg}
            textPrimary={themeColors.textPrimary}
            textSecondary={themeColors.textSecondary}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>HOW IT'S USED</Text>
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.cardBorder }]}>
          {[
            { icon: "map-outline",       text: "Show your position on the destination map" },
            { icon: "lock-open-outline", text: "Auto-unlock points when you arrive on site" },
            { icon: "notifications-outline", text: "Alert you when you're near an unvisited point" },
          ].map((item) => (
            <View key={item.text} style={styles.usageRow}>
              <Ionicons name={item.icon} size={16} color={themeColors.teal} />
              <Text style={[styles.usageTxt, { color: themeColors.textPrimary }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Pressable style={[styles.openBtn, { borderColor: themeColors.teal }]} onPress={openSettings}>
          <Text style={[styles.openBtnTxt, { color: themeColors.teal }]}>Open Device Settings</Text>
          <Ionicons name="open-outline" size={15} color={themeColors.teal} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.teal,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  body: { padding: 20, gap: 12 },
  banner: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: "#E8F4FD", borderRadius: 12,
    padding: 14, borderLeftWidth: 3, borderLeftColor: "#0A6EBD",
  },
  bannerTxt: { flex: 1, color: "#1A3D5C", fontSize: 13, lineHeight: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#7A7A7A", letterSpacing: 1, marginTop: 6 },
  card: {
    backgroundColor: "#fff", borderRadius: 16,
    borderWidth: 1, borderColor: "#E8E8E8", overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600", color: "#1B1B1B" },
  rowSub: { fontSize: 12, color: "#7A7A7A", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeTxt: { fontSize: 11, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F1F1F1", marginLeft: 16 },
  usageRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  usageTxt: { fontSize: 13.5, color: "#3A3A3A", flex: 1 },
  openBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14,
    borderWidth: 1.5, borderColor: colors.teal, borderRadius: 12,
    marginTop: 4,
  },
  openBtnTxt: { color: colors.teal, fontWeight: "700", fontSize: 14 },
});
