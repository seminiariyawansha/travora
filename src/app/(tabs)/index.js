// src/app/(tabs)/index.js
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenContainer from "../../components/ScreenContainer";
import WeatherBanner from "../../components/WeatherBanner";
import { mockUser, mockWeather } from "../../data/mockData";
import { getDestinations } from "../../services/destinationService";
import { colors } from "../../theme/colors";
import { useResponsive } from "../../theme/responsive";

const SERVICES = [
  { key: "weather", label: "Weather", icon: "rainy-outline" },
  { key: "location", label: "Location", icon: "navigate-outline" },
  { key: "offline", label: "Offline", icon: "cloud-download-outline" },
  { key: "stories", label: "Stories", icon: "book-outline" },
];

export default function Home() {
  const router = useRouter();
  const { moderateScale } = useResponsive();
  const [destinations, setDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Refetches every time this screen comes into focus, so content Admin
  // just added shows up without needing to restart the app.
  useFocusEffect(
    useCallback(() => {
      getDestinations().then(setDestinations);
    }, []),
  );

  const filteredDestinations = destinations.filter((dest) =>
    dest.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenContainer>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { fontSize: moderateScale(12) }]}>
              Hello,
            </Text>
            <Text style={[styles.name, { fontSize: moderateScale(18) }]}>
              {mockUser.name}!
            </Text>
          </View>
          <View style={styles.avatar} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={17} color={colors.gray} />
            <TextInput
              style={[styles.searchInput, { fontSize: moderateScale(13.5) }]}
              placeholder="Search destinations..."
              placeholderTextColor={colors.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.gray} />
              </Pressable>
            )}
          </View>

          <View>
            <Text
              style={[styles.sectionTitle, { fontSize: moderateScale(16) }]}
            >
              {searchQuery
                ? `Results for "${searchQuery}"`
                : "Top Destinations"}
            </Text>

            {filteredDestinations.length === 0 ? (
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No destinations match your search."
                  : "No destinations yet."}
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filteredDestinations.map((dest) => (
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
                    {dest.sizeMb && (
                      <Text style={styles.destBadge}>{dest.sizeMb} MB</Text>
                    )}
                    <Text
                      style={[styles.destName, { fontSize: moderateScale(15) }]}
                    >
                      {dest.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {!searchQuery && (
            <>
              <View>
                <Text
                  style={[styles.sectionTitle, { fontSize: moderateScale(16) }]}
                >
                  Services
                </Text>
                <View style={styles.servicesRow}>
                  {SERVICES.map((service) => (
                    <View key={service.key} style={styles.serviceItem}>
                      <View style={styles.serviceIcon}>
                        <Ionicons
                          name={service.icon}
                          size={moderateScale(20)}
                          color={colors.white}
                        />
                      </View>
                      <Text
                        style={[
                          styles.serviceLabel,
                          { fontSize: moderateScale(10.5) },
                        ]}
                      >
                        {service.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <WeatherBanner
                reasonText={mockWeather.reasonText}
                onPressWhy={() => {}}
              />
            </>
          )}
        </ScrollView>
      </ScreenContainer>
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
  greeting: { color: colors.gray },
  name: { fontWeight: "700", color: colors.ink },
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
  searchInput: { flex: 1, color: colors.ink },
  sectionTitle: { fontWeight: "700", color: colors.ink, marginBottom: 10 },
  emptyText: { fontSize: 12.5, color: colors.gray, fontStyle: "italic" },
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
  destName: { color: colors.white, fontWeight: "700" },
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
  serviceLabel: { fontWeight: "600", color: colors.ink, textAlign: "center" },
});
