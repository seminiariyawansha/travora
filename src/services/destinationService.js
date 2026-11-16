// src/services/destinationService.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
} from "firebase/firestore";
import { normalizePoint } from "../utils/pointType";
import { app } from "./firebaseConfig";

const db = getFirestore(app);

// Get all destinations (Home screen)
export const getDestinations = async () => {
  const snapshot = await getDocs(collection(db, "destinations"));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

// Keep both names working, since different screens expect different names
export const getAllDestinations = getDestinations;

// Get one destination's details
export const getDestination = async (destinationId) => {
  const docRef = doc(db, "destinations", destinationId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
};

// Get all points for a destination.
// Every point comes back with a clean true/false in indoorFriendly,
// even if it was saved under another name or as text.
export const getPoints = async (destinationId) => {
  const snapshot = await getDocs(
    collection(db, "destinations", destinationId, "points"),
  );

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    const point = normalizePoint({ id: docSnap.id, ...data });

    // TEMPORARY: shows how each point was saved. Delete this line once it works.
    console.log(
      "POINT:",
      data.name,
      "-> indoor:",
      point.indoorFriendly,
      "| raw:",
      JSON.stringify(data),
    );

    return point;
  });
};

// Get one point's full content (story, images, video)
export const getPointContent = async (destinationId, pointId) => {
  const docRef = doc(db, "destinations", destinationId, "points", pointId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data().content; // { storyText, images, videoUrl }
};
