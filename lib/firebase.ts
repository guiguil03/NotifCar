// Import the functions you need from the SDKs you need
import { Analytics, getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getMessaging, Messaging } from "firebase/messaging";
import { Platform } from 'react-native';

// Vérifier si nous sommes dans un environnement qui supporte Firebase web
const isWebSupported = () => {
  if (Platform.OS !== 'web') return false;
  
  // Vérifier si nous sommes dans un vrai navigateur (pas Expo web dev)
  if (typeof window === 'undefined') return false;
  
  // Vérifier les APIs requises
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasNotification = 'Notification' in window;
  const hasPushManager = 'PushManager' in window;
  
  return hasServiceWorker && hasNotification && hasPushManager;
};

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3V3u5S4pICnfwTwyo6OxWKmAh-n0U3Uo",
  authDomain: "notifcar-4115c.firebaseapp.com",
  projectId: "notifcar-4115c",
  storageBucket: "notifcar-4115c.firebasestorage.app",
  messagingSenderId: "960249373749",
  appId: "1:960249373749:web:d11e7372df0362d7853d7c",
  measurementId: "G-BDPH26KK2N"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Analytics (only on supported web environments)
export let analytics: Analytics | null = null;
if (isWebSupported()) {
  try {
    analytics = getAnalytics(app);
    console.log('✅ Firebase Analytics initialisé sur web');
  } catch (error) {
    console.warn('⚠️ Firebase Analytics non disponible:', error.message);
    analytics = null;
  }
} else if (Platform.OS === 'web') {
  console.log('ℹ️ Firebase Analytics: En attente d\'un environnement web complet (non-dev)');
}

// Initialize Cloud Messaging (only on supported web environments)
export let messaging: Messaging | null = null;
if (isWebSupported()) {
  try {
    messaging = getMessaging(app);
    console.log('✅ Firebase Messaging initialisé sur web');
  } catch (error) {
    console.warn('⚠️ Firebase Messaging non disponible:', error.message);
    messaging = null;
  }
} else if (Platform.OS === 'web') {
  console.log('ℹ️ Firebase Messaging: En attente d\'un environnement web complet (non-dev)');
}

export default app;
