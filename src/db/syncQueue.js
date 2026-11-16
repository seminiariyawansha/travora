// db/syncQueue.js
import { getDb } from "./database";

export async function addPendingSync({
  userId,
  destinationId,
  pointId,
  actionType = "unlock",
  pointsEarned = 0,
}) {
  if (!userId || !destinationId || !pointId) {
    console.warn("addPendingSync: missing required fields", {
      userId,
      destinationId,
      pointId,
    });
    return;
  }

  const db = await getDb();

  // Dedup: skip if an unsynced row already exists for this exact unlock
  const existing = await db.getFirstAsync(
    `SELECT id FROM pending_sync
     WHERE userId = ? AND destinationId = ? AND pointId = ? AND actionType = ? AND synced = 0`,
    [userId, destinationId, pointId, actionType],
  );
  if (existing) {
    console.log(`addPendingSync: duplicate skipped for point ${pointId}`);
    return;
  }

  await db.runAsync(
    `INSERT INTO pending_sync (userId, destinationId, pointId, actionType, pointsEarned, createdAt, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [
      userId,
      destinationId,
      pointId,
      actionType,
      Number(pointsEarned || 0),
      new Date().toISOString(),
    ],
  );
}

export async function getPendingSync() {
  const db = await getDb();
  const rows = await db.getAllAsync(
    "SELECT * FROM pending_sync WHERE synced = 0",
  );
  return rows || [];
}

export async function markSynced(id) {
  const db = await getDb();
  await db.runAsync("UPDATE pending_sync SET synced = 1 WHERE id = ?", [id]);
}
