// src/app/(tabs)/map.js
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GpsSimulator from "../../components/GpsSimulator";
import LeafletMap from "../../components/LeafletMap";
import MapSearch from "../../components/MapSearch";
import Tag from "../../components/Tag";
import { mockPoints } from "../../data/mockData";
import { getCachedPoints } from "../../db/offlineContentService";
import { getPendingSync } from "../../db/syncQueue";
import { useLocation } from "../../hooks/useLocation";
import { getPoints } from "../../services/destinationService";
import { auth } from "../../services/firebaseConfig";
import { getUserProgress } from "../../services/progressService";
import { unlockNearbyPoints } from "../../services/unlockService";
import { colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";
import { useResponsive } from "../../theme/responsive";

const SIGIRIYA_CENTER = { lat: 7.957, lng: 80.7603 };
const VISITED_COLOR = "#8FA89F";
const NEXT_COLOR = "#C8553D";

// Straight-line distance in metres between two coordinates
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters) {
  if (meters == null) return null;
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km away`
    : `${Math.round(meters)} m away`;
}

// Normalize coordinate & point field variations
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

// Which point IDs has this tourist already visited? Saved progress from
// Firestore, plus anything unlocked offline that is still waiting to sync.
async function loadVisitedIds(userId, destinationId) {
  const ids = new Set();

  if (userId) {
    try {
      const progress = await getUserProgress(userId, destinationId);
      (progress?.unlockedPoints ?? []).forEach((id) => ids.add(id));
    } catch (error) {
      console.log("Map: saved progress unavailable:", error.message);
    }
  }

  try {
    const pending = await getPendingSync();
    pending
      .filter(
        (item) =>
          item.actionType === "unlock" &&
          item.destinationId === destinationId &&
          (!userId || item.userId === userId),
      )
      .forEach((item) => ids.add(item.pointId));
  } catch (error) {
    console.log("Map: pending unlocks unavailable:", error.message);
  }

  return ids;
}

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const destinationId = params.destinationId || "sigiriya";

  const { height } = useResponsive();
  const themeContext = useTheme();
  const themeColors = themeContext?.colors || colors;
  const isDark = themeContext?.isDark || false;

  const mapHeight = Math.min(Math.max(height * 0.42, 260), 480);

  const [points, setPoints] = useState([]);
  const [simulatedLocation, setSimulatedLocation] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [follow, setFollow] = useState(true);
  const [focus, setFocus] = useState(null);
  const [searchMarker, setSearchMarker] = useState(null);
  const [mapType, setMapType] = useState("google");

  const { location: realLocation, errorMsg: locationError } = useLocation();
  const effectiveLocation = simulatedLocation || realLocation;
  const userId = auth?.currentUser?.uid;

  // Load points with robust 3-tier fallback (SQLite -> Firestore -> mockPoints)
  // Runs every time this tab is focused so progress is always current.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        let rawPoints = [];

        // 1. Try SQLite offline cache first
        try {
          const cached = await getCachedPoints(destinationId);
          if (Array.isArray(cached) && cached.length > 0) {
            rawPoints = cached;
          }
        } catch (error) {
          console.log("Map: local cache unavailable:", error.message);
        }

        // 2. If SQLite has no points, try online Firestore
        if (rawPoints.length === 0) {
          try {
            const onlinePoints = await getPoints(destinationId);
            if (Array.isArray(onlinePoints) && onlinePoints.length > 0) {
              rawPoints = onlinePoints;
            }
          } catch (error) {
            console.log("Map: online points fetch failed:", error.message);
          }
        }

        // 3. Fallback to mock data so map is never blank
        if (rawPoints.length === 0) {
          rawPoints = mockPoints[destinationId] || mockPoints.sigiriya || [];
        }

        const visited = await loadVisitedIds(userId, destinationId);
        if (!active) return;

        setPoints((previous) =>
          rawPoints.map(normalizePoint).map((point) => ({
            ...point,
            unlocked:
              visited.has(point.id) ||
              previous.find((p) => p.id === point.id)?.unlocked === true,
          })),
        );
      }

      load();
      return () => {
        active = false;
      };
    }, [userId, destinationId]),
  );

  // Add distance and a status to every point:
  // visited, next (nearest one still to visit) or todo
  const { allPoints, toVisit, visited } = useMemo(() => {
    const withDistance = points.map((point) => ({
      ...point,
      distance:
        effectiveLocation &&
        Number.isFinite(point.latitude) &&
        Number.isFinite(point.longitude)
          ? distanceMeters(
              effectiveLocation.latitude,
              effectiveLocation.longitude,
              point.latitude,
              point.longitude,
            )
          : null,
    }));

    const notVisited = withDistance
      .filter((p) => !p.unlocked)
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

    // Only call something "next" when we know where the user is
    const nextId = effectiveLocation ? notVisited[0]?.id : null;

    const withStatus = withDistance.map((p) => ({
      ...p,
      status: p.unlocked ? "visited" : p.id === nextId ? "next" : "todo",
    }));

    return {
      allPoints: withStatus,
      toVisit: withStatus
        .filter((p) => !p.unlocked)
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)),
      visited: withStatus.filter((p) => p.unlocked),
    };
  }, [points, effectiveLocation?.latitude, effectiveLocation?.longitude]);

  // Check and unlock nearby points whenever location changes.
  useEffect(() => {
    let isMounted = true;

    async function handleGeofenceUnlock() {
      if (!effectiveLocation || !userId) return;

      const candidates = points.filter((p) => !p.unlocked);
      if (candidates.length === 0) return;

      try {
        const newlyUnlocked = await unlockNearbyPoints(
          effectiveLocation,
          candidates,
          userId,
          destinationId,
        );

        if (isMounted && newlyUnlocked.length > 0) {
          console.log("Newly unlocked points:", newlyUnlocked);

          setPoints((currentPoints) =>
            currentPoints.map((point) =>
              newlyUnlocked.some((unlocked) => unlocked.id === point.id)
                ? { ...point, unlocked: true }
                : point,
            ),
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

  // The simple shape the map needs for each pin
  const mapPoints = useMemo(
    () =>
      allPoints
        .filter(
          (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
        )
        .map((p) => ({
          id: p.id,
          name: p.name,
          lat: p.latitude,
          lng: p.longitude,
          status: p.status,
        })),
    [allPoints],
  );

  // Map center from points or default
  const mapCenter = useMemo(() => {
    const first = allPoints.find(
      (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
    );
    return first ? { lat: first.latitude, lng: first.longitude } : SIGIRIYA_CENTER;
  }, [allPoints]);

  function openStory(pointId) {
    router.push({ pathname: "/story", params: { pointId, destinationId } });
  }

  // Tapping a pin: visited points open their story, others show name
  function handlePinPress(pointId) {
    const point = allPoints.find((p) => p.id === pointId);
    if (point?.unlocked) openStory(pointId);
  }

  function flyToPoint(point) {
    setFollow(false);
    setSearchMarker(null);
    setFocus({
      lat: point.latitude,
      lng: point.longitude,
      zoom: 18,
      key: Date.now(),
    });
  }

  function flyToPlace(place) {
    setFollow(false);
    setSearchMarker({ lat: place.lat, lng: place.lng, label: place.name });
    setFocus({ lat: place.lat, lng: place.lng, zoom: 16, key: Date.now() });
  }

  function locateMe() {
    setFollow(true);
    if (effectiveLocation) {
      setFocus({
        lat: effectiveLocation.latitude,
        lng: effectiveLocation.longitude,
        zoom: 17,
        key: Date.now(),
      });
    } else if (mapCenter) {
      setFocus({
        lat: mapCenter.lat,
        lng: mapCenter.lng,
        zoom: 16,
        key: Date.now(),
      });
    }
  }

  function togglePanel() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPanelOpen((open) => !open);
  }

  function renderRow(point, onPress) {
    const isVisited = point.status === "visited";
    const isNext = point.status === "next";
    const dot = isVisited
      ? VISITED_COLOR
      : isNext
        ? NEXT_COLOR
        : themeColors.terracotta;

    return (
      <Pressable
        key={point.id}
        onPress={onPress}
        style={[
          styles.pointRow,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.cardBorder,
          },
          isVisited && (isDark ? { backgroundColor: "#1A2E28" } : styles.pointRowVisited),
        ]}
      >
        <View style={[styles.rowDot, { backgroundColor: dot }]}>
          {isVisited && (
            <Ionicons name="checkmark" size={12} color={colors.white} />
          )}
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            style={[
              styles.pointName,
              { color: themeColors.textPrimary },
              isVisited && { color: themeColors.textSecondary },
            ]}
          >
            {point.name}
          </Text>
          {formatDistance(point.distance) && (
            <Text style={[styles.distance, { color: themeColors.textSecondary }]}>
              {formatDistance(point.distance)}
            </Text>
          )}
        </View>
        <Tag
          label={isVisited ? "Visited" : isNext ? "Next stop" : "To visit"}
          variant={isVisited ? "unlocked" : "suggested"}
        />
      </Pressable>
    );
  }

  const progressPercent = allPoints.length
    ? (visited.length / allPoints.length) * 100
    : 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.bg }]}
      edges={["top", "left", "right"]}
    >
      {/* Map area: fixed height with panel open, fills screen when hidden */}
      <View
        style={[
          styles.mapWrap,
          panelOpen ? { height: mapHeight } : { flex: 1 },
        ]}
      >
        <LeafletMap
          center={mapCenter}
          zoom={16}
          points={mapPoints}
          userLocation={effectiveLocation}
          followUser={follow}
          focus={focus}
          searchMarker={searchMarker}
          mapType={mapType}
          onPointPress={handlePinPress}
          onUserMoved={() => setFollow(false)}
        />

        <MapSearch
          points={allPoints}
          onSelectPoint={flyToPoint}
          onSelectPlace={flyToPlace}
          onClear={() => setSearchMarker(null)}
        />

        {/* Legend */}
        <View
          style={[
            styles.legend,
            isDark && { backgroundColor: "rgba(30,30,30,0.92)" },
          ]}
        >
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: VISITED_COLOR }]}
            />
            <Text
              style={[
                styles.legendText,
                { color: themeColors.textPrimary },
              ]}
            >
              Visited
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: themeColors.terracotta }]}
            />
            <Text
              style={[
                styles.legendText,
                { color: themeColors.textPrimary },
              ]}
            >
              To visit
            </Text>
          </View>
        </View>

        {/* Map style toggle (Roads / Satellite) */}
        <Pressable
          style={[
            styles.layerButton,
            { backgroundColor: themeColors.surface },
          ]}
          onPress={() => setMapType((m) => (m === "google" ? "satellite" : "google"))}
          hitSlop={6}
        >
          <Ionicons
            name={mapType === "google" ? "earth-outline" : "map-outline"}
            size={20}
            color={themeColors.teal}
          />
        </Pressable>

        {/* Locate me */}
        <Pressable
          style={[
            styles.locateButton,
            { backgroundColor: themeColors.surface },
          ]}
          onPress={locateMe}
          hitSlop={6}
        >
          <Ionicons
            name={follow ? "navigate" : "navigate-outline"}
            size={20}
            color={themeColors.teal}
          />
        </Pressable>

        {/* Hide / show the panel */}
        <Pressable
          style={[
            styles.toggleButton,
            { backgroundColor: themeColors.teal },
          ]}
          onPress={togglePanel}
        >
          <Ionicons
            name={panelOpen ? "chevron-down" : "chevron-up"}
            size={16}
            color={colors.white}
          />
          <Text style={styles.toggleText}>
            {panelOpen ? "Hide panel" : "Show panel"}
          </Text>
        </Pressable>
      </View>

      {panelOpen && (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          <GpsSimulator
            points={points}
            onLocationChange={setSimulatedLocation}
          />

          {locationError && (
            <Text style={styles.errorText}>GPS Notice: {locationError}</Text>
          )}

          <View
            style={[
              styles.progressCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.cardBorder,
              },
            ]}
          >
            <View style={styles.progressHeader}>
              <Text
                style={[styles.sectionTitle, { color: themeColors.textPrimary }]}
              >
                Your progress
              </Text>
              <Text
                style={[
                  styles.progressCount,
                  { color: themeColors.textSecondary },
                ]}
              >
                {visited.length} of {allPoints.length} visited
              </Text>
            </View>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: themeColors.divider },
              ]}
            >
              <View
                style={[styles.progressFill, { width: `${progressPercent}%` }]}
              />
            </View>
          </View>

          <Text
            style={[styles.sectionTitle, { color: themeColors.textPrimary }]}
          >
            To visit ({toVisit.length})
          </Text>
          {toVisit.length === 0 ? (
            <Text
              style={[styles.emptyText, { color: themeColors.textSecondary }]}
            >
              {allPoints.length === 0
                ? "No points found. Check your internet connection or download destination."
                : "You've visited every point here. Well done!"}
            </Text>
          ) : (
            toVisit.map((point) => renderRow(point, () => flyToPoint(point)))
          )}

          {visited.length > 0 && (
            <>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: themeColors.textPrimary, marginTop: 6 },
                ]}
              >
                Visited ({visited.length})
              </Text>
              {visited.map((point) =>
                renderRow(point, () => openStory(point.id)),
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  mapWrap: { width: "100%", position: "relative", backgroundColor: "#EDE6D8" },

  legend: {
    position: "absolute",
    top: 68,
    left: 12,
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    zIndex: 5,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: "600", color: colors.ink },

  layerButton: {
    position: "absolute",
    right: 12,
    bottom: 90,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 5,
  },
  locateButton: {
    position: "absolute",
    right: 12,
    bottom: 40,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 5,
  },
  toggleButton: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.teal,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 5,
  },
  toggleText: { color: colors.white, fontSize: 12.5, fontWeight: "600" },

  progressCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    gap: 10,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressCount: { fontSize: 12, fontWeight: "600", color: colors.gray },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.divider,
  },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: VISITED_COLOR },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
  },
  pointRowVisited: { backgroundColor: "#F4F6F4" },
  rowDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  pointName: { fontSize: 13.5, fontWeight: "600", color: colors.ink },
  distance: { fontSize: 11.5, color: colors.gray },
  errorText: { color: "#C0392B", fontSize: 12, fontWeight: "600" },
  emptyText: { color: colors.ink, fontSize: 13, paddingVertical: 6 },
});
