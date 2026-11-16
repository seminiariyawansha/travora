import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Switch,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Notifications() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    destinationUpdates: true,
    storyUnlocks: true,
    weatherAlerts: true,
  });

  const storageKey = `travora_notifications_${user?.uid || "guest"}`;

  useEffect(() => {
    async function loadSettings() {
      try {
        const saved = await AsyncStorage.getItem(storageKey);

        if (saved) {
          setSettings(JSON.parse(saved));
        }
      } catch (error) {
        console.log("Notification settings error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [storageKey]);

  async function toggleSetting(key, value) {
    const updatedSettings = {
      ...settings,
      [key]: value,
    };

    setSettings(updatedSettings);

    try {
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      console.log("Unable to save notification setting:", error);
    }
  }

  const notificationItems = [
    {
      key: "destinationUpdates",
      title: "Destination Updates",
      description: "Get updates about new destinations.",
      icon: "location-outline",
    },
    {
      key: "storyUnlocks",
      title: "Story Unlock Notifications",
      description: "Get notified when you unlock a story.",
      icon: "book-outline",
    },
    {
      key: "weatherAlerts",
      title: "Weather Alerts",
      description: "Receive weather-related alerts.",
      icon: "cloud-outline",
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bgSecondary }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <Ionicons
          name="chevron-back"
          size={24}
          color={colors.textPrimary}
          onPress={() => router.back()}
        />

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Notifications
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <ScreenContainer style={{ padding: 20 }}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>
          Notification Preferences
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose which updates you would like to receive from Travora.
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.teal}
            style={{ marginTop: 30 }}
          />
        ) : (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {notificationItems.map((item, index) => (
              <View
                key={item.key}
                style={[
                  styles.row,
                  index !== notificationItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={23}
                  color={colors.teal}
                />

                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.title,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={[
                      styles.description,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.description}
                  </Text>
                </View>

                <Switch
                  value={settings[item.key]}
                  onValueChange={(value) =>
                    toggleSetting(item.key, value)
                  }
                  trackColor={{
                    false: "#BDBDBD",
                    true: colors.teal,
                  }}
                />
              </View>
            ))}
          </View>
        )}
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 22,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  description: {
    fontSize: 11,
    marginTop: 5,
  },
});