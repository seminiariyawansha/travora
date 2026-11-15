// src/app/admin/destination-form.js
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
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/Button";
import { saveDestination } from "../../services/adminService";
import { getDestination } from "../../services/destinationService";
import { colors } from "../../theme/colors";

export default function DestinationForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [story, setStory] = useState("");
  const [video, setVideo] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // In edit mode, load the existing destination.
  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    async function load() {
      try {
        const d = await getDestination(id);
        if (!active) return;
        if (!d) {
          setError("Destination not found.");
        } else {
          setName(d.name ?? "");
          setLocation(d.location ?? "");
          setDescription(d.description ?? "");
          setLatitude(d.latitude != null ? String(d.latitude) : "");
          setLongitude(d.longitude != null ? String(d.longitude) : "");
          setStory(d.story ?? "");
          setVideo(d.video ?? "");
        }
      } catch (e) {
        if (active) setError("Could not load this destination.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  async function handleSave() {
    setError("");

    if (!name.trim() || !location.trim()) {
      setError("Name and location are required.");
      return;
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (latitude.trim() === "" || Number.isNaN(lat) || lat < -90 || lat > 90) {
      setError("Latitude must be a number between -90 and 90.");
      return;
    }
    if (longitude.trim() === "" || Number.isNaN(lng) || lng < -180 || lng > 180) {
      setError("Longitude must be a number between -180 and 180.");
      return;
    }

    const data = {
      name: name.trim(),
      location: location.trim(),
      description: description.trim(),
      latitude: lat,
      longitude: lng,
      story: story.trim(),
      video: video.trim(),
    };
    // New destinations start with no images (image upload comes in step 19d).
    // When editing, "images" is left alone because saveDestination merges.
    if (!isEdit) data.images = [];

    setSaving(true);
    try {
      await saveDestination(data, isEdit ? id : undefined);
      Alert.alert("Saved", isEdit ? "Destination updated." : "Destination added.", [
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
          <Text style={styles.title}>
            {isEdit ? "Edit Destination" : "Add Destination"}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sigiriya"
            placeholderTextColor={colors.gray}
            value={name}
            onChangeText={setName}
            editable={!isEdit}
          />
          {isEdit ? (
            <Text style={styles.hint}>The name can't be changed after creation.</Text>
          ) : null}

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Central Province, Sri Lanka"
            placeholderTextColor={colors.gray}
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Short description of the destination"
            placeholderTextColor={colors.gray}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                placeholder="7.957"
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
                placeholder="80.7603"
                placeholderTextColor={colors.gray}
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          <Text style={styles.label}>Story</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Story shown for this destination"
            placeholderTextColor={colors.gray}
            value={story}
            onChangeText={setStory}
            multiline
          />

          <Text style={styles.label}>Video link</Text>
          <TextInput
            style={styles.input}
            placeholder="https://www.youtube.com/watch?v=..."
            placeholderTextColor={colors.gray}
            value={video}
            onChangeText={setVideo}
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={styles.hint}>Cover image upload comes in the next step.</Text>

          {saving ? (
            <ActivityIndicator color={colors.teal} style={{ marginTop: 10 }} />
          ) : (
            <>
              <View style={styles.btnWrap}>
                <Button
                  title={isEdit ? "Save Changes" : "Save Destination"}
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
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 14,
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  btnWrap: { marginTop: 10 },
});