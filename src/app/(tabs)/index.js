// src/app/(tabs)/index.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import WeatherBanner from "../../components/WeatherBanner";
import { mockUser, mockWeather } from "../../data/mockData"; // weather/user still mock until Member 5 and progress wiring are both in
import { getAllDestinations } from "../../services/destinationService";
import { colors } from "../../theme/colors";

const SERVICES = [
  { key: "weather", label: "Weather", icon: "rainy-outline" },
  { key: "location", label: "Location", icon: "navigate-outline" },
  { key: "offline", label: "Offline", icon: "cloud-download-outline" },
  { key: "stories", label: "Stories", icon: "book-outline" },
];

export default function Home() {
  const router = useRouter();
  const [destinations, setDestinations] = useState([]);

  // Refetches every time this screen comes into focus — so a destination
  // Admin just added shows up without needing to restart the app.
  useFocusEffect(
    useCallback(() => {
      getAllDestinations().then(setDestinations);
    }, []),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>{mockUser.name}!</Text>
        </View>
        <View style={styles.avatar} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={colors.gray} />
          <Text style={{ color: colors.gray, fontSize: 13.5 }}>
            Search destinations...
          </Text>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Top Destinations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {destinations.map((dest) => (
              <Pressable
                key={dest.id}
                onPress={() =>
                  router.push({
                    pathname: "/destination",
                    params: { destinationId: dest.id },
                  })
                }
                style={styles.destCard}
              >
                <Text style={styles.destBadge}>{dest.sizeMb} MB</Text>
                <Text style={styles.destName}>{dest.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesRow}>
            {SERVICES.map((service) => (
              <View key={service.key} style={styles.serviceItem}>
                <View style={styles.serviceIcon}>
                  <Ionicons
                    name={service.icon}
                    size={20}
                    color={colors.white}
                  />
                </View>
                <Text style={styles.serviceLabel}>{service.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <WeatherBanner
          reasonText={mockWeather.reasonText}
          onPressWhy={() => {}}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 0,
  },
  greeting: { fontSize: 12, color: colors.gray },
  name: { fontSize: 18, fontWeight: "700", color: colors.ink },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.ink,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 10,
  },
  destCard: {
    width: 150,
    height: 170,
    borderRadius: 16,
    backgroundColor: colors.teal,
    marginRight: 12,
    padding: 12,
    justifyContent: "space-between",
  },
  destBadge: {
    alignSelf: "flex-end",
    backgroundColor: colors.terracotta,
    color: colors.ink,
    fontSize: 10,
    fontWeight: "700",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  destName: { color: colors.white, fontSize: 15, fontWeight: "700" },
  servicesRow: { flexDirection: "row", justifyContent: "space-between" },
  serviceItem: { alignItems: "center", gap: 6 },
  serviceIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceLabel: { fontSize: 10.5, fontWeight: "600", color: colors.ink },
});
