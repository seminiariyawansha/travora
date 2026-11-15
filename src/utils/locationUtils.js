// src/utils/locationUtils.js

/**
 * Calculates the straight-line distance between two GPS coordinates in meters
 * using the Haversine formula.
 *
 * @param {number} userLat - User's current latitude
 * @param {number} userLng - User's current longitude
 * @param {number} targetLat - Target point's latitude
 * @param {number} targetLng - Target point's longitude
 * @returns {number} Distance in meters
 */
export function calculateDistance(userLat, userLng, targetLat, targetLng) {
  const EARTH_RADIUS_METERS = 6371000; // Average radius of Earth in meters

  // Helper function to convert degrees to radians
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(targetLat - userLat);
  const dLng = toRadians(targetLng - userLng);

  const lat1Rad = toRadians(userLat);
  const lat2Rad = toRadians(targetLat);

  // Haversine formula core math
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in meters
  return EARTH_RADIUS_METERS * c;
}

/**
 * Checks if the user is within a specified radius (in meters) of a target point.
 *
 * @param {number} userLat - User's current latitude
 * @param {number} userLng - User's current longitude
 * @param {number} targetLat - Target point's latitude
 * @param {number} targetLng - Target point's longitude
 * @param {number} radiusMeters - Maximum allowed radius in meters
 * @returns {boolean} True if distance is <= radiusMeters, false otherwise
 */
export function isWithinRadius(
  userLat,
  userLng,
  targetLat,
  targetLng,
  radiusMeters
) {
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng);
  return distance <= radiusMeters;
}
