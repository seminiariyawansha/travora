// src/app/admin/points.js
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";

// TODO (Member 2): replace this dummy list with points loaded from Firestore.
const INITIAL_POINTS = [
  { id: "1", title: "Galle Lighthouse", destination: "Galle Fort", radius: 100, points: 20 },
  { id: "2", title: "Dutch Hospital", destination: "Galle Fort", radius: 100, points: 20 },
  { id: "3", title: "Lion Gate", destination: "Sigiriya", radius: 150, points: 30 },
];

export default function AdminPoints() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState(INITIAL_POINTS);

  function handleDelete(item) {
    Alert.alert(
      "Delete point",
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          // TODO (Member 2): delete from Firestore here.
          onPress: () => setItems((list) => list.filter((p) => p.id !== item.id)),
        },
      ]
    );
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.destination} · {item.radius}m · {item.points} pts
          </Text>
        </View>
        <Pressable
          style={[styles.btn, styles.editBtn]}
          onPress={() =>
            router.push({
              pathname: "/admin/point-form",
              params: { id: item.id },
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

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        ListEmptyComponent={
          <Text style={styles.empty}>No points yet. Add one below.</Text>
        }
      />

      <Pressable
        style={[styles.addBtn, { bottom: insets.bottom + 24 }]}
        onPress={() => router.push("/admin/point-form")}
      >
        <Text style={styles.addText}>+ Add Point</Text>
      </Pressable>
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
  empty: { textAlign: "center", color: colors.gray, marginTop: 40 },
  addBtn: {
    position: "absolute",
    left: 24,
    right: 24,
    backgroundColor: colors.teal,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  addText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});