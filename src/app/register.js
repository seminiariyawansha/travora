// src/app/register.js
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
import { registerUser } from "../services/authService";
import { colors } from "../theme/colors";
import { useResponsive } from "../theme/responsive";

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { moderateScale } = useResponsive();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await registerUser(name, email, password);
      router.replace("/(tabs)");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("That email is already registered.");
      } else if (err.code === "auth/invalid-email") {
        setError("That email address looks invalid.");
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
          Create your account
        </Text>
        <Text style={[styles.subtitle, { fontSize: moderateScale(13) }]}>
          Join and start exploring Sri Lanka
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor={colors.gray}
          value={name}
          onChangeText={setName}
        />
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
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor={colors.gray}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator color={colors.teal} style={{ marginTop: 10 }} />
        ) : (
          <Button title="Register" onPress={handleRegister} />
        )}

        <Pressable
          onPress={() => router.push("/login")}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.link}>Already have an account? Login</Text>
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
});
