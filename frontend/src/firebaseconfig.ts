import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnNYZ-4L3m7wEWbxjp4W6aA6ED-2jMVHc",
  authDomain: "carinsurance-1c5f6.firebaseapp.com",
  databaseURL: "https://carinsurance-1c5f6-default-rtdb.firebaseio.com",
  projectId: "carinsurance-1c5f6",
  storageBucket: "carinsurance-1c5f6.firebasestorage.app",
  messagingSenderId: "250044602568",
  appId: "1:250044602568:web:af269e919f0239548fadfd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore reference
export const db = getFirestore(app);
