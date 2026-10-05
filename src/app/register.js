// src/app/register.js
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

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleRegister() {
    // TODO: once Member 2's authService.js is merged, call registerUser(email, password) here
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Join and start exploring Sri Lanka</Text>

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
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        placeholderTextColor={colors.gray}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Button title="Register" onPress={handleRegister} />

      <Pressable
        onPress={() => router.push("/login")}
        style={{ marginTop: 16 }}
      >
        <Text style={styles.link}>Already have an account? Login</Text>
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
