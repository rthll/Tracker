import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import { pinia }             from "./stores/pinia.js";
import { useAuthStore }      from "./stores/auth.js";
import { useTrackerStore }   from "./stores/tracker.js";
import { useFoodStore }      from "./stores/food.js";
import { useUIStore }        from "./stores/ui.js";
import { api, setTokenProvider } from "./composables/api.js";

const authStore    = useAuthStore();
const trackerStore = useTrackerStore();
const foodStore    = useFoodStore();
const uiStore      = useUIStore();

window._pinia  = pinia;
window._stores = { auth: authStore, tracker: trackerStore, food: foodStore, ui: uiStore };

// ─── Firebase ────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || "AIzaSyAr_LBQJeiXCwu_FGfv5lCQMmk52VPWviE",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || "trackermacro-5756a.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || "trackermacro-5756a",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || "trackermacro-5756a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "836219469227",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || "1:836219469227:web:c4dd39c07984208fcf26ee",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID      || "G-JZZWTCZ25V",
};

const firebaseApp      = initializeApp(firebaseConfig);
const auth             = getAuth(firebaseApp);
const persistenceReady = setPersistence(auth, browserLocalPersistence);

// Wire the API token provider
setTokenProvider(async () => {
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
});

// ─── TrackerAuth (used by AuthModal.vue) ─────────────────────────────────────

window.TrackerAuth = {
  async login(email, password) {
    await persistenceReady;
    return signInWithEmailAndPassword(auth, email, password);
  },
  async resetPassword(email) {
    await persistenceReady;
    return sendPasswordResetEmail(auth, email);
  },
  logout()          { return signOut(auth); },
  onChange(cb)      { return onAuthStateChanged(auth, cb); },
  getCurrentUser()  { return auth.currentUser; },
};

// ─── Auth state → store init ─────────────────────────────────────────────────

// Load TACO data immediately (before auth resolves)
foodStore.loadTacoData(window.TACO_ALIMENTOS);

onAuthStateChanged(auth, async (user) => {
  authStore.user    = user;
  authStore.isReady = true;

  if (!user) {
    trackerStore.resetarDadosUsuario();
    return;
  }

  uiStore.setAuthStatus("Carregando seus dados...");

  try {
    const dadosRemotos = await api.getTrackerState();
    trackerStore.init(dadosRemotos, user.uid);
  } catch (e) {
    console.warn("Could not load remote data, falling back to local:", e);
    trackerStore.init(null, user.uid);
  }

  uiStore.setAuthStatus("");
});

window.TrackerFirebaseReady = persistenceReady;
