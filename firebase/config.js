import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAMXcFJ5lTM7nrjmU7rHRJn5Ui35kLjCI4",
  authDomain: "project-gia-v3.firebaseapp.com",
  projectId: "project-gia-v3",
  storageBucket: "project-gia-v3.firebasestorage.app",
  messagingSenderId: "116407887554",
  appId: "1:116407887554:web:99aa3bb296e0dc3b8fbd5b",
  measurementId: "G-DSJXSFCWKC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize a secondary app for creating users without logging out the admin
const secondaryApp = initializeApp(firebaseConfig, 'Secondary');

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

// Initialize Auth (primary for admin)
export const auth = getAuth(app);

// Initialize secondary Auth (for creating users without logging out admin)
export const secondaryAuth = getAuth(secondaryApp);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;