// src/app/admin/destination-form.js
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

// TODO (Member 2): load the real destination from Firestore using the id.
// Field names here (name, district, description, coverImage) must match the Firestore schema.
const DUMMY_DESTINATIONS = {
  "1": { name: "Galle Fort", district: "Galle", description: "A historic Dutch fort on the south coast." },
  "2": { name: "Sigiriya", district: "Matale", description: "An ancient rock fortress." },
  "3": { name: "Ella", district: "Badulla", description: "A hill town with scenic hikes." },
};

export default function DestinationForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const isEdit = Boolean(id);
  const existing = isEdit ? DUMMY_DESTINATIONS[id] : null;

  const [name, setName] = useState(existing?.name ?? "");
  const [district, setDistrict] = useState(existing?.district ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [error, setError] = useState("");

  function handleSave() {
    setError("");
    if (!name.trim() || !district.trim()) {
      setError("Name and district are required.");
      return;
    }

    // TODO (Member 2): save to Firestore here (create or update by id).
    Alert.alert(
      "Saved",
      isEdit ? "Destination updated." : "Destination added.",
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
          <Text style={styles.title}>
            {isEdit ? "Edit Destination" : "Add Destination"}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Galle Fort"
            placeholderTextColor={colors.gray}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>District</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Galle"
            placeholderTextColor={colors.gray}
            value={district}
            onChangeText={setDistrict}
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

          <Text style={styles.label}>Cover image</Text>
          {/* TODO (Step 14): replace with a real image picker. */}
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageText}>Image picker coming in a later step</Text>
          </View>

          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>
              {isEdit ? "Save Changes" : "Save Destination"}
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
  multiline: { minHeight: 90, textAlignVertical: "top" },
  imagePlaceholder: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  imageText: { color: colors.gray, fontSize: 13 },
  saveBtn: {
    backgroundColor: colors.teal,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  cancelBtn: { padding: 14, alignItems: "center", marginTop: 6 },
  cancelText: { color: colors.gray, fontWeight: "600", fontSize: 14 },
});