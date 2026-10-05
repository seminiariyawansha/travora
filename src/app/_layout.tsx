import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="destination" />
      <Stack.Screen name="story" />
      <Stack.Screen name="unlock" />
      <Stack.Screen name="progress" />
      <Stack.Screen name="badge" />
    </Stack>
  );
}
