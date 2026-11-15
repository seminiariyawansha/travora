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

// "Galle Fort" -> "galle-fort" (use sep "_" for points, e.g. "ancient_story_point")
export function makeId(name, sep = "-") {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, sep)
    .replace(new RegExp(`^${sep}+|${sep}+$`, "g"), "");
}

function duplicateError(message) {
  const err = new Error(message);
  err.code = "admin/duplicate";
  return err;
}

// ---------- Destinations ----------

// data = { name, location, description, latitude, longitude, story, video, images }
// Pass id to edit, or omit it to create.
export async function saveDestination(data, id) {
  const destId = id || makeId(data.name);
  if (!destId) throw new Error("Invalid destination name");

  const ref = doc(db, "destinations", destId);
  if (!id) {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw duplicateError("A destination with this name already exists.");
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

// ---------- Points ----------

// Every point from every destination, each with destinationId and destinationName.
export async function getAllPoints() {
  const destSnap = await getDocs(collection(db, "destinations"));
  const result = [];
  for (const d of destSnap.docs) {
    const pointsSnap = await getDocs(collection(db, "destinations", d.id, "points"));
    pointsSnap.docs.forEach((p) => {
      result.push({
        id: p.id,
        destinationId: d.id,
        destinationName: d.data().name ?? d.id,
        ...p.data(),
      });
    });
  }
  return result;
}

// data = { name, latitude, longitude, radiusMeters, pointsValue, indoorFriendly }
// Pass id to edit, or omit it to create. Existing "content" is kept.
export async function savePoint(destinationId, data, id) {
  const pointId = id || makeId(data.name, "_");
  if (!pointId) throw new Error("Invalid point name");

  const ref = doc(db, "destinations", destinationId, "points", pointId);
  if (!id) {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw duplicateError("A point with this name already exists here.");
    }
  }

  await setDoc(ref, data, { merge: true });
  return pointId;
}

export async function deletePoint(destinationId, pointId) {
  await deleteDoc(doc(db, "destinations", destinationId, "points", pointId));
}

// ---------- Content (stored inside the point's "content" map) ----------

// content = { storyText, images, videoUrl, audioUrl, quiz }
export async function saveContent(destinationId, pointId, content) {
  const ref = doc(db, "destinations", destinationId, "points", pointId);
  await setDoc(ref, { content }, { merge: true });
}