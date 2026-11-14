// src/app/admin/content-form.js
import { useRouter } from "expo-router";
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
import ImagePickerField from "../../components/admin/ImagePickerField";
import MediaPickerField from "../../components/admin/MediaPickerField";
import { colors } from "../../theme/colors";

// TODO (Member 2): load points from Firestore for the selector.
const POINTS = ["Galle Lighthouse", "Dutch Hospital", "Lion Gate"];
const OPTION_KEYS = ["A", "B", "C"];

export default function ContentForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [point, setPoint] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyText, setStoryText] = useState("");
  const [storyImage, setStoryImage] = useState("");
  const [video, setVideo] = useState(null);
  const [audio, setAudio] = useState(null);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState({ A: "", B: "", C: "" });
  const [correct, setCorrect] = useState("");
  const [quizPoints, setQuizPoints] = useState("20");
  const [error, setError] = useState("");

  function setOption(key, value) {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setError("");

    if (!point) {
      setError("Please choose a point.");
      return;
    }
    if (!storyTitle.trim() || !storyText.trim()) {
      setError("Story title and story text are required.");
      return;
    }
    if (!question.trim()) {
      setError("Quiz question is required.");
      return;
    }
    if (OPTION_KEYS.some((k) => !options[k].trim())) {
      setError("Please fill in all three answer options.");
      return;
    }
    if (!correct) {
      setError("Please choose the correct answer.");
      return;
    }
    const pts = Number(quizPoints);
    if (Number.isNaN(pts) || pts < 0) {
      setError("Quiz points must be 0 or more.");
      return;
    }

    // TODO (Member 2): upload storyImage, video and audio, then save to Firestore here.
    // Field names (point, storyTitle, storyText, storyImage, video, audio, question,
    // options, correct, quizPoints) must match the Firestore schema.
    Alert.alert("Saved", "Content added.", [
      { text: "OK", onPress: () => router.back() },
    ]);
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
          <Text style={styles.title}>Add Content</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Point</Text>
          <View style={styles.chipRow}>
            {POINTS.map((p) => (
              <Pressable
                key={p}
                style={[styles.chip, point === p && styles.chipActive]}
                onPress={() => setPoint(p)}
              >
                <Text style={[styles.chipText, point === p && styles.chipTextActive]}>
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.section}>Story</Text>

          <Text style={styles.label}>Story title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. The Lighthouse of Galle Fort"
            placeholderTextColor={colors.gray}
            value={storyTitle}
            onChangeText={setStoryTitle}
          />

          <Text style={styles.label}>Story text</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Write the story tourists will read or hear"
            placeholderTextColor={colors.gray}
            value={storyText}
            onChangeText={setStoryText}
            multiline
          />

          <Text style={styles.label}>Media (optional)</Text>
          <Text style={styles.hint}>Image</Text>
          <ImagePickerField value={storyImage} onChange={setStoryImage} />
          <Text style={styles.hint}>Video</Text>
          <MediaPickerField kind="video" value={video} onChange={setVideo} />
          <Text style={styles.hint}>Audio story</Text>
          <MediaPickerField kind="audio" value={audio} onChange={setAudio} />

          <Text style={styles.section}>Quiz</Text>

          <Text style={styles.label}>Question</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. What is this location famous for?"
            placeholderTextColor={colors.gray}
            value={question}
            onChangeText={setQuestion}
          />

          {OPTION_KEYS.map((k) => (
            <View key={k}>
              <Text style={styles.label}>Option {k}</Text>
              <TextInput
                style={styles.input}
                placeholder={`Answer ${k}`}
                placeholderTextColor={colors.gray}
                value={options[k]}
                onChangeText={(v) => setOption(k, v)}
              />
            </View>
          ))}

          <Text style={styles.label}>Correct answer</Text>
          <View style={styles.chipRow}>
            {OPTION_KEYS.map((k) => (
              <Pressable
                key={k}
                style={[styles.chip, correct === k && styles.chipActive]}
                onPress={() => setCorrect(k)}
              >
                <Text style={[styles.chipText, correct === k && styles.chipTextActive]}>
                  {k}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Points for a correct answer</Text>
          <TextInput
            style={styles.input}
            placeholder="20"
            placeholderTextColor={colors.gray}
            value={quizPoints}
            onChangeText={setQuizPoints}
            keyboardType="number-pad"
          />

          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Save Content</Text>
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
  section: { fontSize: 16, fontWeight: "700", color: colors.ink, marginTop: 8, marginBottom: 10 },
  error: { color: "#C0392B", fontSize: 12.5, marginBottom: 12, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink, marginBottom: 6 },
  hint: { fontSize: 12, color: colors.gray, marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 14,
  },
  multiline: { minHeight: 120, textAlignVertical: "top" },
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