// src/services/geofenceService.js
import { isWithinRadius } from "../utils/locationUtils";

/**
 * Checks a user's location against an array of destination points to see
 * if the user has entered the geofence radius of any locked points.
 *
 * @param {object} userLocation - Object containing { latitude, longitude }
 * @param {Array} points - Array of point objects (from mockData or cached DB)
 * @returns {Array} Array of locked points that the user has entered
 */
export function checkGeofence(userLocation, points) {
  // Safely return empty array if location or points list is invalid
  if (
    !userLocation ||
    typeof userLocation.latitude !== "number" ||
    typeof userLocation.longitude !== "number" ||
    !Array.isArray(points)
  ) {
    return [];
  }

  const { latitude: userLat, longitude: userLng } = userLocation;

  // Find all locked points where the user is inside the required radius
  return points.filter((point) => {
    // Skip points with missing coordinates or radius
    if (
      !point ||
      typeof point.latitude !== "number" ||
      typeof point.longitude !== "number" ||
      typeof point.radiusMeters !== "number"
    ) {
      return false;
    }

    // Ignore points that are already unlocked
    if (point.unlocked === true) {
      return false;
    }

    // Check if the user is inside the point's geofence radius
    return isWithinRadius(
      userLat,
      userLng,
      point.latitude,
      point.longitude,
      point.radiusMeters
    );
  });
}
