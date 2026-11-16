// src/location/geofenceService.js

// Calculates the distance in meters between two GPS coordinates
// using the Haversine formula (accounts for the earth's curve).
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in meters
}

// Returns true if the current location is inside the point's geofence
export function isWithinGeofence(currentLocation, point) {
  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    point.latitude,
    point.longitude
  );
  return distance <= point.radiusMeters;
}
