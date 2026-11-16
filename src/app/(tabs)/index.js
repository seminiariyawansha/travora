// src/app/(tabs)/index.js
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenContainer from "../../components/ScreenContainer";
import WeatherBanner from "../../components/WeatherBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { isOnlineNow } from "../../db/networkService";
import { getCachedDestinations } from "../../db/offlineContentService";
import { getDestinations } from "../../services/destinationService";
import { colors } from "../../theme/colors";
import { useResponsive } from "../../theme/responsive";
import { getDestinationPhoto } from "../../utils/destinationImages";
import { getWeatherForDestination } from "../../weather/weatherFetchService";
import {
  getBannerWeatherReason,
  showWeatherExplanationAlert,
} from "../../weather/weatherReasonService";

const SERVICES = [
  { key: "weather", label: "Weather", icon: "rainy-outline" },
  { key: "location", label: "Location", icon: "navigate-outline" },
  { key: "offline", label: "Offline", icon: "cloud-download-outline" },
  { key: "stories", label: "Stories", icon: "book-outline" },
];

export default function Home() {
  const router = useRouter();
  const { moderateScale } = useResponsive();
  const { user, profile } = useAuth();
  const { colors, isDark } = useTheme();
  const [destinations, setDestinations] = useState([]);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Always read the live logged-in user, so edits made on the
  // Edit Profile screen show up here automatically.
  const fullName = profile?.name || user?.displayName || "Explorer";
  const firstName = fullName.trim().split(" ")[0];
  const avatarUrl = profile?.photoURL || user?.photoURL || null;
  const avatarSize = moderateScale(42);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function fetchHomeData() {
        try {
          const online = await isOnlineNow();
          let list = [];
          if (online) {
            try {
              list = await getDestinations();
            } catch (onlineErr) {
              console.log("Online destinations fetch failed:", onlineErr?.message);
            }
          }

          if (!list || list.length === 0) {
            list = await getCachedDestinations();
            if (active && (!online || list.length > 0)) {
              setIsOfflineMode(true);
            }
          } else if (active) {
            setIsOfflineMode(false);
          }

          if (!active) return;
          setDestinations(list || []);

          // Find first destination with valid coordinates
          const destWithCoords = (list || []).find(
            (d) =>
              d?.latitude != null &&
              d?.longitude != null &&
              !isNaN(Number(d.latitude)) &&
              !isNaN(Number(d.longitude)) &&
              Number.isFinite(Number(d.latitude)) &&
              Number.isFinite(Number(d.longitude))
          );

          if (destWithCoords) {
            try {
              const weather = await getWeatherForDestination(
                destWithCoords.id,
                Number(destWithCoords.latitude),
                Number(destWithCoords.longitude)
              );
              if (active) {
                setWeatherInfo(weather);
              }
            } catch (weatherError) {
              console.log("Home weather fetch error:", weatherError?.message);
              if (active) setWeatherInfo(null);
            }
          } else {
            if (active) setWeatherInfo(null);
          }
        } catch (error) {
          console.log("Failed to load destinations on home:", error?.message);
          try {
            const cached = await getCachedDestinations();
            if (active) {
              setDestinations(cached);
              setIsOfflineMode(true);
            }
          } catch {}
        }
      }

      fetchHomeData();
      return () => {
        active = false;
      };
    }, []),
  );

  const filteredDestinations = destinations.filter((dest) =>
    dest.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handlePressWhy = () => {
    showWeatherExplanationAlert(weatherInfo);
  };

  const handleServicePress = (key) => {
    switch (key) {
      case "stories":
        // Navigate to map tab so user can pick a destination → stories
        router.push({
          pathname: "/destination",
          params: { destinationId: destinations[0]?.id ?? "sigiriya" },
        });
        break;
      case "location":
        router.push("/(tabs)/map");
        break;
      case "weather":
        showWeatherExplanationAlert(weatherInfo);
        break;
      case "offline":
        router.push({
          pathname: "/destination",
          params: { destinationId: destinations[0]?.id ?? "sigiriya" },
        });
        break;
      default:
        break;
    }
  };

  const bannerReason = getBannerWeatherReason(weatherInfo);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top", "left", "right"]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <ScreenContainer>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { fontSize: moderateScale(12), color: colors.textSecondary }]}>
              Hello,
            </Text>
            <Text style={[styles.name, { fontSize: moderateScale(18), color: colors.textPrimary }]}>
              {firstName}!
            </Text>
          </View>

          <Pressable onPress={() => router.push("/(tabs)/profile")}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                }}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    backgroundColor: colors.teal,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarInitial,
                    { fontSize: moderateScale(16) },
                  ]}
                >
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Ionicons name="search" size={17} color={colors.gray} />
            <TextInput
              style={[styles.searchInput, { fontSize: moderateScale(13.5), color: colors.textPrimary }]}
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
            {isOfflineMode && (
              <View style={{ marginBottom: 8, paddingHorizontal: 2 }}>
                <Text
                  style={{
                    fontSize: moderateScale(12),
                    color: colors.terracotta,
                    fontWeight: "600",
                  }}
                >
                  Offline: showing downloaded destinations
                </Text>
              </View>
            )}
            <Text
              style={[styles.sectionTitle, { fontSize: moderateScale(16), color: colors.textPrimary }]}
            >
              {searchQuery
                ? `Results for "${searchQuery}"`
                : "Top Destinations"}
            </Text>

            {filteredDestinations.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery
                  ? "No destinations match your search."
                  : "No destinations yet."}
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filteredDestinations.map((dest) => {
                  const isValidPhoto = (url) =>
                    typeof url === "string" &&
                    (url.startsWith("http://") || url.startsWith("https://")) &&
                    !url.includes("wikimedia.org") &&
                    !url.includes("wikipedia.org") &&
                    !url.includes("placeholder");

                  const photoUri =
                    (isValidPhoto(dest.imageUrl) && dest.imageUrl) ||
                    (isValidPhoto(dest.photoUrl) && dest.photoUrl) ||
                    getDestinationPhoto(dest.id, dest.name);

                  return (
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
                      <ImageBackground
                        source={{ uri: photoUri }}
                        style={styles.destCardBg}
                        imageStyle={{ borderRadius: 16 }}
                      >
                        <View style={styles.destOverlay}>
                          {dest.sizeMb ? (
                            <Text style={styles.destBadge}>{dest.sizeMb} MB</Text>
                          ) : (
                            <View />
                          )}
                          <Text
                            style={[styles.destName, { fontSize: moderateScale(15) }]}
                          >
                            {dest.name}
                          </Text>
                        </View>
                      </ImageBackground>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {!searchQuery && (
            <>
              <View>
                <Text
                  style={[styles.sectionTitle, { fontSize: moderateScale(16), color: colors.textPrimary }]}
                >
                  Services
                </Text>
                <View style={styles.servicesRow}>
                  {SERVICES.map((service) => (
                    <Pressable
                      key={service.key}
                      style={({ pressed }) => [
                        styles.serviceItem,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => handleServicePress(service.key)}
                    >
                      <View style={[styles.serviceIcon, { backgroundColor: colors.teal }]}>
                        <Ionicons
                          name={service.icon}
                          size={moderateScale(20)}
                          color={colors.white}
                        />
                      </View>
                      <Text
                        style={[
                          styles.serviceLabel,
                          { fontSize: moderateScale(10.5), color: colors.textPrimary },
                        ]}
                      >
                        {service.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <WeatherBanner
                reasonText={bannerReason}
                onPressWhy={handlePressWhy}
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
  avatarPlaceholder: {
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: colors.white, fontWeight: "700" },
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
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#1B3A35",
  },
  destCardBg: {
    width: "100%",
    height: "100%",
  },
  destOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.38)",
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
