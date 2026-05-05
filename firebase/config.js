import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDjkqvg7OkS-rbpP-SG5Mt4eq_jTJsdRxY",
  authDomain: "project-gia-v2.firebaseapp.com",
  projectId: "project-gia-v2",
  storageBucket: "project-gia-v2.firebasestorage.app",
  messagingSenderId: "485721554493",
  appId: "1:485721554493:web:3725b26f5b08f8d3b33454",
  measurementId: "G-QHG7C1W4KL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to handle connection issues
export const db = getFirestore(app);

// Enable offline persistence and configure settings
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Enable offline persistence (helps with connection issues)
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Multiple tabs open, persistence only enabled in one tab');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Browser doesn\'t support offline persistence');
    }
  });
} catch (err) {
  console.warn('⚠️ Persistence setup error:', err);
}

// Initialize Auth
export const auth = getAuth(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;