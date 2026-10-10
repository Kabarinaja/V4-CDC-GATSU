# PANDUAN SETUP FIREBASE CONSOLE — MY CDC GATSU

Panduan langkah demi langkah untuk mengaktifkan fitur-fitur baru pada project Firebase `mycdc-7035a`.

---

## 1. Aktifkan Google Sign-In Provider

1. Buka [Firebase Console](https://console.firebase.google.com/) dan pilih project **mycdc-7035a**.
2. Masuk ke menu **Build** > **Authentication** > tab **Sign-in method**.
3. Klik tombol **Add new provider**, lalu pilih **Google**.
4. Aktifkan toggle **Enable**.
5. Pilih **Project support email** (misal `kabarinaja.info@gmail.com`).
6. Klik **Save**.

---

## 2. Tambahkan Authorized Domains

Di halaman yang sama (**Authentication** > **Settings** > **Authorized domains**):
Pastikan domain berikut terdaftar:
- `localhost`
- `dicelupayamcrispy.store`
- `www.dicelupayamcrispy.store`
- Domain preview AI Studio Cloud Run (misal `*.run.app`)

---

## 3. Deploy Firestore Security Rules & Indexes

Jalankan perintah berikut untuk memperbarui rules agar mendukung koleksi `pos_transactions` dan `calls`:

```bash
firebase use mycdc-7035a
firebase deploy --only firestore
```

Atau jika hanya rules:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Konfigurasi Cloudinary (Sudah Aktif)

Cloudinary telah terkonfigurasi dengan preset yang ada:
- **Cloud Name**: `fa7ua9nq`
- **Upload Preset**: `mycdcgatsu`
- **Folder**: `payment-proofs`, `promotions`, `chat-attachments`
