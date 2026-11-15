import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import GpsSimulator from "../../components/GpsSimulator";
import Tag from "../../components/Tag";
import { useLocation } from "../../hooks/useLocation";
import { auth } from "../../services/firebaseConfig";
import { unlockNearbyPoints } from "../../services/unlockService";
import { isWithinRadius } from "../../utils/locationUtils";
import { colors } from "../../theme/colors";
import { getCachedPoints } from "../../db/offlineContentService";

export default function MapScreen() {
const router = useRouter();

const [points, setPoints] = useState([]);

useEffect(() => {
  async function loadCachedPoints() {
    try {
      const cachedPoints = await getCachedPoints("sigiriya");

      setPoints(
        cachedPoints.map((point) => ({
          ...point,
          unlocked: false,
          latitude:
            point.latitude === null ? null : Number(point.latitude),
          longitude:
            point.longitude === null ? null : Number(point.longitude),
          radiusMeters:
            point.radiusMeters === null
              ? null
              : Number(point.radiusMeters),
          pointsValue: Number(point.pointsValue || 0),
        }))
      );
    } catch (error) {
      console.error("Failed to load cached tourist points:", error);
    }
  }

  loadCachedPoints();
}, []);
const [simulatedLocation, setSimulatedLocation] = useState(null);

const { location: realLocation, errorMsg: locationError } = useLocation();

const effectiveLocation = simulatedLocation || realLocation;
const destinationId = "sigiriya";
const userId = auth?.currentUser?.uid;

// Only show points inside their geofence radius.
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

}, [
points,
effectiveLocation?.latitude,
effectiveLocation?.longitude,
]);

// Check and unlock nearby points whenever location changes.
useEffect(() => {
let isMounted = true;

async function handleGeofenceUnlock() {
  console.log("Geofence function started");
  console.log("Effective location:", effectiveLocation);
  console.log("Firebase user ID:", userId);
  console.log("Loaded points:", points);

  if (!effectiveLocation || !userId) {
    console.log("Geofence check stopped: location or user ID missing");
    return;
  }

  try {
    const newlyUnlocked = await unlockNearbyPoints(
      effectiveLocation,
      points,
      userId,
      destinationId
    );
    console.log("Newly unlocked points:", newlyUnlocked);
    console.log("Current user ID:", userId);

    if (isMounted && newlyUnlocked.length > 0) {
      // Create new point objects so React refreshes the markers and list.
      setPoints((currentPoints) =>
        currentPoints.map((point) => {
          const wasUnlocked = newlyUnlocked.some(
            (unlocked) => unlocked.id === point.id
          );

          return wasUnlocked
            ? { ...point, unlocked: true }
            : point;
        })
      );

      const unlockedPoint = newlyUnlocked[0];

      router.push({
        pathname: "/unlock",
        params: {
          pointId: unlockedPoint.id,
          pointsEarned: unlockedPoint.pointsValue ?? 10,
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
]);

return (
<SafeAreaView style={styles.container}>
<MapView
style={{ height: 320 }}
initialRegion={{
latitude: 7.957,
longitude: 80.7603,
latitudeDelta: 0.01,
longitudeDelta: 0.01,
}}
region={
effectiveLocation
? {
latitude: effectiveLocation.latitude,
longitude: effectiveLocation.longitude,
latitudeDelta: 0.01,
longitudeDelta: 0.01,
}
: undefined
}
>
{points
  .filter(
    (point) =>
      Number.isFinite(point.latitude) &&
      Number.isFinite(point.longitude)
  )
  .map((point) => (
    <Marker
      key={point.id}
      coordinate={{
        latitude: point.latitude,
        longitude: point.longitude,
      }}
      title={point.name}
      pinColor={point.unlocked ? colors.teal : colors.terracotta}
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

  <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
    <GpsSimulator
      points={points}
      onLocationChange={setSimulatedLocation}
    />

    {locationError && (
      <Text style={styles.errorText}>GPS Notice: {locationError}</Text>
    )}

    <Text style={styles.sectionTitle}>
      Points near you ({nearbyPoints.length})
    </Text>

    {nearbyPoints.length === 0 ? (
      <Text style={styles.emptyText}>
        No points nearby. Select another simulated location.
      </Text>
    ) : (
      nearbyPoints.map((point) => (
        <Pressable
          key={point.id}
          onPress={() =>
            router.push({
              pathname: "/story",
              params: { pointId: point.id },
            })
          }
          style={styles.pointRow}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.pointName}>{point.name}</Text>

            <Tag
              label={point.unlocked ? "Unlocked" : point.indoorFriendly ? "Indoor" : "Outdoor"}
              variant={point.unlocked ? "suggested" : "neutral"}
            />
          </View>
        </Pressable>
      ))
    )}
  </ScrollView>
</SafeAreaView>

);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: colors.sand,
},
sectionTitle: {
fontSize: 15,
fontWeight: "700",
color: colors.ink,
marginBottom: 4,
},
pointRow: {
flexDirection: "row",
backgroundColor: colors.white,
borderRadius: 14,
borderWidth: 1,
borderColor: colors.cardBorder,
padding: 12,
gap: 6,
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
},
});