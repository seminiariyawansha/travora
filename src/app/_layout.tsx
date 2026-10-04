import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { subscribeToConnectivity } from "../db/networkService";
import { syncPendingProgress } from "../db/syncService";

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = subscribeToConnectivity((online) => {
      if (online) {
        syncPendingProgress().catch((e) => console.log("Sync failed:", e));
      }
    });
    return unsubscribe;
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#208AEF",
        tabBarInactiveTintColor: "#9AA4B2",

        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          height: 60 + insets.bottom,
          paddingTop: 5,
          paddingBottom: insets.bottom + 5,
          borderTopWidth: 1,
          borderTopColor: "#E8EEF5",
          elevation: 8,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },

        tabBarItemStyle: {
          flex: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "compass" : "compass-outline"}
              size={27}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="destination"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
