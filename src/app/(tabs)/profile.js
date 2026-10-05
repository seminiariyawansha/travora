// src/app/(tabs)/profile.js
import { Ionicons } from "@expo/vector-icons";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { mockUser } from "../../data/mockData";
import { colors } from "../../theme/colors";

const MENU_ITEMS = [
  { icon: "navigate-outline", label: "Location permissions" },
  { icon: "cloud-download-outline", label: "Downloaded destinations" },
  { icon: "notifications-outline", label: "Notifications" },
];

export default function Profile() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.avatar} />
        <Text style={styles.name}>{mockUser.name}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{mockUser.totalPoints}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{mockUser.destinationsVisited}</Text>
            <Text style={styles.statLabel}>Destinations</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{mockUser.pointsUnlocked}</Text>
            <Text style={styles.statLabel}>Points Unlocked</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <View>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuCard}>
            {MENU_ITEMS.map((item, i) => (
              <View
                key={item.label}
                style={[
                  styles.menuRow,
                  i < MENU_ITEMS.length - 1 && styles.menuDivider,
                ]}
              >
                <Ionicons name={item.icon} size={18} color={colors.teal} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={colors.gray}
                />
              </View>
            ))}
            <Pressable style={styles.menuRow}>
              <Ionicons name="log-out-outline" size={18} color="#C0392B" />
              <Text style={[styles.menuLabel, { color: "#C0392B" }]}>
                Log out
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  hero: { backgroundColor: colors.teal, padding: 20, alignItems: "center" },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#4A4A4A",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
  },
  name: { fontSize: 18, fontWeight: "700", color: colors.white, marginTop: 10 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 16, width: "100%" },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
  },
  statValue: { fontSize: 17, fontWeight: "700", color: colors.terracotta },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
  },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  menuLabel: { flex: 1, fontSize: 13.5, fontWeight: "500", color: colors.ink },
});
