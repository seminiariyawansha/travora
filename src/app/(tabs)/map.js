import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import GpsSimulator from "../../components/GpsSimulator";
import Tag from "../../components/Tag";
import { mockPoints } from "../../data/mockData";
import { useLocation } from "../../hooks/useLocation";
import { auth } from "../../services/firebaseConfig";
import { getPoints } from "../../services/destinationService";
import { unlockNearbyPoints } from "../../services/unlockService";
import { isWithinRadius } from "../../utils/locationUtils";
import { colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";
import { getCachedPoints } from "../../db/offlineContentService";

function normalizePoint(point) {
  const lat = point.latitude ?? point.lat;
  const lon = point.longitude ?? point.lon ?? point.lng;
  const radius = point.radiusMeters ?? point.radius ?? 100;
  return {
    ...point,
    latitude: lat != null ? Number(lat) : null,
    longitude: lon != null ? Number(lon) : null,
    radiusMeters: radius != null ? Number(radius) : 100,
    pointsValue: Number(point.pointsValue || point.points || 10),
    unlocked: !!point.unlocked,
  };
}

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const themeContext = useTheme();
  const themeColors = themeContext?.colors || colors;
  const isDark = themeContext?.isDark || false;

  const destinationId = params.destinationId || "sigiriya";

  const mapRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulatedLocation, setSimulatedLocation] = useState(null);

  const { location: realLocation, errorMsg: locationError } = useLocation();
  const effectiveLocation = simulatedLocation || realLocation;
  const userId = auth?.currentUser?.uid;

  // 1. Robust 3-tier point loading: Firebase -> SQLite Cache -> mockPoints
  useEffect(() => {
    let isMounted = true;

    async function loadPoints() {
      setLoading(true);
      let rawPoints = [];

      // Tier 1: Try Firebase first when online
      try {
        const onlinePoints = await getPoints(destinationId);
        if (Array.isArray(onlinePoints) && onlinePoints.length > 0) {
          rawPoints = onlinePoints;
        }
      } catch (err) {
        console.log("Online points fetch failed, trying local cache:", err.message);
      }

      // Tier 2: Try SQLite cached points if Firebase had nothing
      if (rawPoints.length === 0) {
        try {
          const cached = await getCachedPoints(destinationId);
          if (Array.isArray(cached) && cached.length > 0) {
            rawPoints = cached;
          }
        } catch (err) {
          console.log("Cached points fetch failed:", err.message);
        }
      }

      // Tier 3: Fall back to mock points so map is NEVER empty
      if (rawPoints.length === 0) {
        rawPoints = mockPoints[destinationId] || mockPoints.sigiriya || [];
      }

      if (isMounted) {
        const formatted = rawPoints
          .map(normalizePoint)
          .filter(
            (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
          );
        setPoints(formatted);
        setLoading(false);

        // Center map on destination points
        if (formatted.length > 0 && mapRef.current) {
          setTimeout(() => {
            mapRef.current?.animateToRegion(
              {
                latitude: formatted[0].latitude,
                longitude: formatted[0].longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              },
              600
            );
          }, 300);
        }
      }
    }

    loadPoints();

    return () => {
      isMounted = false;
    };
  }, [destinationId]);

  // Points within geofence radius of effective user/simulated location
  const nearbyPoints = useMemo(() => {
    if (!effectiveLocation) return [];

    return points.filter((point) => {
      if (
        typeof point.latitude !== "number" ||
        typeof point.longitude !== "number" ||
        typeof point.radiusMeters !== "number"
      ) {
        return false;
      }

      return isWithinRadius(
        effectiveLocation.latitude,
        effectiveLocation.longitude,
        point.latitude,
        point.longitude,
        point.radiusMeters
      );
    });
  }, [points, effectiveLocation?.latitude, effectiveLocation?.longitude]);

  // Check and unlock nearby points whenever location changes
  useEffect(() => {
    let isMounted = true;

    async function handleGeofenceUnlock() {
      if (!effectiveLocation || !userId || points.length === 0) return;

      try {
        const newlyUnlocked = await unlockNearbyPoints(
          effectiveLocation,
          points,
          userId,
          destinationId
        );

        if (isMounted && newlyUnlocked.length > 0) {
          setPoints((currentPoints) =>
            currentPoints.map((point) => {
              const wasUnlocked = newlyUnlocked.some(
                (unlocked) => unlocked.id === point.id
              );
              return wasUnlocked ? { ...point, unlocked: true } : point;
            })
          );

          const unlockedPoint = newlyUnlocked[0];
          router.push({
            pathname: "/unlock",
            params: {
              pointId: unlockedPoint.id,
              pointsEarned: unlockedPoint.pointsValue ?? 10,
              destinationId,
            },
          });
        }
      } catch (error) {
        console.error("Geofence check error on map screen:", error);
      }
    }

    handleGeofenceUnlock();

    return () => {
      isMounted = false;
    };
  }, [
    effectiveLocation?.latitude,
    effectiveLocation?.longitude,
    userId,
    points,
    destinationId,
  ]);

  // Handler when selecting a simulated location from GpsSimulator
  const handleLocationChange = (loc) => {
    setSimulatedLocation(loc);
    if (loc && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        500
      );
    }
  };

  // Center map on a specific point tapped in the list
  const handleCenterOnPoint = (point) => {
    if (
      mapRef.current &&
      Number.isFinite(point.latitude) &&
      Number.isFinite(point.longitude)
    ) {
      mapRef.current.animateToRegion(
        {
          latitude: point.latitude,
          longitude: point.longitude,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        },
        500
      );
    }
  };

  // Recenter button: jump back to destination
  const handleRecenterDestination = () => {
    if (points.length > 0 && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: points[0].latitude,
          longitude: points[0].longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        500
      );
    }
  };

  // Initial region centered on points or Sigiriya
  const initialRegion = useMemo(() => {
    const first = points[0];
    return {
      latitude: first ? first.latitude : 7.957,
      longitude: first ? first.longitude : 80.7603,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    };
  }, [points]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.bg }]}
    >
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
        >
          {points.map((point) => (
            <Marker
              key={point.id}
              coordinate={{
                latitude: point.latitude,
                longitude: point.longitude,
              }}
              title={point.name}
              description={`Radius: ${point.radiusMeters}m | ${point.unlocked ? "Unlocked" : "Locked"}`}
              pinColor={point.unlocked ? themeColors.teal : "#E65100"}
            />
          ))}

          {effectiveLocation && (
            <Marker
              coordinate={{
                latitude: effectiveLocation.latitude,
                longitude: effectiveLocation.longitude,
              }}
              title={simulatedLocation ? "Simulated Location" : "Your Location"}
              pinColor="#2196F3"
            />
          )}
        </MapView>

        {/* Quick action buttons floating on the map */}
        <View style={styles.floatingControls}>
          <Pressable
            style={[styles.floatingButton, { backgroundColor: themeColors.surface }]}
            onPress={handleRecenterDestination}
          >
            <Ionicons name="compass-outline" size={20} color={themeColors.teal} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* GPS Simulator with points passed in */}
        <GpsSimulator
          points={points}
          onLocationChange={handleLocationChange}
        />

        {locationError && (
          <Text style={styles.errorText}>GPS Notice: {locationError}</Text>
        )}

        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionTitle, { color: themeColors.textPrimary }]}
          >
            Points near you ({nearbyPoints.length})
          </Text>
          {loading && (
            <ActivityIndicator size="small" color={themeColors.teal} />
          )}
        </View>

        {nearbyPoints.length === 0 ? (
          <Text
            style={[styles.emptyText, { color: themeColors.textSecondary }]}
          >
            No points within geofence radius. Tap any point in the GPS Simulator
            above to teleport nearby.
          </Text>
        ) : (
          nearbyPoints.map((point) => (
            <Pressable
              key={point.id}
              onPress={() => {
                handleCenterOnPoint(point);
                router.push({
                  pathname: "/story",
                  params: { pointId: point.id, destinationId },
                });
              }}
              style={[
                styles.pointRow,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.cardBorder,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.pointName,
                    { color: themeColors.textPrimary },
                  ]}
                >
                  {point.name}
                </Text>

                <Tag
                  label={
                    point.unlocked
                      ? "Unlocked"
                      : point.indoorFriendly
                      ? "Indoor"
                      : "Outdoor"
                  }
                  variant={point.unlocked ? "suggested" : "neutral"}
                />
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={themeColors.textSecondary}
              />
            </Pressable>
          ))
        )}

        {/* All Destination Points List */}
        <Text
          style={[
            styles.sectionTitle,
            { color: themeColors.textPrimary, marginTop: 16 },
          ]}
        >
          All Points ({points.length})
        </Text>

        {points.map((point) => (
          <Pressable
            key={`all-${point.id}`}
            onPress={() => handleCenterOnPoint(point)}
            style={[
              styles.allPointCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name={point.unlocked ? "checkmark-circle" : "location"}
              size={20}
              color={point.unlocked ? themeColors.teal : "#E65100"}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.allPointName, { color: themeColors.textPrimary }]}
              >
                {point.name}
              </Text>
              <Text
                style={[styles.allPointCoords, { color: themeColors.textSecondary }]}
              >
                {point.latitude?.toFixed(4)}, {point.longitude?.toFixed(4)} • {point.radiusMeters}m
              </Text>
            </View>
            <Pressable
              style={[styles.viewStoryBtn, { backgroundColor: themeColors.teal }]}
              onPress={() =>
                router.push({
                  pathname: "/story",
                  params: { pointId: point.id, destinationId },
                })
              }
            >
              <Text style={styles.viewStoryBtnText}>Story</Text>
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  mapWrapper: {
    height: 320,
    width: "100%",
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingControls: {
    position: "absolute",
    right: 14,
    top: 14,
    gap: 8,
  },
  floatingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    padding: 20,
    gap: 10,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 4,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    gap: 8,
  },
  pointName: {
    fontSize: 13.5,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 4,
  },
  errorText: {
    color: "#C0392B",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptyText: {
    color: colors.ink,
    fontSize: 13,
    paddingVertical: 10,
    lineHeight: 18,
  },
  allPointCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    gap: 10,
  },
  allPointName: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  allPointCoords: {
    fontSize: 11.5,
    marginTop: 2,
  },
  viewStoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewStoryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
