// src/app/(tabs)/map.js
import { useRouter } from "expo-router";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Tag from "../../components/Tag";
import { mockPoints } from "../../data/mockData";
import { colors } from "../../theme/colors";

export default function MapScreen() {
  const router = useRouter();
  const points = mockPoints.sigiriya;

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
      >
        {points.map((point) => (
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
      </MapView>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
        <Text style={styles.sectionTitle}>Points near you</Text>
        {points.map((point) => (
          <Pressable
            key={point.id}
            onPress={() =>
              router.push({ pathname: "/story", params: { pointId: point.id } })
            }
            style={styles.pointRow}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.pointName}>{point.name}</Text>
              <Tag
                label={point.indoorFriendly ? "Indoor" : "Outdoor"}
                variant={point.suggested ? "suggested" : "neutral"}
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
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
});
