// src/services/firebaseConfig.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDwDR6_9rU3fxgHF8dD2uqwdETp6TtV8VQ",
  authDomain: "travora-app-9439c.firebaseapp.com",
  projectId: "travora-app-9439c",
  storageBucket: "travora-app-9439c.firebasestorage.app",
  messagingSenderId: "836447076505",
  appId: "1:836447076505:web:16bd2bb5695133fd0bb808",
  measurementId: "G-7PEL3WSJKR",
};

const app = initializeApp(firebaseConfig);

// initializeAuth + AsyncStorage persistence is required in React Native —
// without this, a logged-in user gets signed out every time the app restarts.
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

