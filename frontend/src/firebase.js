import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAr_LBQJeiXCwu_FGfv5lCQMmk52VPWviE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "trackermacro-5756a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "trackermacro-5756a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "trackermacro-5756a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "836219469227",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:836219469227:web:c4dd39c07984208fcf26ee",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JZZWTCZ25V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const persistenceReady = setPersistence(auth, browserLocalPersistence);

window.TrackerAuth = {
  async login(email, password) {
    await persistenceReady;
    return signInWithEmailAndPassword(auth, email, password);
  },

  async register(email, password) {
    await persistenceReady;
    return createUserWithEmailAndPassword(auth, email, password);
  },

  logout() {
    return signOut(auth);
  },

  onChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser() {
    return auth.currentUser;
  }
};

if (window.Api && typeof window.Api.setTokenProvider === "function") {
  window.Api.setTokenProvider(async () => {
    const user = auth.currentUser;
    return user ? user.getIdToken() : null;
  });
}

window.TrackerDataService = {
  async loadUserData() {
    return window.Api.getTrackerState();
  },

  async saveUserData(userId, data) {
    await window.Api.saveTrackerState(data);
  },

  async applyIncrementalChange(userId, change, fullData) {
    await window.Api.applyTrackerChange(change, fullData);
  }
};

window.TrackerFirebaseReady = persistenceReady;
