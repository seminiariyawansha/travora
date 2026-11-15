// src/services/unlockService.js
import { addPendingSync } from "../db/syncQueue";
import { checkGeofence } from "./geofenceService";

// Track points successfully unlocked during the current session using "${destinationId}:${pointId}"
const sessionUnlockedPoints = new Set();

// Track points currently in the process of being unlocked (prevents concurrent race conditions)
const inFlightUnlocks = new Set();

/**
 * Checks for locked points near the user's location and unlocks them.
 * Records each unlock in the SQLite pending_sync queue for Firebase sync.
 *
 * @param {object} userLocation - { latitude, longitude }
 * @param {Array} points - Array of point objects
 * @param {string} userId - Logged in user's ID
 * @param {string} destinationId - Current destination ID (e.g. "sigiriya")
 * @returns {Promise<Array>} Array of points that were newly & successfully unlocked
 */
export async function unlockNearbyPoints(
  userLocation,
  points,
  userId,
  destinationId
) {
  if (!userLocation || !Array.isArray(points) || !userId || !destinationId) {
    return [];
  }

  // 1. Find all locked points inside their geofence radius
  const eligiblePoints = checkGeofence(userLocation, points);

  const newlyUnlockedPoints = [];

  for (const point of eligiblePoints) {
    // Unique key combining destination and point ID
    const uniqueKey = `${destinationId}:${point.id}`;

    // 2. Skip if point is already unlocked, cached in session, or currently being unlocked in another async call
    if (
      point.unlocked ||
      sessionUnlockedPoints.has(uniqueKey) ||
      inFlightUnlocks.has(uniqueKey)
    ) {
      continue;
    }

    // Mark key as in-flight BEFORE starting the async database call
    inFlightUnlocks.add(uniqueKey);

    try {
      // 3. Log to SQLite sync queue BEFORE declaring point unlocked
      await addPendingSync({
        userId,
        destinationId,
        pointId: point.id,
        actionType: "UNLOCK_POINT",
        pointsEarned: point.pointsValue || 0,
      });

      // 4. Mark point as unlocked only AFTER addPendingSync succeeds
      point.unlocked = true;
      sessionUnlockedPoints.add(uniqueKey);

      newlyUnlockedPoints.push(point);
    } catch (error) {
      // If saving to sync queue fails, log error and skip marking as unlocked
      console.error(
        `Failed to add pending sync for point ${point.id}:`,
        error
      );
    } finally {
      // Always clear the key from in-flight set when processing completes
      inFlightUnlocks.delete(uniqueKey);
    }
  }

  return newlyUnlockedPoints;
}

/**
 * Resets the in-memory session unlock cache (useful on logout or test reset).
 */
export function resetSessionUnlockedPoints() {
  sessionUnlockedPoints.clear();
  inFlightUnlocks.clear();
}
