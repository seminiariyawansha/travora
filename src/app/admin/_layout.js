// src/app/admin/_layout.js
import { Redirect, Stack, usePathname } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getUserProfile } from "../../services/authService";
import { auth } from "../../services/firebaseConfig";
import { colors } from "../../theme/colors";

// Guards every screen inside /admin. Only users with role "admin" get in.
export default function AdminLayout() {
  const pathname = usePathname();
  // "checking" | "admin" | "denied"
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("denied");
        return;
      }
      setStatus("checking");
      try {
        const profile = await getUserProfile(user.uid);
        setStatus(profile?.role === "admin" ? "admin" : "denied");
      } catch (e) {
        setStatus("denied");
      }
    });
    return unsubscribe;
  }, []);

  const isLoginScreen = pathname === "/admin/login";

  if (!isLoginScreen) {
    if (status === "checking") {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: colors.sand,
          }}
        >
          <ActivityIndicator color={colors.teal} />
        </View>
      );
    }
    if (status === "denied") {
      return <Redirect href="/admin/login" />;
    }
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}