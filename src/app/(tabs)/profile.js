// src/app/(tabs)/profile.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ScreenContainer from "../../components/ScreenContainer";
import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../services/authService";
import { colors } from "../../theme/colors";
import { useResponsive } from "../../theme/responsive";

const MENU_ITEMS = [
  { icon: "navigate-outline", label: "Location permissions" },
  { icon: "cloud-download-outline", label: "Downloaded destinations" },
  { icon: "notifications-outline", label: "Notifications" },
];

export default function Profile() {
  const { moderateScale } = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile } = useAuth();

  const displayName = profile?.name || user?.displayName || "Explorer";
  const stats = {
    totalPoints: profile?.totalPoints ?? 0,
    destinationsVisited: profile?.destinationsVisited ?? 0,
    pointsUnlocked: profile?.pointsUnlocked ?? 0,
  };

  async function handleLogout() {
    await logoutUser();
    router.replace("/login");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenContainer>
        <View style={[styles.hero, { paddingTop: moderateScale(36) }]}>
          <View
            style={[
              styles.avatar,
              {
                width: moderateScale(78),
                height: moderateScale(78),
                borderRadius: moderateScale(39),
              },
            ]}
          />
          <Text style={[styles.name, { fontSize: moderateScale(18) }]}>
            {displayName}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { fontSize: moderateScale(17) }]}>
                {stats.totalPoints}
              </Text>
              <Text style={[styles.statLabel, { fontSize: moderateScale(10) }]}>
                Total Points
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { fontSize: moderateScale(17) }]}>
                {stats.destinationsVisited}
              </Text>
              <Text style={[styles.statLabel, { fontSize: moderateScale(10) }]}>
                Destinations
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { fontSize: moderateScale(17) }]}>
                {stats.pointsUnlocked}
              </Text>
              <Text style={[styles.statLabel, { fontSize: moderateScale(10) }]}>
                Points Unlocked
              </Text>
            </View>
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
              style={[styles.sectionTitle, { fontSize: moderateScale(15) }]}
            >
              Settings
            </Text>
            <View style={styles.menuCard}>
              {MENU_ITEMS.map((item, i) => (
                <View
                  key={item.label}
                  style={[
                    styles.menuRow,
                    i < MENU_ITEMS.length - 1 && styles.menuDivider,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={moderateScale(18)}
                    color={colors.teal}
                  />
                  <Text
                    style={[
                      styles.menuLabel,
                      { fontSize: moderateScale(13.5) },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={moderateScale(15)}
                    color={colors.gray}
                  />
                </View>
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
    backgroundColor: "#4A4A4A",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
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
