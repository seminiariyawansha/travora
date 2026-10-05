// src/app/login.js
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput
} from "react-native";
import Button from "../components/Button";
import { colors } from "../theme/colors";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin() {
    // TODO: once Member 2's authService.js is merged, call loginUser(email, password) here
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to continue your journey</Text>

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor={colors.gray}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.gray}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Login" onPress={handleLogin} />

      <Pressable
        onPress={() => router.push("/register")}
        style={{ marginTop: 16 }}
      >
        <Text style={styles.link}>Don't have an account? Register</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
    padding: 24,
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink },
  subtitle: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 4,
    marginBottom: 24,
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
