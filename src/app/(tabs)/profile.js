// src/app/(tabs)/profile.js
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ScreenContainer from "../../components/ScreenContainer";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { logoutUser } from "../../services/authService";
import { getUserOverallStats } from "../../services/progressService";
import { colors } from "../../theme/colors";
import { useResponsive } from "../../theme/responsive";

const MENU_ITEMS = [
  { icon: "color-palette-outline",  label: "Appearance",              route: "/appearance" },
  { icon: "navigate-outline",       label: "Location permissions",    route: "/location-permissions" },
  { icon: "cloud-download-outline", label: "Downloaded destinations", route: "/downloaded-destinations" },
  { icon: "notifications-outline",  label: "Notifications",           route: "/notifications" },
];

export default function Profile() {
  const { moderateScale } = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { colors, isDark } = useTheme();

  const [liveStats, setLiveStats] = useState({
    totalPoints: 0,
    destinationsVisited: 0,
    pointsUnlocked: 0,
  });

  // Reload stats every time the Profile tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;
      getUserOverallStats(user.uid)
        .then((s) => setLiveStats(s))
        .catch(() => {});
    }, [user?.uid])
  );

  const displayName = profile?.name || user?.displayName || "Explorer";
  const avatarUrl = profile?.photoURL || user?.photoURL || null;
  const avatarSize = moderateScale(78);

  const stats = {
    totalPoints: liveStats.totalPoints,
    destinationsVisited: liveStats.destinationsVisited,
    pointsUnlocked: liveStats.pointsUnlocked,
  };

  async function handleLogout() {
    await logoutUser();
    router.replace("/login");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgSecondary }]} edges={["top", "left", "right"]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.headerBg} />
      <ScreenContainer>
        <View style={[styles.hero, { paddingTop: moderateScale(36) }]}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[
                styles.avatar,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                },
              ]}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                },
              ]}
            >
              <Ionicons
                name="person"
                size={avatarSize * 0.45}
                color={colors.white}
              />
            </View>
          )}

          <Text style={[styles.name, { fontSize: moderateScale(18) }]}>
            {displayName}
          </Text>

          <View style={styles.statsRow}>
            <Pressable
              style={({ pressed }) => [styles.statBox, pressed && { opacity: 0.8 }]}
              onPress={() => router.push("/badge")}
            >
              <Text style={[styles.statValue, { fontSize: moderateScale(17) }]}>
                {stats.totalPoints}
              </Text>
              <Text style={[styles.statLabel, { fontSize: moderateScale(10) }]}>
                Total Points
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.statBox, pressed && { opacity: 0.8 }]}
              onPress={() => router.push("/progress")}
            >
              <Text style={[styles.statValue, { fontSize: moderateScale(17) }]}>
                {stats.destinationsVisited}
              </Text>
              <Text style={[styles.statLabel, { fontSize: moderateScale(10) }]}>
                Destinations
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.statBox, pressed && { opacity: 0.8 }]}
              onPress={() => router.push("/progress")}
            >
              <Text style={[styles.statValue, { fontSize: moderateScale(17) }]}>
                {stats.pointsUnlocked}
              </Text>
              <Text style={[styles.statLabel, { fontSize: moderateScale(10) }]}>
                Points Unlocked
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: moderateScale(20),
            gap: 18,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <View>
            <Text
              style={[styles.sectionTitle, { fontSize: moderateScale(15), color: colors.textSecondary }]}
            >
              My Activity
            </Text>
            <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Pressable
                style={[styles.menuRow, styles.menuDivider, { borderBottomColor: colors.divider }]}
                onPress={() => router.push("/progress")}
              >
                <Ionicons
                  name="stats-chart-outline"
                  size={moderateScale(18)}
                  color={colors.teal}
                />
                <Text
                  style={[styles.menuLabel, { fontSize: moderateScale(13.5), color: colors.textPrimary }]}
                >
                  Destination Progress
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(15)}
                  color={colors.gray}
                />
              </Pressable>
              <Pressable
                style={styles.menuRow}
                onPress={() => router.push("/badge")}
              >
                <Ionicons
                  name="trophy-outline"
                  size={moderateScale(18)}
                  color={colors.teal}
                />
                <Text
                  style={[styles.menuLabel, { fontSize: moderateScale(13.5), color: colors.textPrimary }]}
                >
                  Badges & Achievements
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(15)}
                  color={colors.gray}
                />
              </Pressable>
            </View>
          </View>

          <View>
            <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Pressable
                style={styles.menuRow}
                onPress={() => router.push("/edit-profile")}
              >
                <Ionicons
                  name="create-outline"
                  size={moderateScale(18)}
                  color={colors.teal}
                />
                <Text
                  style={[styles.menuLabel, { fontSize: moderateScale(13.5), color: colors.textPrimary }]}
                >
                  Edit Profile
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(15)}
                  color={colors.gray}
                />
              </Pressable>
            </View>
          </View>

          <View>
            <Text
              style={[styles.sectionTitle, { fontSize: moderateScale(15), color: colors.textSecondary }]}
            >
              Settings
            </Text>
            <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              {profile?.role === "admin" ? (
                <Pressable
                  style={[styles.menuRow, styles.menuDivider, { borderBottomColor: colors.divider }]}
                  onPress={() => router.push("/admin/dashboard")}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={moderateScale(18)}
                    color={colors.teal}
                  />
                  <Text
                    style={[
                      styles.menuLabel,
                      { fontSize: moderateScale(13.5), color: colors.textPrimary, fontWeight: "600" },
                    ]}
                  >
                    Admin Dashboard
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={moderateScale(15)}
                    color={colors.gray}
                  />
                </Pressable>
              ) : null}
              {MENU_ITEMS.map((item, i) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.menuRow,
                    i < MENU_ITEMS.length - 1 && [styles.menuDivider, { borderBottomColor: colors.divider }],
                    pressed && { opacity: 0.65 },
                  ]}
                  onPress={() => {
                    if (item.route) router.push(item.route);
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={moderateScale(18)}
                    color={colors.teal}
                  />
                  <Text
                    style={[
                      styles.menuLabel,
                      { fontSize: moderateScale(13.5), color: colors.textPrimary },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={moderateScale(15)}
                    color={colors.gray}
                  />
                </Pressable>
              ))}
              <Pressable style={styles.menuRow} onPress={handleLogout}>
                <Ionicons
                  name="log-out-outline"
                  size={moderateScale(18)}
                  color="#C0392B"
                />
                <Text
                  style={[
                    styles.menuLabel,
                    { fontSize: moderateScale(13.5), color: "#C0392B" },
                  ]}
                >
                  Log out
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  hero: {
    backgroundColor: colors.teal,
    paddingBottom: 20,
    alignItems: "center",
    width: "100%",
  },
  avatar: {
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
  },
  avatarPlaceholder: {
    backgroundColor: "#4A4A4A",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontWeight: "700", color: colors.white, marginTop: 10 },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
    width: "100%",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  statBox: {
    flexGrow: 1,
    flexBasis: 90,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
  },
  statValue: { fontWeight: "700", color: colors.terracotta },
  statLabel: {
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
    textAlign: "center",
  },
  sectionTitle: { fontWeight: "700", color: colors.ink, marginBottom: 10 },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
  },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  menuLabel: { flex: 1, fontWeight: "500", color: colors.ink },
});
