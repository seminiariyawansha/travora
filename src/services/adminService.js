// src/services/adminService.js
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// Turn "Galle Fort" into "galle-fort" (matches ids like "sigiriya").
export function makeId(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------- Destinations ----------

// data = { name, location, description, latitude, longitude, story, video, images }
// Pass id to edit an existing destination, or omit it to create a new one.
export async function saveDestination(data, id) {
  const destId = id || makeId(data.name);
  if (!destId) throw new Error("Invalid destination name");

  const ref = doc(db, "destinations", destId);

  if (!id) {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      const err = new Error("A destination with this name already exists.");
      err.code = "admin/duplicate";
      throw err;
    }
  }

  await setDoc(ref, data, { merge: true });
  return destId;
}

// Deletes the destination and all of its points.
export async function deleteDestination(id) {
  const pointsSnap = await getDocs(collection(db, "destinations", id, "points"));
  for (const p of pointsSnap.docs) {
    await deleteDoc(p.ref);
  }
  await deleteDoc(doc(db, "destinations", id));
}