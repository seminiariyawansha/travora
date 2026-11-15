// src/app/admin/destinations.js
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
import { deleteDestination } from "../../services/adminService";
import { getDestinations } from "../../services/destinationService";
import { colors } from "../../theme/colors";

export default function AdminDestinations() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reload every time this screen comes back into view (e.g. after saving).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        setError("");
        try {
          const list = await getDestinations();
          if (active) setDestinations(list);
        } catch (e) {
          if (active) setError("Could not load destinations.");
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
      "Delete destination",
      `Are you sure you want to delete "${item.name}" and all its points?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDestination(item.id);
              setDestinations((list) => list.filter((d) => d.id !== item.id));
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
          <Text style={styles.meta}>{item.location}</Text>
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

      {loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={destinations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
          ListEmptyComponent={
            <Text style={styles.empty}>No destinations yet. Add one below.</Text>
          }
        />
      )}

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
  error: { color: "#C0392B", fontSize: 12.5, marginBottom: 12, fontWeight: "600" },
  empty: { textAlign: "center", color: colors.gray, marginTop: 40 },
  addWrap: { position: "absolute", left: 24, right: 24 },
});