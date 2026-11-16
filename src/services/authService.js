// src/services/authService.js
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { uploadToCloudinary } from "./cloudinaryService";
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

// Firebase requires a recent login before changing email or password —
// this proves the user still knows their current password.
export async function reauthenticate(currentPassword) {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
}

export async function uploadAvatar(uid, localUri) {
  return await uploadToCloudinary(localUri, "image");
}

export async function updateUserAvatar(photoURL) {
  const user = auth.currentUser;
  await updateProfile(user, { photoURL });
  // setDoc + merge: true updates the doc if it exists, or creates it if it
  // doesn't — avoids "No document to update" for accounts whose Firestore
  // profile document is missing or was created outside registerUser().
  await setDoc(doc(db, "users", user.uid), { photoURL }, { merge: true });
}

export async function updateUserName(name) {
  const user = auth.currentUser;
  await updateProfile(user, { displayName: name });
  await setDoc(doc(db, "users", user.uid), { name }, { merge: true });
}

export async function updateUserEmail(newEmail, currentPassword) {
  await reauthenticate(currentPassword);
  await updateEmail(auth.currentUser, newEmail);
  await setDoc(
    doc(db, "users", auth.currentUser.uid),
    { email: newEmail },
    { merge: true },
  );
}

export async function updateUserPassword(newPassword, currentPassword) {
  await reauthenticate(currentPassword);
  await updatePassword(auth.currentUser, newPassword);
}
