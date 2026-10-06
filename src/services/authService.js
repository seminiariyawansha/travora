// src/services/authService.js
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export async function registerUser(name, email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password);

  // Save the display name on the Auth account itself
  await updateProfile(result.user, { displayName: name });

  // Create their profile document in Firestore — this is the "database
  // connected" part: total points, badges, etc. all live here from day one.
  await setDoc(doc(db, "users", result.user.uid), {
    name,
    email,
    totalPoints: 0,
    destinationsVisited: 0,
    pointsUnlocked: 0,
    badges: [],
    createdAt: new Date().toISOString(),
  });

  return result.user;
}

export async function loginUser(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data();
}
