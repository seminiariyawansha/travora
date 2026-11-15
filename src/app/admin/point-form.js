// src/app/admin/point-form.js
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/Button";
import { savePoint } from "../../services/adminService";
import { getDestinations, getPoints } from "../../services/destinationService";
import { colors } from "../../theme/colors";

export default function PointForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, destinationId: paramDestId } = useLocalSearchParams();
  const isEdit = Boolean(id);

  const [destinations, setDestinations] = useState([]);
  const [destinationId, setDestinationId] = useState(paramDestId ?? "");
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radiusMeters, setRadiusMeters] = useState("100");
  const [pointsValue, setPointsValue] = useState("20");
  const [indoorFriendly, setIndoorFriendly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const dests = await getDestinations();
        if (active) setDestinations(dests);

        if (isEdit && paramDestId) {
          const pts = await getPoints(paramDestId);
          const p = pts.find((x) => x.id === id);
          if (active) {
            if (!p) {
              setError("Point not found.");
            } else {
              setName(p.name ?? "");
              setLatitude(p.latitude != null ? String(p.latitude) : "");
              setLongitude(p.longitude != null ? String(p.longitude) : "");
              setRadiusMeters(p.radiusMeters != null ? String(p.radiusMeters) : "100");
              setPointsValue(p.pointsValue != null ? String(p.pointsValue) : "20");
              setIndoorFriendly(Boolean(p.indoorFriendly));
            }
          }
        }
      } catch (e) {
        if (active) setError("Could not load data.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id, isEdit, paramDestId]);

  async function handleSave() {
    setError("");

    if (!destinationId) {
      setError("Please choose a destination.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const rad = Number(radiusMeters);
    const pts = Number(pointsValue);

    if (latitude.trim() === "" || Number.isNaN(lat) || lat < -90 || lat > 90) {
      setError("Latitude must be a number between -90 and 90.");
      return;
    }
    if (longitude.trim() === "" || Number.isNaN(lng) || lng < -180 || lng > 180) {
      setError("Longitude must be a number between -180 and 180.");
      return;
    }
    if (radiusMeters.trim() === "" || Number.isNaN(rad) || rad <= 0) {
      setError("Radius must be a number greater than 0.");
      return;
    }
    if (pointsValue.trim() === "" || Number.isNaN(pts) || pts < 0) {
      setError("Points must be 0 or more.");
      return;
    }

    const data = {
      name: name.trim(),
      latitude: lat,
      longitude: lng,
      radiusMeters: rad,
      pointsValue: pts,
      indoorFriendly,
    };
    // New points start with empty content (filled in from the Add Content screen).
    if (!isEdit) data.content = { storyText: "", images: [], videoUrl: "" };

    setSaving(true);
    try {
      await savePoint(destinationId, data, isEdit ? id : undefined);
      Alert.alert("Saved", isEdit ? "Point updated." : "Point added.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      if (e.code === "admin/duplicate") {
        setError(e.message);
      } else if (e.code === "permission-denied") {
        setError("Permission denied. Ask Member 2 to allow admin writes in Firestore rules.");
      } else {
        setError("Could not save. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.teal} style={{ marginTop: 80 }} />
      </SafeAreaView>
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
          {destinations.length === 0 ? (
            <Text style={styles.hint}>No destinations yet. Add a destination first.</Text>
          ) : (
            <View style={styles.chipRow}>
              {destinations.map((d) => (
                <Pressable
                  key={d.id}
                  disabled={isEdit}
                  style={[styles.chip, destinationId === d.id && styles.chipActive]}
                  onPress={() => setDestinationId(d.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      destinationId === d.id && styles.chipTextActive,
                    ]}
                  >
                    {d.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {isEdit ? (
            <Text style={styles.hint}>
              The destination and name can't be changed after creation.
            </Text>
          ) : null}

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ancient Story Point"
            placeholderTextColor={colors.gray}
            value={name}
            onChangeText={setName}
            editable={!isEdit}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                placeholder="7.9572"
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
                placeholder="80.7605"
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
                value={radiusMeters}
                onChangeText={setRadiusMeters}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Points value</Text>
              <TextInput
                style={styles.input}
                placeholder="20"
                placeholderTextColor={colors.gray}
                value={pointsValue}
                onChangeText={setPointsValue}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Indoor friendly</Text>
              <Text style={styles.hintTight}>Used for the weather-based ordering.</Text>
            </View>
            <Switch
              value={indoorFriendly}
              onValueChange={setIndoorFriendly}
              trackColor={{ true: colors.teal }}
            />
          </View>

          {saving ? (
            <ActivityIndicator color={colors.teal} style={{ marginTop: 10 }} />
          ) : (
            <>
              <View style={styles.btnWrap}>
                <Button
                  title={isEdit ? "Save Changes" : "Save Point"}
                  onPress={handleSave}
                />
              </View>
              <View style={styles.btnWrap}>
                <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
              </View>
            </>
          )}
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
  hint: { fontSize: 12, color: colors.gray, marginBottom: 14 },
  hintTight: { fontSize: 12, color: colors.gray },
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  btnWrap: { marginTop: 10 },
});