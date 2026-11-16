// src/location/unlockService.js
import { getCachedPoints } from "../db/offlineContentService";
import { addPendingSync } from "../db/syncQueue";
import { auth } from "../services/firebaseConfig";
import { isWithinGeofence, calculateDistance } from "./geofenceService";

// Checks every point in a destination against the current location,
// and unlocks (queues sync for) any newly-reached ones.
export async function checkForUnlocks(destinationId, currentLocation, alreadyUnlockedIds) {
  const points = await getCachedPoints(destinationId);
  const newlyUnlocked = [];

  for (const point of points) {
    if (alreadyUnlockedIds.includes(point.id)) continue;

    if (isWithinGeofence(currentLocation, point)) {
      await addPendingSync({
        userId: auth.currentUser?.uid ?? "guest",
        destinationId,
        pointId: point.id,
        actionType: "unlock",
        pointsEarned: point.pointsValue
      });
      newlyUnlocked.push(point);
    }
  }

  return newlyUnlocked; // the UI shows the celebration screen for each of these
}

// Used by the map/locked-point screens to show live "X m away" text
export async function getDistanceToPoint(currentLocation, point) {
  return calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    point.latitude,
    point.longitude
  );
}
