// src/components/GpsSimulator.js
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { mockPoints } from "../data/mockData";
import { colors } from "../theme/colors";

/**
 * GPS Simulator Component for development and university project demonstrations.
 * Allows selecting mock destination points to simulate GPS location updates.
 *
 * @param {Array} points - Array of destination points (defaults to mockPoints.sigiriya)
 * @param {function} onLocationChange - Callback invoked when a simulated location is selected
 */
export default function GpsSimulator({
  points = mockPoints.sigiriya,
  onLocationChange,
}) {
  const [selectedPointId, setSelectedPointId] = useState(null);
  const [activeLocation, setActiveLocation] = useState(null);

  const handleSelectPoint = (point) => {
    setSelectedPointId(point.id);
    setActiveLocation(point);

    if (onLocationChange) {
      onLocationChange({
        latitude: point.latitude,
        longitude: point.longitude,
      });
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="navigate-circle-outline" size={22} color={colors.teal} />
        <Text style={styles.title}>GPS Simulator (Demo Tool)</Text>
      </View>

      <Text style={styles.subtitle}>
        Tap a point to simulate moving to its exact GPS coordinates:
      </Text>

      {/* Points selection list */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {(points || []).map((point) => {

          const isSelected = selectedPointId === point.id;
          return (
            <Pressable
              key={point.id}
              onPress={() => handleSelectPoint(point)}
              style={[
                styles.pointButton,
                isSelected && styles.selectedPointButton,
              ]}
            >
              <Ionicons
                name={isSelected ? "location" : "location-outline"}
                size={16}
                color={isSelected ? colors.white : colors.teal}
              />
              <Text
                style={[
                  styles.pointButtonText,
                  isSelected && styles.selectedPointText,
                ]}
              >
                {point.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Active simulated coordinates status display */}
      {activeLocation ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>
            📍 Currently Simulating: {activeLocation.name}
          </Text>
          <Text style={styles.coordsText}>
            Lat: {activeLocation.latitude} | Lng: {activeLocation.longitude}
          </Text>
          <Text style={styles.radiusText}>
            Radius: {activeLocation.radiusMeters}m | Status:{" "}
            {activeLocation.unlocked ? "Unlocked" : "Locked"}
          </Text>
        </View>
      ) : (
        <Text style={styles.placeholderText}>
          No simulated location selected yet.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginVertical: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.gray,
    marginBottom: 12,
  },
  scrollContainer: {
    gap: 8,
    paddingBottom: 4,
  },
  pointButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectedPointButton: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  pointButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  selectedPointText: {
    color: colors.white,
  },
  statusBox: {
    marginTop: 12,
    backgroundColor: colors.sand,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.teal,
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 12,
    color: colors.ink,
  },
  radiusText: {
    fontSize: 11.5,
    color: colors.gray,
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 12,
    fontStyle: "italic",
    color: colors.gray,
    marginTop: 10,
  },
});
