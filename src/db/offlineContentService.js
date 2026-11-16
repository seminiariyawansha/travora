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

export async function getCachedDestinations() {
  const db = await getDb();
  const rows = await db.getAllAsync("SELECT * FROM cached_destinations");
  return rows || [];
}

export async function getCachedDestinationById(id) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    "SELECT * FROM cached_destinations WHERE id = ?",
    [id],
  );
  return row || null;
}

/** Returns a list of unique destinations that have cached points */
export async function getAllCachedDestinations() {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync(
      `SELECT destinationId as id,
              destinationId as name,
              COUNT(*) as pointCount
       FROM cached_points
       GROUP BY destinationId`,
      [],
    );
    return (rows || []).map((r) => ({
      id: r.id,
      name: r.name
        ? r.name.charAt(0).toUpperCase() + r.name.slice(1)
        : r.id,
      pointCount: r.pointCount,
      sizeBytes: null,
      downloadedAt: null,
    }));
  } catch {
    return [];
  }
}

/** Deletes all cached points for a destination */
export async function deleteCachedDestination(destinationId) {
  try {
    const db = await getDb();
    await db.runAsync(
      "DELETE FROM cached_points WHERE destinationId = ?",
      [destinationId],
    );
  } catch {
    // ignore
  }
}

/** Returns approximate size of all cached data in bytes (rough estimate) */
export async function getCacheSize() {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync(
      `SELECT SUM(LENGTH(storyText) + LENGTH(COALESCE(imageLocalPaths,'')) + 100) as total
       FROM cached_points`,
      [],
    );
    return row?.total ?? 0;
  } catch {
    return 0;
  }
}
