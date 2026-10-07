// src/services/progressService.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export async function getUserProgress(userId, destinationId) {
  const progressRef = doc(db, "users", userId, "progress", destinationId);
  const snap = await getDoc(progressRef);
  if (!snap.exists()) {
    return { totalPoints: 0, unlockedPoints: [] };
  }
  return snap.data();
}
