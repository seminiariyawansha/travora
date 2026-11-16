// db/offlineContentService.js
import { getDb } from "./database";
import { startAutoSync } from "./syncService";

// Start background auto-sync so queued offline unlocks sync when internet is available
try {
  startAutoSync();
} catch (e) {
  // Ignore sync setup error if offline during initialization
}

function formatCachedPoint(row) {
  if (!row) return null;
  let parsedImages = [];
  try {
    parsedImages = JSON.parse(row.imageLocalPaths || "[]");
    if (!Array.isArray(parsedImages)) parsedImages = [];
  } catch {
    parsedImages = [];
  }

  return {
    ...row,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    radiusMeters: row.radiusMeters != null ? Number(row.radiusMeters) : null,
    pointsValue: Number(row.pointsValue || 0),
    indoorFriendly: !!row.indoorFriendly,
    imageLocalPaths: parsedImages,
  };
}

export async function getCachedPoints(destinationId) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    "SELECT * FROM cached_points WHERE destinationId = ?",
    [destinationId],
  );
  return (rows || []).map(formatCachedPoint);
}

export async function getCachedPointById(pointId) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    "SELECT * FROM cached_points WHERE id = ?",
    [pointId],
  );
  return formatCachedPoint(row);
}
