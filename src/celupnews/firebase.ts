import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { NEWS_ADMIN_UID } from "../../celupnews/admin";

const config = {
  apiKey: import.meta.env.VITE_CELUPNEWS_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_CELUPNEWS_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_CELUPNEWS_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_CELUPNEWS_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_CELUPNEWS_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_CELUPNEWS_FIREBASE_APP_ID,
};
if (Object.values(config).some((value) => !value)) {
  console.warn("Konfigurasi Firebase CELUPNEWS belum lengkap. Isi variabel VITE_CELUPNEWS_FIREBASE_*.");
}
const app = getApps().some((item) => item.name === "celupnews")
  ? getApp("celupnews")
  : initializeApp(config, "celupnews");
export const newsAuth = getAuth(app);
export const newsDb = getFirestore(app);
export { NEWS_ADMIN_UID };
