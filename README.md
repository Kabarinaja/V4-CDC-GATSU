# MY CDC GATSU — Full-Stack Member, Ordering & Loyalty Web App

Aplikasi web full-stack modern untuk bisnis kuliner **MY CDC GATSU (Dicelup Ayam Crispy)** dengan sistem member loyalty, online ordering delivery (khusus QRIS), verifikasi bukti transfer kasir, histori ledger poin, chat pelanggan ↔ outlet, manajemen promosi poster Cloudinary, dan dashboard operasional kasir/crew.

- **Domain Utama**: `https://dicelupayamcrispy.store`
- **Kontak WhatsApp**: `082379474173`
- **Lokasi Outlet**: [Google Maps MY CDC GATSU](https://maps.app.goo.gl/pPDPnQA9NaJwpdbn9?g_st=ac&utm_source=chatgpt.com)
- **Primary Admin UID**: `oSR3DIuFx7hmW3OvVmgN6uPYzzr1`
- **Crew Gate Login**: `/admingatsu`

---

## 1. Arsitektur & Teknologi

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Routing**: React Router (Normal URL routes tanpa hash `#`)
- **Backend & Database**: Firebase Authentication + Cloud Firestore (`mycdc-7035a`)
- **Media Storage**: Cloudinary (Unsigned Preset `mycdcgatsu` untuk bukti pembayaran & poster promo)
- **Deploy Target**: Vercel (dengan rewrite SPA di `vercel.json` untuk mencegah 404 saat refresh)

---

## 2. Struktur Proyek

```text
my-cdc-gatsu/
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── OrderBadge.tsx
│   │   ├── home/
│   │   │   └── PromoBanner.tsx
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navbar.tsx
│   │   └── member/
│   │       └── MemberCard.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   └── NotificationContext.tsx
│   ├── lib/
│   │   ├── cloudinary.ts
│   │   ├── firebase.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminChatPage.tsx
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── AdminMembersPage.tsx
│   │   │   ├── AdminOrderDetailPage.tsx
│   │   │   ├── AdminOrdersPage.tsx
│   │   │   ├── AdminPointsPage.tsx
│   │   │   ├── AdminProductsPage.tsx
│   │   │   ├── AdminPromotionsPage.tsx
│   │   │   └── AdminReportsPage.tsx
│   │   ├── AdminEntryPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── MemberPage.tsx
│   │   ├── MenuPage.tsx
│   │   ├── OrderDetailPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── PointsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── RegisterPage.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── .gitignore
├── firebase-blueprint.json
├── firestore.indexes.json
├── firestore.rules
├── package.json
├── tsconfig.json
├── vercel.json
├── vite.config.ts
└── README.md
```

---

## 3. Menjalankan di Lokal / Termux

### Langkah Instalasi:

```bash
# Clone atau masuk ke folder project
cd my-cdc-gatsu

# Install dependensi
npm install

# Buat file .env dari template
cp .env.example .env

# Jalankan development server
npm run dev
```

Aplikasi akan berjalan pada `http://localhost:3000` (atau port yang ditentukan).

### Perintah Build & Preview:

```bash
# Build untuk production
npm run build

# Preview hasil build lokal
npm run preview
```

---

## 4. Git & GitHub Setup (Dari Termux / Terminal)

```bash
git init
git add .
git commit -m "Initial release of MY CDC GATSU web app"
git branch -M main
git remote add origin https://github.com/<USERNAME_GITHUB>/my-cdc-gatsu.git
git push -u origin main
```

> **Catatan Keamanan**: File `.env` sudah masuk ke `.gitignore` sehingga tidak akan bocor ke GitHub.

---

## 5. Konfigurasi Environment Variables di Vercel

Di dashboard Vercel (**Project Settings > Environment Variables**), tambahkan:

| Variable Name | Nilai |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyCVqQd0o8uoEBNXbvHuxMUoOL3i3XWvXYg` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `mycdc-7035a.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `mycdc-7035a` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `mycdc-7035a.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `238383865464` |
| `VITE_FIREBASE_APP_ID` | `1:238383865464:web:0603949bb63e39ae59d78d` |
| `VITE_CLOUDINARY_CLOUD_NAME` | `fa7ua9nq` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `mycdcgatsu` |
| `VITE_ADMIN_UID` | `oSR3DIuFx7hmW3OvVmgN6uPYzzr1` |

Setelah memasukkan variables, lakukan **Redeploy** di Vercel.

---

## 6. Setup Firebase Console (`mycdc-7035a`)

1. Buka [Firebase Console](https://console.firebase.google.com/project/mycdc-7035a).
2. **Authentication**: Pastikan provider **Email/Password** aktif di menu *Authentication > Sign-in method*.
3. **Firestore Database**:
   - Buka tab *Rules*, lalu paste seluruh isi file `firestore.rules` dan klik **Publish**.
   - Buka tab *Indexes*, tambahkan composite indexes sesuai file `firestore.indexes.json` jika diperlukan.
4. **Authorized Domains**:
   - Di *Authentication > Settings > Authorized domains*, tambahkan:
     - `dicelupayamcrispy.store`
     - Domain bawaan Vercel Anda (misal `*.vercel.app`)

---

## 7. Setup Cloudinary

1. Cloud Name: `fa7ua9nq`
2. Masuk ke **Cloudinary Settings > Upload > Upload presets**.
3. Pastikan preset `mycdcgatsu` bertipe **Unsigned**.
4. Folder:
   - `payment-proofs` (otomatis untuk bukti transfer pembayaran)
   - `promotions` (otomatis untuk banner promosi)

---

## 8. Setting Custom Domain `dicelupayamcrispy.store` di Vercel

1. Di Vercel Dashboard, buka **Settings > Domains**.
2. Masukkan domain `dicelupayamcrispy.store`.
3. Atur DNS di penyedia domain Anda:
   - Tipe `A` mengarah ke IP `76.76.21.21`
   - Atau CNAME `cname.vercel-dns.com`
4. Tunggu sertifikat SSL otomatis aktif dari Vercel.

---

## 9. Checklist Pengujian Produksi (Production Verification)

- [x] **Routing Normal**: Tidak ada `#` (hash) di URL; buka langsung `/menu`, `/checkout`, `/admin` lalu refresh browser tidak 404 (ditangani oleh `vercel.json`).
- [x] **Pintu Rahasia Kru**: Tidak ada tombol admin di website publik; pintu masuk kru melalui `/admingatsu`.
- [x] **Otorisasi Admin**: Hanya UID `oSR3DIuFx7hmW3OvVmgN6uPYzzr1` atau role `admin` yang dapat mengakses dashboard `/admin/*`.
- [x] **Keamanan Poin & Role**: Customer tidak dapat memanipulasi role, saldo poin, atau harga melalui client (dilindungi Firestore Security Rules).
- [x] **Katalog Produk Bersih**: Menu Teriyaki & Paket Wings telah dihapus permanen. Hanya 7 produk utama (Sadis, Mentai, Lada Hitam, Keju, Geprek, BBQ, Ori).
- [x] **Pemesanan QRIS**: Checkout menampilkan gambar QRIS yang dikonfigurasi, menghitung ongkir Indramayu Kota (Rp9.000) & Luar Kota (Rp15.000), mengunggah bukti ke Cloudinary, dan status awal `pending_verification`. Validitas QRIS merchant harus dikonfirmasi pemilik outlet.
- [x] **Aturan Poin**: 1 poin = Rp100, minimum redeem 10 poin (Rp1.000), poin redeem dipotong atomik saat pembayaran diverifikasi, dan reward dihitung saat pesanan selesai.
- [x] **Buku Besar Poin (Ledger)**: Setiap mutasi poin (+/-) tercatat detail di `pointTransactions` dengan deskripsi dan order ID.
- [x] **Riwayat Transaksi**: Dokumen transaksi dan riwayat lama dipertahankan. UI pembuatan transaksi POS offline telah dihapus; top up langsung admin tersedia terpisah di `/admin/topups`.
- [x] **Chat Pelanggan & Kru**: Mendukung teks, foto, dan pengiriman titik koordinat GPS ke Google Maps.
- [x] **Promosi**: Admin dapat mengunggah poster promosi via Cloudinary dan tampil di beranda pelanggan.
