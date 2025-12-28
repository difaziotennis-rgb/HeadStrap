import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebase configuration
// You'll need to add your Firebase config here
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase - handle missing config gracefully during build
let app: FirebaseApp | null = null;

try {
  if (getApps().length === 0) {
    // Only initialize if we have the required config and we're not in build phase
    if (firebaseConfig.apiKey && firebaseConfig.projectId && typeof window !== 'undefined') {
      app = initializeApp(firebaseConfig);
    } else if (firebaseConfig.apiKey && firebaseConfig.projectId && process.env.NEXT_PHASE !== 'phase-production-build') {
      app = initializeApp(firebaseConfig);
    }
  } else {
    app = getApps()[0];
  }
} catch (error) {
  // Silently fail during build if config is missing
  console.warn('Firebase initialization skipped:', error);
}

// Initialize services only if app exists
export const auth: Auth = app ? getAuth(app) : ({} as Auth);
export const db: Firestore = app ? getFirestore(app) : ({} as Firestore);

export default app;









