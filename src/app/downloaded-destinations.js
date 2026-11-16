// src/app/downloaded-destinations.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { getAllCachedDestinations, deleteCachedDestination, getCacheSize } from "../db/offlineContentService";
import { colors } from "../theme/colors";

function DestCard({ dest, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Remove download?",
      `"${dest.name}" will be removed from offline storage.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            await deleteCachedDestination(dest.id);
            setDeleting(false);
            onDelete(dest.id);
          },
        },
      ]
    );
  };

  const sizeMB = dest.sizeBytes ? (dest.sizeBytes / 1024 / 1024).toFixed(1) : "?";

  return (
    <View style={dc.card}>
      <View style={dc.iconWrap}>
        <Ionicons name="map-outline" size={24} color={colors.teal} />
      </View>
      <View style={dc.info}>
        <Text style={dc.name}>{dest.name}</Text>
        <View style={dc.meta}>
          <Ionicons name="folder-outline" size={11} color="#999" />
          <Text style={dc.metaTxt}>{sizeMB} MB  ·  {dest.pointCount ?? "?"} points</Text>
        </View>
        {dest.downloadedAt && (
          <Text style={dc.date}>
            Downloaded {new Date(dest.downloadedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
      <Pressable onPress={handleDelete} hitSlop={8} disabled={deleting}>
        {deleting ? (
          <ActivityIndicator size="small" color="#C0392B" />
        ) : (
          <Ionicons name="trash-outline" size={20} color="#C0392B" />
        )}
      </Pressable>
    </View>
  );
}

const dc = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", padding: 16, gap: 12,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.teal + "15",
    alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", color: "#1B1B1B" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  metaTxt: { fontSize: 11.5, color: "#999" },
  date: { fontSize: 11, color: "#BBBBBB", marginTop: 2 },
});

export default function DownloadedDestinations() {
  const router = useRouter();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMB, setTotalMB] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const cached = await getAllCachedDestinations();
        setDestinations(cached ?? []);
        const bytes = await getCacheSize();
        setTotalMB((bytes / 1024 / 1024).toFixed(1));
      } catch {
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = (id) =>
    setDestinations((prev) => prev.filter((d) => d.id !== id));

  const clearAll = () => {
    if (destinations.length === 0) return;
    Alert.alert(
      "Clear all downloads?",
      "All offline data will be removed. You'll need Wi-Fi to view content again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            for (const d of destinations) await deleteCachedDestination(d.id);
            setDestinations([]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.container}>
      {/* header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>
        <Text style={s.headerTitle}>Downloaded Destinations</Text>
        <Pressable onPress={clearAll} hitSlop={8}>
          <Text style={s.clearTxt}>Clear All</Text>
        </Pressable>
      </View>

      {/* storage pill */}
      <View style={s.storagePill}>
        <Ionicons name="server-outline" size={14} color={colors.teal} />
        <Text style={s.storageTxt}>
          {totalMB} MB used offline  ·  {destinations.length} destination{destinations.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.teal} />
        </View>
      ) : destinations.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="cloud-download-outline" size={52} color="#D0D0D0" />
          <Text style={s.emptyTitle}>No downloads yet</Text>
          <Text style={s.emptySub}>
            Open a destination and tap "Download for Offline" to save it here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          <View style={s.card}>
            {destinations.map((dest, i) => (
              <View key={dest.id}>
                <DestCard dest={dest} onDelete={handleDelete} />
                {i < destinations.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>

          <View style={s.infoBanner}>
            <Ionicons name="wifi-outline" size={16} color="#7A7A7A" />
            <Text style={s.infoTxt}>
              Downloaded content is available without an internet connection.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.teal, paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  clearTxt: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" },
  storagePill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    margin: 16, marginBottom: 8,
    backgroundColor: colors.teal + "12",
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  storageTxt: { fontSize: 12.5, color: colors.teal, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#555" },
  emptySub: { fontSize: 13, color: "#999", textAlign: "center", lineHeight: 20 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff", borderRadius: 16,
    borderWidth: 1, borderColor: "#E8E8E8", overflow: "hidden",
  },
  divider: { height: 1, backgroundColor: "#F1F1F1", marginLeft: 16 },
  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F0F0F0", borderRadius: 12, padding: 14,
  },
  infoTxt: { flex: 1, fontSize: 12.5, color: "#7A7A7A", lineHeight: 19 },
});
