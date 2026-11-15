// src/app/admin/dashboard.js
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAllPoints } from "../../services/adminService";
import { logoutUser } from "../../services/authService";
import { getDestinations } from "../../services/destinationService";
import { colors } from "../../theme/colors";

function StatCard({ label, value, loading }) {
  return (
    <View style={styles.statCard}>
      {loading ? (
        <ActivityIndicator color={colors.teal} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
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
  const [stats, setStats] = useState({ destinations: 0, points: 0, contents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reload the counts every time the dashboard comes back into view.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        setError("");
        try {
          const [dests, points] = await Promise.all([
            getDestinations(),
            getAllPoints(),
          ]);
          const contents = points.filter(
            (p) => (p.content?.storyText ?? "").trim() !== ""
          ).length;
          if (active) {
            setStats({
              destinations: dests.length,
              points: points.length,
              contents,
            });
          }
        } catch (e) {
          if (active) setError("Could not load the counts.");
        } finally {
          if (active) setLoading(false);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [])
  );

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (e) {
      // Even if sign-out fails, go back to the login screen.
    }
    router.replace("/admin/login");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage destinations and content</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.statsRow}>
          <StatCard label="Destinations" value={stats.destinations} loading={loading} />
          <StatCard label="Points" value={stats.points} loading={loading} />
          <StatCard label="Contents" value={stats.contents} loading={loading} />
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

        <Pressable style={styles.logout} onPress={handleLogout}>
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
  error: { color: "#C0392B", fontSize: 12.5, marginBottom: 12, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
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