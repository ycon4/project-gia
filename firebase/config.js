import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBgi9HPxp0XFWUZc8Yb_PO29U0okWnsQ0M",
  authDomain: "project-gia-2159a.firebaseapp.com",
  projectId: "project-gia-2159a",
  storageBucket: "project-gia-2159a.firebasestorage.app",
  messagingSenderId: "176814540343",
  appId: "1:176814540343:web:c51e20b0231ab1f95721b2",
  measurementId: "G-JPJ9W2ZSYR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;