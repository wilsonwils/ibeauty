// src/firebase.js

// Import core Firebase functions
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Import Auth + Providers
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider 
} from "firebase/auth";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDcKShIG7Gt6mAZZcY6enfRxc8VvfS70X4",
  authDomain: "ibeauty-ceffd.firebaseapp.com",
  projectId: "ibeauty-ceffd",
  storageBucket: "ibeauty-ceffd.firebasestorage.app",
  messagingSenderId: "495053976500",
  appId: "1:495053976500:web:4bcb352e3243c6827f38e1",
  measurementId: "G-DK0DF1NFC7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// Initialize Auth
export const auth = getAuth(app);

// Google Login Provider
export const googleProvider = new GoogleAuthProvider();

// Apple Login Provider
export const appleProvider = new OAuthProvider("apple.com");
