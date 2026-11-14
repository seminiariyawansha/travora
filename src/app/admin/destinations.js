// src/app/admin/destinations.js
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/Button";
import { colors } from "../../theme/colors";

// TODO (Member 2): replace this dummy list with destinations loaded from Firestore.
const INITIAL_DESTINATIONS = [
  { id: "1", name: "Galle Fort", district: "Galle", points: 5 },
  { id: "2", name: "Sigiriya", district: "Matale", points: 4 },
  { id: "3", name: "Ella", district: "Badulla", points: 3 },
];

export default function AdminDestinations() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [destinations, setDestinations] = useState(INITIAL_DESTINATIONS);

  function handleDelete(item) {
    Alert.alert(
      "Delete destination",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          // TODO (Member 2): delete from Firestore here.
          onPress: () =>
            setDestinations((list) => list.filter((d) => d.id !== item.id)),
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
            {item.district} · {item.points} points
          </Text>
        </View>
        <Pressable
          style={[styles.btn, styles.editBtn]}
          onPress={() =>
            router.push({
              pathname: "/admin/destination-form",
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
        <Text style={styles.title}>Destinations</Text>
      </View>

      <FlatList
        data={destinations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        ListEmptyComponent={
          <Text style={styles.empty}>No destinations yet. Add one below.</Text>
        }
      />

      <View style={[styles.addWrap, { bottom: insets.bottom + 24 }]}>
        <Button
          title="+ Add Destination"
          onPress={() => router.push("/admin/destination-form")}
        />
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
   empty: { textAlign: "center", color: colors.gray, marginTop: 40 },
   addWrap: { position: "absolute", left: 24, right: 24 },
 });