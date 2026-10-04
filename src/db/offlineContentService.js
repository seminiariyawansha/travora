// db/offlineContentService.js
import { getDb } from "./database";

export async function getCachedPoints(destinationId) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    "SELECT * FROM cached_points WHERE destinationId = ?",
    [destinationId],
  );
  return rows.map((row) => ({
    ...row,
    indoorFriendly: !!row.indoorFriendly,
    imageLocalPaths: JSON.parse(row.imageLocalPaths || "[]"),
  }));
}

export async function getCachedPointById(pointId) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    "SELECT * FROM cached_points WHERE id = ?",
    [pointId],
  );
  if (!row) return null;
  return {
    ...row,
    indoorFriendly: !!row.indoorFriendly,
    imageLocalPaths: JSON.parse(row.imageLocalPaths || "[]"),
  };
}
