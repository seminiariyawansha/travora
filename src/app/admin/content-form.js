// src/app/admin/content-form.js
import { useRouter } from "expo-router";
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
import ImagePickerField from "../../components/admin/ImagePickerField";
import MediaPickerField from "../../components/admin/MediaPickerField";
import Button from "../../components/Button";
import { getAllPoints, saveContent } from "../../services/adminService";
import { uploadToCloudinary } from "../../services/cloudinaryService";
import { colors } from "../../theme/colors";

const OPTION_KEYS = ["A", "B", "C"];

export default function ContentForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [points, setPoints] = useState([]);
  const [selected, setSelected] = useState(null); // { destinationId, id, ... }
  const [storyText, setStoryText] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImage, setNewImage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [newVideo, setNewVideo] = useState(null);
  const [existingAudio, setExistingAudio] = useState("");
  const [newAudio, setNewAudio] = useState(null);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState({ A: "", B: "", C: "" });
  const [correct, setCorrect] = useState("");
  const [quizPoints, setQuizPoints] = useState("20");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const list = await getAllPoints();
        if (active) setPoints(list);
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
  }, []);

  function choosePoint(p) {
    setSelected(p);
    setError("");
    const c = p.content ?? {};
    setStoryText(c.storyText ?? "");
    setExistingImages(Array.isArray(c.images) ? c.images : []);
    setNewImage("");
    setVideoUrl(c.videoUrl ?? "");
    setNewVideo(null);
    setExistingAudio(c.audioUrl ?? "");
    setNewAudio(null);
    const q = c.quiz;
    setQuestion(q?.question ?? "");
    setOptions({
      A: q?.options?.A ?? "",
      B: q?.options?.B ?? "",
      C: q?.options?.C ?? "",
    });
    setCorrect(q?.correct ?? "");
    setQuizPoints(q?.points != null ? String(q.points) : "20");
  }

  function setOption(key, value) {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setError("");

    if (!selected) {
      setError("Please choose a point.");
      return;
    }
    if (!storyText.trim()) {
      setError("Story text is required.");
      return;
    }

    const hasQuiz =
      question.trim() || OPTION_KEYS.some((k) => options[k].trim()) || correct;
    let quiz = null;
    if (hasQuiz) {
      if (!question.trim()) {
        setError("Quiz question is required if you add a quiz.");
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
      quiz = {
        question: question.trim(),
        options: {
          A: options.A.trim(),
          B: options.B.trim(),
          C: options.C.trim(),
        },
        correct,
        points: pts,
      };
    }

    setSaving(true);
    try {
      let images = existingImages;
      if (newImage) {
        setStatus("Uploading image...");
        const url = await uploadToCloudinary(newImage, "image");
        images = [url];
      }

      let finalVideoUrl = videoUrl.trim();
      if (newVideo) {
        setStatus("Uploading video (this can take a while)...");
        finalVideoUrl = await uploadToCloudinary(newVideo.uri, "video");
      }

      // Cloudinary stores audio under the "video" resource type.
      let audioUrl = existingAudio;
      if (newAudio) {
        setStatus("Uploading audio...");
        audioUrl = await uploadToCloudinary(newAudio.uri, "video");
      }

      setStatus("Saving...");
      const content = {
        storyText: storyText.trim(),
        images,
        videoUrl: finalVideoUrl,
      };
      if (audioUrl) content.audioUrl = audioUrl;
      if (quiz) content.quiz = quiz;

      await saveContent(selected.destinationId, selected.id, content);
      Alert.alert("Saved", "Content saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      if (e.code === "permission-denied") {
        setError("Permission denied. Ask Member 2 to allow admin writes in Firestore rules.");
      } else {
        setError(
          "Could not save. Check your connection, and use a smaller file if you uploaded video or audio."
        );
      }
    } finally {
      setSaving(false);
      setStatus("");
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
          <Text style={styles.title}>Add Content</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Point</Text>
          {points.length === 0 ? (
            <Text style={styles.hint}>No points yet. Add a point first.</Text>
          ) : (
            <View style={styles.chipRow}>
              {points.map((p) => {
                const active =
                  selected?.id === p.id && selected?.destinationId === p.destinationId;
                return (
                  <Pressable
                    key={`${p.destinationId}/${p.id}`}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => choosePoint(p)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {p.destinationName} · {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Text style={styles.section}>Story</Text>

          <Text style={styles.label}>Story text</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Write the story tourists will read or hear"
            placeholderTextColor={colors.gray}
            value={storyText}
            onChangeText={setStoryText}
            multiline
          />

          <Text style={styles.label}>Image</Text>
          {existingImages.length > 0 && !newImage ? (
            <Text style={styles.hint}>
              This point has {existingImages.length} image(s). Choosing a new one replaces them.
            </Text>
          ) : null}
          <ImagePickerField value={newImage} onChange={setNewImage} />

          <Text style={styles.label}>Video</Text>
          <Text style={styles.hint}>Paste a link, or upload a file below (under 20 MB).</Text>
          <TextInput
            style={styles.input}
            placeholder="https://www.youtube.com/watch?v=..."
            placeholderTextColor={colors.gray}
            value={videoUrl}
            onChangeText={setVideoUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
          <MediaPickerField kind="video" value={newVideo} onChange={setNewVideo} />

          <Text style={styles.label}>Audio story</Text>
          {existingAudio && !newAudio ? (
            <Text style={styles.hint}>
              This point already has audio. Choosing a new file replaces it.
            </Text>
          ) : null}
          <MediaPickerField kind="audio" value={newAudio} onChange={setNewAudio} />

          <Text style={styles.section}>Quiz (optional)</Text>

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

          {saving ? (
            <View style={{ marginTop: 10, alignItems: "center" }}>
              <ActivityIndicator color={colors.teal} />
              {status ? <Text style={styles.status}>{status}</Text> : null}
            </View>
          ) : (
            <>
              <View style={styles.btnWrap}>
                <Button title="Save Content" onPress={handleSave} />
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
  section: { fontSize: 16, fontWeight: "700", color: colors.ink, marginTop: 8, marginBottom: 10 },
  error: { color: "#C0392B", fontSize: 12.5, marginBottom: 12, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink, marginBottom: 6 },
  hint: { fontSize: 12, color: colors.gray, marginBottom: 10 },
  status: { fontSize: 12, color: colors.gray, marginTop: 8 },
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
  btnWrap: { marginTop: 10 },
});