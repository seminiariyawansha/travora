// src/services/destinationService.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
} from "firebase/firestore";
import { app } from "./firebaseConfig";

const db = getFirestore(app);

function formatDestination(id, data = {}) {
  const lat = data.latitude != null ? data.latitude : data.lat;
  const lon = data.longitude != null ? data.longitude : (data.lon != null ? data.lon : data.lng);
  const img =
    data.imageUrl ||
    data.image ||
    data.photoUrl ||
    data.photo ||
    (Array.isArray(data.images) && data.images[0] ? data.images[0] : null);

  return {
    id,
    ...data,
    latitude: lat != null ? Number(lat) : null,
    longitude: lon != null ? Number(lon) : null,
    imageUrl: typeof img === "string" ? img : null,
  };
}

// Get all destinations (Home screen)
export const getDestinations = async () => {
  const snapshot = await getDocs(collection(db, "destinations"));
  return snapshot.docs.map((docSnap) => formatDestination(docSnap.id, docSnap.data()));
};

// Keep both names working, since different screens were written
// expecting different names — avoids having to hunt down every usage.
export const getAllDestinations = getDestinations;

// Get one destination's details
export const getDestination = async (destinationId) => {
  const docRef = doc(db, "destinations", destinationId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return formatDestination(docSnap.id, docSnap.data());
};

// Get all points for a destination
export const getPoints = async (destinationId) => {
  const snapshot = await getDocs(
    collection(db, "destinations", destinationId, "points"),
  );
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

// Get one point's full content (story, images, video)
export const getPointContent = async (destinationId, pointId) => {
  const docRef = doc(db, "destinations", destinationId, "points", pointId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data().content; // { storyText, images, videoUrl }
};
