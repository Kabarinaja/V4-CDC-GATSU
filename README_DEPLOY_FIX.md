# MY CDC GATSU — Firebase/Vercel Fix

## Perbaikan utama
- Memperbaiki Firebase Web API key di `.env`, `.env.example`, dan `src/lib/firebase.ts` agar sama persis dengan konfigurasi yang diberikan.
- Menambahkan `firebase.json` sehingga rules dan composite indexes bisa dideploy langsung dengan Firebase CLI.
- `firestore.rules` dan `firestore.indexes.json` tetap disertakan.

## Deploy Firestore dari Termux
```bash
npm install
npm install -g firebase-tools
firebase login
firebase use mycdc-7035a
firebase deploy --only firestore
```

Jika project belum terdaftar di `.firebaserc`, gunakan:
```bash
firebase use --add
# pilih project: mycdc-7035a
```

## Deploy website
```bash
npm install
npm run build
npx vercel --prod
```

Untuk Vercel, pastikan Environment Variables menggunakan nilai yang sama dengan `.env`, terutama `VITE_FIREBASE_API_KEY`.
