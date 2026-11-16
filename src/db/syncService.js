// db/syncService.js
import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db as firestoreDb } from "../services/firebaseConfig";
import { subscribeToConnectivity } from "./networkService";
import { getPendingSync, markSynced } from "./syncQueue";

let isSyncing = false;

export async function syncPendingProgress() {
  if (isSyncing) return 0;
  isSyncing = true;

  try {
    const pendingItems = await getPendingSync();
    let syncedCount = 0;

    for (const item of pendingItems) {
      try {
        const progressRef = doc(
          firestoreDb,
          "users",
          item.userId,
          "progress",
          item.destinationId,
        );

        const existing = await getDoc(progressRef);

        if (existing.exists()) {
          const data = existing.data() || {};
          const alreadyUnlocked =
            Array.isArray(data.unlockedPoints) &&
            data.unlockedPoints.includes(item.pointId);

          await updateDoc(progressRef, {
            totalPoints: alreadyUnlocked
              ? (data.totalPoints || 0)
              : increment(Number(item.pointsEarned || 0)),
            unlockedPoints: arrayUnion(item.pointId),
          });
        } else {
          await setDoc(progressRef, {
            totalPoints: Number(item.pointsEarned || 0),
            unlockedPoints: [item.pointId],
          });
        }

        await markSynced(item.id);
        syncedCount++;
      } catch (e) {
        console.log("Sync failed for item", item.id, e);
      }
    }

    return syncedCount;
  } finally {
    isSyncing = false;
  }
}

let autoSyncUnsubscribe = null;

export function startAutoSync() {
  if (autoSyncUnsubscribe) return autoSyncUnsubscribe;

  autoSyncUnsubscribe = subscribeToConnectivity(async (isOnline) => {
    if (isOnline) {
      try {
        await syncPendingProgress();
      } catch (err) {
        console.log("Auto-sync error on reconnect:", err);
      }
    }
  });

  return autoSyncUnsubscribe;
}
