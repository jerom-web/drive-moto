// firebase/firebase.js
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Firebase config
const firebaseConfig = {
  apiKey: 'AIzaS',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '29',
  appId: '1:290',
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Auth (with fallback for Expo Go)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app); // fallback (e.g., if already initialized or in Expo Go)
}

// ✅ Initialize Firestore
const db = getFirestore(app);

export { auth, db };
