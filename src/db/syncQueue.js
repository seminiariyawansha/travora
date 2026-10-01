// db/syncQueue.js
import { getDb } from "./database";

export async function addPendingSync({
  userId,
  destinationId,
  pointId,
  actionType,
  pointsEarned,
}) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO pending_sync (userId, destinationId, pointId, actionType, pointsEarned, createdAt, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [
      userId,
      destinationId,
      pointId,
      actionType,
      pointsEarned,
      new Date().toISOString(),
    ],
  );
}

export async function getPendingSync() {
  const db = await getDb();
  return await db.getAllAsync("SELECT * FROM pending_sync WHERE synced = 0");
}

export async function markSynced(id) {
  const db = await getDb();
  await db.runAsync("UPDATE pending_sync SET synced = 1 WHERE id = ?", [id]);
}
