import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { initializeAuth, getAuth, Auth, Persistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// firebase's package.json "exports" map only conditions the JS entry point on
// "react-native" (resolved correctly by Metro at runtime); its TypeScript
// types are unconditioned and point at the web build, which doesn't declare
// getReactNativePersistence. Pull it off the namespace import at runtime
// instead of the named export so this still type-checks. See
// https://github.com/firebase/firebase-js-sdk/issues/7584
const getReactNativePersistence = (
  firebaseAuth as unknown as { getReactNativePersistence: (storage: unknown) => Persistence }
).getReactNativePersistence;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth throws if it was already called for this app (e.g. Fast Refresh) —
    // fall back to the existing instance instead of losing it.
    auth = getAuth(app);
  }
  db = getFirestore(app);
}

export function getFirebaseAuth(): Auth | null {
  return auth;
}

export function getFirebaseDb(): Firestore | null {
  return db;
}
