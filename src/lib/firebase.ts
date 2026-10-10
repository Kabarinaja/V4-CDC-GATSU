import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCVQqD0o8uoEBNXbvHuxMUoOL3i3XWvXYg",
  authDomain: "mycdc-7035a.firebaseapp.com",
  projectId: "mycdc-7035a",
  storageBucket: "mycdc-7035a.firebasestorage.app",
  messagingSenderId: "238383865464",
  appId: "1:238383865464:web:0603949bb63e39ae59d78d"
};

export const PRIMARY_ADMIN_UID = import.meta.env.VITE_ADMIN_UID || "oSR3DIuFx7hmW3OvVmgN6uPYzzr1";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// Defensive test connection
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Koneksi Firestore offline atau jaringan terputus:", error.message);
    }
  }
})();
