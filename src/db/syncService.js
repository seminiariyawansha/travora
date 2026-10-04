// db/syncService.js
import {
    arrayUnion,
    doc,
    getDoc,
    getFirestore,
    increment,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { app } from "../services/firebaseConfig";
import { getPendingSync, markSynced } from "./syncQueue";

const firestoreDb = getFirestore(app);

export async function syncPendingProgress() {
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
        await updateDoc(progressRef, {
          totalPoints: increment(item.pointsEarned),
          unlockedPoints: arrayUnion(item.pointId),
        });
      } else {
        await setDoc(progressRef, {
          totalPoints: item.pointsEarned,
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
}
