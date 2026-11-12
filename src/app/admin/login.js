// src/app/admin/login.js
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Button from "../../components/Button";
import ScreenContainer from "../../components/ScreenContainer";
import { colors } from "../../theme/colors";
import { useResponsive } from "../../theme/responsive";

// TODO (Member 2): replace this with the real admin login using Firebase Auth,
// including a check that the user has the admin role.
async function adminLogin(email, password) {
  // Temporary dummy check so the screen can be tested without the backend.
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (email === "admin@travora.com" && password === "admin123") {
    return true;
  }
  const error = new Error("invalid");
  error.code = "auth/invalid-credential";
  throw error;
}

export default function AdminLogin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { moderateScale } = useResponsive();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      await adminLogin(email, password);
      router.replace("/admin/dashboard");
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setError("Incorrect email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenContainer
        style={{
          padding: 24,
          justifyContent: "center",
          paddingBottom: insets.bottom + 24,
        }}
      >
        <Text style={[styles.title, { fontSize: moderateScale(22) }]}>
          Admin Login
        </Text>
        <Text style={[styles.subtitle, { fontSize: moderateScale(13) }]}>
          Sign in to manage destinations and content
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Admin email"
          placeholderTextColor={colors.gray}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.gray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator color={colors.teal} style={{ marginTop: 10 }} />
        ) : (
          <Button title="Login" onPress={handleLogin} />
        )}
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  title: { fontWeight: "700", color: colors.ink },
  subtitle: { color: colors.gray, marginTop: 4, marginBottom: 20 },
  error: {
    color: "#C0392B",
    fontSize: 12.5,
    marginBottom: 12,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 14,
  },
});