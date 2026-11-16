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
        let isNewPoint = false;
        const pointsToAdd = Number(item.pointsEarned || 0);

        if (existing.exists()) {
          const data = existing.data() || {};
          const alreadyUnlocked =
            Array.isArray(data.unlockedPoints) &&
            data.unlockedPoints.includes(item.pointId);

          if (!alreadyUnlocked) {
            isNewPoint = true;
            await updateDoc(progressRef, {
              totalPoints: increment(pointsToAdd),
              unlockedPoints: arrayUnion(item.pointId),
            });
          }
        } else {
          isNewPoint = true;
          await setDoc(progressRef, {
            totalPoints: pointsToAdd,
            unlockedPoints: [item.pointId],
          });
        }

        // Also update the root user document so profile stats stay in sync
        if (isNewPoint && item.userId) {
          try {
            const userRef = doc(firestoreDb, "users", item.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              await updateDoc(userRef, {
                totalPoints: increment(pointsToAdd),
                pointsUnlocked: increment(1),
              });
            }
          } catch (userErr) {
            console.log("Sync user root doc error:", userErr.message);
          }
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
