// src/utils/visitedPoints.js
import { getDb } from "../db/database";
import { getUserProgress } from "../services/progressService";

// Returns a Set of the point IDs this user has visited in a destination.
export async function loadVisitedIds(userId, destinationId) {
  const ids = new Set();
  if (!userId) return ids;

  // 1. Saved progress in Firestore (needs internet)
  try {
    const progress = await getUserProgress(userId, destinationId);
    (progress?.unlockedPoints ?? []).forEach((id) => ids.add(id));
  } catch (error) {
    console.log("Visited: saved progress unavailable:", error.message);
  }

  // 2. Unlocks recorded on this phone. Works offline and includes
  //    unlocks that have already been synced.
  try {
    const db = await getDb();
    const rows = await db.getAllAsync(
      "SELECT pointId FROM pending_sync WHERE actionType = 'unlock' AND destinationId = ? AND userId = ?",
      [destinationId, userId],
    );
    rows.forEach((row) => ids.add(row.pointId));
  } catch (error) {
    console.log("Visited: local unlocks unavailable:", error.message);
  }

  return ids;
}
