// src/components/admin/ImagePickerField.js
import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

// value = image uri (string or ""), onChange = function(uri)
// TODO (Member 2): upload the chosen uri to Cloudinary/Firebase Storage on save.
export default function ImagePickerField({ value, onChange }) {
  async function pick() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled) {
        onChange(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Error", "Could not open the photo library.");
    }
  }

  return (
    <View style={styles.wrap}>
      {value ? <Image source={{ uri: value }} style={styles.preview} /> : null}
      <Pressable style={styles.btn} onPress={pick}>
        <Text style={styles.btnText}>{value ? "Change image" : "Choose image"}</Text>
      </Pressable>
      {value ? (
        <Pressable onPress={() => onChange("")}>
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
  preview: { width: "100%", height: 160, borderRadius: 10, marginBottom: 12 },
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