// src/app/admin/points.js
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/Button";
import { deletePoint, getAllPoints } from "../../services/adminService";
import { colors } from "../../theme/colors";

export default function AdminPoints() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reload every time this screen comes back into view (e.g. after saving).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        setError("");
        try {
          const list = await getAllPoints();
          if (active) setItems(list);
        } catch (e) {
          if (active) setError("Could not load points.");
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

  function handleDelete(item) {
    Alert.alert(
      "Delete point",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePoint(item.destinationId, item.id);
              setItems((list) =>
                list.filter(
                  (p) => !(p.id === item.id && p.destinationId === item.destinationId)
                )
              );
            } catch (e) {
              Alert.alert("Error", "Could not delete. Check your permissions.");
            }
          },
        },
      ]
    );
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.destinationName} · {item.radiusMeters}m · {item.pointsValue} pts
          </Text>
        </View>
        <Pressable
          style={[styles.btn, styles.editBtn]}
          onPress={() =>
            router.push({
              pathname: "/admin/point-form",
              params: { id: item.id, destinationId: item.destinationId },
            })
          }
        >
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.deleteBtn]}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Location Points</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.destinationId}/${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
          ListEmptyComponent={
            <Text style={styles.empty}>No points yet. Add one below.</Text>
          }
        />
      )}

      <View style={[styles.addWrap, { bottom: insets.bottom + 24 }]}>
        <Button title="+ Add Point" onPress={() => router.push("/admin/point-form")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: { paddingHorizontal: 24, paddingTop: 12 },
  back: { color: colors.teal, fontWeight: "600", fontSize: 14 },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, marginTop: 8 },
  list: { padding: 24 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  name: { fontSize: 15, fontWeight: "600", color: colors.ink },
  meta: { fontSize: 12, color: colors.gray, marginTop: 2 },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  editBtn: { backgroundColor: colors.sand, borderWidth: 1, borderColor: colors.cardBorder },
  editText: { color: colors.teal, fontWeight: "600", fontSize: 13 },
  deleteBtn: { backgroundColor: "#FDECEA" },
  deleteText: { color: "#C0392B", fontWeight: "600", fontSize: 13 },
  error: { color: "#C0392B", fontSize: 12.5, marginBottom: 12, fontWeight: "600" },
  empty: { textAlign: "center", color: colors.gray, marginTop: 40 },
  addWrap: { position: "absolute", left: 24, right: 24 },
});