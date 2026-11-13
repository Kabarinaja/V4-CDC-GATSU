import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

export const GATSU_FIREBASE_APP_NAME = 'gatsu-wewarah';

export const GATSU_ADMIN_UID =
  import.meta.env.VITE_GATSU_ADMIN_UID || '01JRBdGkOdRn8TrjTlJf7WsvWsk1';

export const GATSU_ADMIN_EMAIL =
  import.meta.env.VITE_GATSU_ADMIN_EMAIL || 'logisshope@gmail.com';

export const gatsuFirebaseConfig = {
  apiKey:
    import.meta.env.VITE_GATSU_FIREBASE_API_KEY ||
    'AIzaSyB6i-n3C3rVzVKZiTQ4Kx9Y5vEIqu9Dhs4',
  authDomain:
    import.meta.env.VITE_GATSU_FIREBASE_AUTH_DOMAIN ||
    'celupnewsxxxncom.firebaseapp.com',
  projectId:
    import.meta.env.VITE_GATSU_FIREBASE_PROJECT_ID || 'celupnewsxxxncom',
  storageBucket:
    import.meta.env.VITE_GATSU_FIREBASE_STORAGE_BUCKET ||
    'celupnewsxxxncom.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_GATSU_FIREBASE_MESSAGING_SENDER_ID || '910944830238',
  appId:
    import.meta.env.VITE_GATSU_FIREBASE_APP_ID ||
    '1:910944830238:web:0f2ead25e779b50d9d3f0f',
};

const existingApp = getApps().find((app) => app.name === GATSU_FIREBASE_APP_NAME);

export const gatsuFirebaseApp: FirebaseApp = existingApp
  ? getApp(GATSU_FIREBASE_APP_NAME)
  : initializeApp(gatsuFirebaseConfig, GATSU_FIREBASE_APP_NAME);

export const gatsuAuth: Auth = getAuth(gatsuFirebaseApp);
export const gatsuDb: Firestore = getFirestore(gatsuFirebaseApp);
