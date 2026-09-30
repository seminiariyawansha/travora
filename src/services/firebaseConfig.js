import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDwDR6_9rU3fxgHF8dD2uqwdETp6TtV8VQ",
  authDomain: "travora-app-9439c.firebaseapp.com",
  projectId: "travora-app-9439c",
  storageBucket: "travora-app-9439c.firebasestorage.app",
  messagingSenderId: "836447076505",
  appId: "1:836447076505:web:16bd2bb5695133fd0bb808",
  measurementId: "G-7PEL3WSJKR"
};

const app = initializeApp(firebaseConfig);

export { app };
