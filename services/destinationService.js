// services/destinationService.js

import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";

export async function getAllDestinations() {
  const snapshot = await getDocs(collection(db, "destinations"));

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function getDestination(destinationId) {
  const docRef = doc(db, "destinations", destinationId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data()
  };
}

export async function getPoints(destinationId) {
  const snapshot = await getDocs(
    collection(db, "destinations", destinationId, "points")
  );

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function getPointContent(destinationId, pointId) {
  const docRef = doc(
    db,
    "destinations",
    destinationId,
    "points",
    pointId
  );

  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return docSnap.data().content;
}