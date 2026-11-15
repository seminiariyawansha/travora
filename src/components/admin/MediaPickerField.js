// src/components/admin/MediaPickerField.js
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

// kind = "video" or "audio"
// value = { uri, name } or null, onChange = function(value)
// TODO (Member 2): upload the chosen uri to Cloudinary/Firebase Storage on save.
export default function MediaPickerField({ kind, value, onChange }) {
  async function pick() {
    try {
      if (kind === "video") {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["videos"],
          quality: 0.7,
        });
        if (!result.canceled) {
          const a = result.assets[0];
          onChange({ uri: a.uri, name: a.fileName ?? "video" });
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: "audio/*",
          copyToCacheDirectory: true,
        });
        if (!result.canceled) {
          const a = result.assets[0];
          onChange({ uri: a.uri, name: a.name });
        }
      }
    } catch (e) {
      Alert.alert("Error", `Could not open the ${kind} picker.`);
    }
  }

  return (
    <View style={styles.wrap}>
      {value ? (
        <Text style={styles.name} numberOfLines={1}>
          {kind === "video" ? "Video: " : "Audio: "}
          {value.name}
        </Text>
      ) : (
        <Text style={styles.empty}>No {kind} selected</Text>
      )}
      <Pressable style={styles.btn} onPress={pick}>
        <Text style={styles.btnText}>
          {value ? `Change ${kind}` : `Choose ${kind}`}
        </Text>
      </Pressable>
      {value ? (
        <Pressable onPress={() => onChange(null)}>
          <Text style={styles.remove}>Remove</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  name: { color: colors.ink, fontSize: 13, marginBottom: 10, maxWidth: "100%" },
  empty: { color: colors.gray, fontSize: 13, marginBottom: 10 },
  btn: {
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  btnText: { color: colors.teal, fontWeight: "600", fontSize: 14 },
  remove: { color: "#C0392B", fontWeight: "600", fontSize: 13, marginTop: 10 },
});