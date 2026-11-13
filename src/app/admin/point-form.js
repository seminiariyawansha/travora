// src/app/admin/point-form.js
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";

// TODO (Member 2): load destinations from Firestore for the selector.
const DESTINATIONS = ["Galle Fort", "Sigiriya", "Ella"];

// TODO (Member 2): load the real point from Firestore using the id.
// Field names (destination, title, latitude, longitude, radius, points)
// must match the Firestore schema.
const DUMMY_POINTS = {
  "1": { destination: "Galle Fort", title: "Galle Lighthouse", latitude: "6.0267", longitude: "80.2170", radius: "100", points: "20" },
  "2": { destination: "Galle Fort", title: "Dutch Hospital", latitude: "6.0300", longitude: "80.2160", radius: "100", points: "20" },
  "3": { destination: "Sigiriya", title: "Lion Gate", latitude: "7.9570", longitude: "80.7603", radius: "150", points: "30" },
};

export default function PointForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const isEdit = Boolean(id);
  const existing = isEdit ? DUMMY_POINTS[id] : null;

  const [destination, setDestination] = useState(existing?.destination ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [latitude, setLatitude] = useState(existing?.latitude ?? "");
  const [longitude, setLongitude] = useState(existing?.longitude ?? "");
  const [radius, setRadius] = useState(existing?.radius ?? "100");
  const [points, setPoints] = useState(existing?.points ?? "20");
  const [error, setError] = useState("");

  function handleSave() {
    setError("");

    if (!destination) {
      setError("Please choose a destination.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const rad = Number(radius);
    const pts = Number(points);

    if (latitude.trim() === "" || Number.isNaN(lat) || lat < -90 || lat > 90) {
      setError("Latitude must be a number between -90 and 90.");
      return;
    }
    if (longitude.trim() === "" || Number.isNaN(lng) || lng < -180 || lng > 180) {
      setError("Longitude must be a number between -180 and 180.");
      return;
    }
    if (Number.isNaN(rad) || rad <= 0) {
      setError("Radius must be a number greater than 0.");
      return;
    }
    if (Number.isNaN(pts) || pts < 0) {
      setError("Points must be 0 or more.");
      return;
    }

    // TODO (Member 2): save to Firestore here (create or update by id).
    Alert.alert(
      "Saved",
      isEdit ? "Point updated." : "Point added.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>{isEdit ? "Edit Point" : "Add Point"}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Destination</Text>
          <View style={styles.chipRow}>
            {DESTINATIONS.map((d) => (
              <Pressable
                key={d}
                style={[styles.chip, destination === d && styles.chipActive]}
                onPress={() => setDestination(d)}
              >
                <Text
                  style={[styles.chipText, destination === d && styles.chipTextActive]}
                >
                  {d}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Galle Lighthouse"
            placeholderTextColor={colors.gray}
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                placeholder="6.0267"
                placeholderTextColor={colors.gray}
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                placeholder="80.2170"
                placeholderTextColor={colors.gray}
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Geofence radius (m)</Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                placeholderTextColor={colors.gray}
                value={radius}
                onChangeText={setRadius}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Points value</Text>
              <TextInput
                style={styles.input}
                placeholder="20"
                placeholderTextColor={colors.gray}
                value={points}
                onChangeText={setPoints}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>
              {isEdit ? "Save Changes" : "Save Point"}
            </Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  content: { padding: 24 },
  back: { color: colors.teal, fontWeight: "600", fontSize: 14 },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, marginTop: 8, marginBottom: 16 },
  error: { color: "#C0392B", fontSize: 12.5, marginBottom: 12, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink, marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 14,
  },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: colors.white },
  saveBtn: {
    backgroundColor: colors.teal,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 6,
  },
  saveText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  cancelBtn: { padding: 14, alignItems: "center", marginTop: 6 },
  cancelText: { color: colors.gray, fontWeight: "600", fontSize: 14 },
});