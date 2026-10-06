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
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "./firebaseConfig";

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
  const response = await fetch(localUri);
  const blob = await response.blob();
  const avatarRef = ref(storage, `users/${uid}/avatar.jpg`);
  await uploadBytes(avatarRef, blob);
  return await getDownloadURL(avatarRef);
}

export async function updateUserAvatar(photoURL) {
  const user = auth.currentUser;
  await updateProfile(user, { photoURL });
  await updateDoc(doc(db, "users", user.uid), { photoURL });
}

export async function updateUserName(name) {
  const user = auth.currentUser;
  await updateProfile(user, { displayName: name });
  await updateDoc(doc(db, "users", user.uid), { name });
}

export async function updateUserEmail(newEmail, currentPassword) {
  await reauthenticate(currentPassword);
  await updateEmail(auth.currentUser, newEmail);
  await updateDoc(doc(db, "users", auth.currentUser.uid), { email: newEmail });
}

export async function updateUserPassword(newPassword, currentPassword) {
  await reauthenticate(currentPassword);
  await updatePassword(auth.currentUser, newPassword);
}
