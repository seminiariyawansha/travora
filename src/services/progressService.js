// src/services/progressService.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { getPendingSync } from "../db/syncQueue";
import { db } from "./firebaseConfig";

export async function getUserProgress(userId, destinationId) {
  if (!userId || !destinationId) {
    return { totalPoints: 0, unlockedPoints: [] };
  }
  try {
    const progressRef = doc(db, "users", userId, "progress", destinationId);
    const snap = await getDoc(progressRef);
    if (!snap.exists()) {
      return { totalPoints: 0, unlockedPoints: [] };
    }
    return snap.data();
  } catch (error) {
    console.log("getUserProgress error:", error.message);
    return { totalPoints: 0, unlockedPoints: [] };
  }
}

/**
 * Aggregates complete tourist statistics across all destinations,
 * including synced Firebase progress and local pending SQLite unlocks.
 */
export async function getUserOverallStats(userId) {
  if (!userId) {
    return { totalPoints: 0, destinationsVisited: 0, pointsUnlocked: 0 };
  }

  let totalPoints = 0;
  const visitedDestinations = new Set();
  const unlockedPointIds = new Set();

  // 1. Fetch all destination progress docs from Firestore
  try {
    const progressColRef = collection(db, "users", userId, "progress");
    const snap = await getDocs(progressColRef);
    snap.docs.forEach((d) => {
      const data = d.data() || {};
      const pts = Number(data.totalPoints || 0);
      const pointsList = Array.isArray(data.unlockedPoints)
        ? data.unlockedPoints
        : [];
      totalPoints += pts;
      if (pointsList.length > 0) {
        visitedDestinations.add(d.id);
        pointsList.forEach((id) => unlockedPointIds.add(id));
      }
    });
  } catch (err) {
    console.log("Error fetching user progress subcollection:", err.message);
  }

  // 2. Add in any local pending unlocks from SQLite that haven't synced yet
  try {
    const pending = await getPendingSync();
    (pending || [])
      .filter((item) => item.userId === userId)
      .forEach((item) => {
        if (!unlockedPointIds.has(item.pointId)) {
          unlockedPointIds.add(item.pointId);
          visitedDestinations.add(item.destinationId);
          totalPoints += Number(item.pointsEarned || 0);
        }
      });
  } catch (err) {
    console.log("Error checking pending sync queue:", err.message);
  }

  // 3. Check the root user document for any existing totals
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const uData = userSnap.data() || {};
      const docTotal = Number(uData.totalPoints || 0);
      const docUnlocked = Number(uData.pointsUnlocked || 0);
      const docDests = Number(uData.destinationsVisited || 0);

      // Keep maximums so nothing is lost
      totalPoints = Math.max(totalPoints, docTotal);
      const finalPointsUnlocked = Math.max(unlockedPointIds.size, docUnlocked);
      const finalDestinationsVisited = Math.max(
        visitedDestinations.size,
        docDests
      );

      // Back-sync the aggregated totals to the root user profile if they changed
      if (
        totalPoints !== docTotal ||
        finalPointsUnlocked !== docUnlocked ||
        finalDestinationsVisited !== docDests
      ) {
        updateDoc(userRef, {
          totalPoints,
          pointsUnlocked: finalPointsUnlocked,
          destinationsVisited: finalDestinationsVisited,
        }).catch(() => {});
      }

      return {
        totalPoints,
        destinationsVisited: finalDestinationsVisited,
        pointsUnlocked: finalPointsUnlocked,
      };
    }
  } catch (err) {
    console.log("Error checking user root document:", err.message);
  }

  return {
    totalPoints,
    destinationsVisited: visitedDestinations.size,
    pointsUnlocked: unlockedPointIds.size,
  };
}
