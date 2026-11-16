// src/app/login.js
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Button from "../components/Button";
import ScreenContainer from "../components/ScreenContainer";
import { getUserProfile, loginUser } from "../services/authService";
import { colors } from "../theme/colors";
import { useResponsive } from "../theme/responsive";

export default function Login() {
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
      const user = await loginUser(email, password);
      // If the logged in user is an admin, navigate directly to admin dashboard
      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }
      } catch (profileErr) {
        // Fall back to standard app on profile check failure
      }
      router.replace("/(tabs)");
    } catch (err) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Incorrect email or password.");
      } else if (err.code === "auth/network-request-failed") {
        setError("No internet. Connect and try again.");
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
          Welcome back
        </Text>
        <Text style={[styles.subtitle, { fontSize: moderateScale(13) }]}>
          Log in to continue your journey
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email address"
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

        <Pressable
          onPress={() => router.push("/register")}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.link}>Don't have an account? Register</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/admin/login")}
          style={{ marginTop: 24, alignItems: "center" }}
        >
          <Text style={styles.adminLink}>Admin Portal ›</Text>
        </Pressable>
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
  link: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  adminLink: {
    color: colors.gray,
    fontSize: 12.5,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
