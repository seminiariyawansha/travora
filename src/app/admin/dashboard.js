// src/app/admin/dashboard.js
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";

// TODO (Member 2): replace these dummy numbers with real counts from Firestore.
const DUMMY_STATS = {
  destinations: 3,
  points: 12,
  contents: 12,
};

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ title, subtitle, onPress }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage destinations and content</Text>

        <View style={styles.statsRow}>
          <StatCard label="Destinations" value={DUMMY_STATS.destinations} />
          <StatCard label="Points" value={DUMMY_STATS.points} />
          <StatCard label="Contents" value={DUMMY_STATS.contents} />
        </View>

        <Text style={styles.section}>Manage</Text>

        <MenuItem
          title="Destinations"
          subtitle="View, add, edit or delete destinations"
          onPress={() => router.push("/admin/destinations")}
        />
        <MenuItem
          title="Location Points"
          subtitle="View, add, edit or delete points"
          onPress={() => router.push("/admin/points")}
        />
        <MenuItem
          title="Add Content"
          subtitle="Story, media and quiz for a point"
          onPress={() => router.push("/admin/content-form")}
        />

        <Pressable
          style={styles.logout}
          onPress={() => router.replace("/admin/login")}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink },
  subtitle: { color: colors.gray, marginTop: 4, marginBottom: 20, fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  statValue: { fontSize: 24, fontWeight: "700", color: colors.teal },
  statLabel: { fontSize: 12, color: colors.gray, marginTop: 4 },
  section: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuTitle: { fontSize: 15, fontWeight: "600", color: colors.ink },
  menuSubtitle: { fontSize: 12, color: colors.gray, marginTop: 2 },
  chevron: { fontSize: 24, color: colors.gray },
  logout: { marginTop: 16, alignItems: "center", padding: 12 },
  logoutText: { color: "#C0392B", fontWeight: "600", fontSize: 14 },
});