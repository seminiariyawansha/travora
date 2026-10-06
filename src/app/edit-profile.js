// src/app/edit-profile.js
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import Button from "../components/Button";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import {
    updateUserAvatar,
    updateUserEmail,
    updateUserName,
    updateUserPassword,
    uploadAvatar,
} from "../services/authService";
import { colors } from "../theme/colors";
import { useResponsive } from "../theme/responsive";

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { moderateScale } = useResponsive();
  const { user, profile, refreshProfile } = useAuth();

  const [avatarUri, setAvatarUri] = useState(
    profile?.photoURL || user?.photoURL || null,
  );
  const [name, setName] = useState(profile?.name || user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Permission to access photos is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    const localUri = result.assets[0].uri;
    setAvatarUri(localUri);
    setSavingAvatar(true);
    setError("");

    try {
      const downloadUrl = await uploadAvatar(user.uid, localUri);
      await updateUserAvatar(downloadUrl);
      await refreshProfile();
      setSuccess("Profile picture updated.");
    } catch (err) {
      setError("Couldn't upload photo. Please try again.");
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handleSaveProfile() {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name can't be empty.");
      return;
    }

    setSavingProfile(true);
    try {
      await updateUserName(name.trim());

      if (email !== user.email) {
        if (!currentPassword) {
          setError("Enter your current password to change your email.");
          setSavingProfile(false);
          return;
        }
        await updateUserEmail(email.trim(), currentPassword);
      }

      await refreshProfile();
      setSuccess("Profile updated successfully.");
      setCurrentPassword("");
    } catch (err) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Current password is incorrect.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("That email is already in use.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("New passwords don't match.");
      return;
    }

    setSavingPassword(true);
    try {
      await updateUserPassword(newPassword, currentPassword);
      setSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Current password is incorrect.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenContainer style={{ paddingBottom: insets.bottom + 24 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <Text style={[styles.headerTitle, { fontSize: moderateScale(16) }]}>
            Edit Profile
          </Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={{ padding: 20, gap: 16 }}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          <View style={{ alignItems: "center" }}>
            <Pressable onPress={handlePickAvatar} style={styles.avatarWrap}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={32} color={colors.white} />
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                {savingAvatar ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Ionicons name="camera" size={14} color={colors.white} />
                )}
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          <View>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.gray}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Your email"
              placeholderTextColor={colors.gray}
            />

            {email !== user?.email && (
              <>
                <Text style={styles.label}>
                  Current password (required to change email)
                </Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="Current password"
                  placeholderTextColor={colors.gray}
                />
              </>
            )}

            {savingProfile ? (
              <ActivityIndicator color={colors.teal} style={{ marginTop: 8 }} />
            ) : (
              <Button title="Save Changes" onPress={handleSaveProfile} />
            )}
          </View>

          <View style={styles.divider} />

          <View>
            <Text
              style={[styles.sectionTitle, { fontSize: moderateScale(15) }]}
            >
              Change Password
            </Text>

            <Text style={styles.label}>Current password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Current password"
              placeholderTextColor={colors.gray}
            />

            <Text style={styles.label}>New password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="New password"
              placeholderTextColor={colors.gray}
            />

            <Text style={styles.label}>Confirm new password</Text>
            <TextInput
              style={styles.input}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
              placeholder="Confirm new password"
              placeholderTextColor={colors.gray}
            />

            {savingPassword ? (
              <ActivityIndicator color={colors.teal} style={{ marginTop: 8 }} />
            ) : (
              <Button
                title="Change Password"
                variant="secondary"
                onPress={handleChangePassword}
              />
            )}
          </View>
        </View>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: { fontWeight: "700", color: colors.ink },
  error: { color: "#C0392B", fontSize: 12.5, fontWeight: "600" },
  success: { color: colors.teal, fontSize: 12.5, fontWeight: "600" },
  avatarWrap: { position: "relative" },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    backgroundColor: "#4A4A4A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.sand,
  },
  avatarHint: { fontSize: 11.5, color: colors.gray, marginTop: 8 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
  },
  divider: { height: 1, backgroundColor: colors.divider },
  sectionTitle: { fontWeight: "700", color: colors.ink, marginBottom: 6 },
});
