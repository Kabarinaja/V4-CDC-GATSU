PATCH HALAMAN PROFIL D'CELUP CHICKEN CRISPY GATSU

Isi patch:
- src/pages/ProfilLogisPage.tsx
- src/pages/ProfilOwnerPage.tsx
- src/App.tsx (dua import dan dua route baru)
- public/sitemap.xml (dua URL profil ditambahkan)
- public/images/gambar-logis.png
- public/images/gambar-owner.jpg

Cara memasang:
1. Buat backup repository sebelum menyalin file.
2. Ekstrak isi ZIP ini ke root repository V4-CDC-GATSU, pertahankan struktur folder, dan izinkan penggantian src/App.tsx serta public/sitemap.xml.
3. Jalankan npm run lint lalu npm run build.
4. Periksa kedua URL setelah deploy:
   https://www.dicelupayamcrispy.store/profil-logis
   https://www.dicelupayamcrispy.store/profil-owner
5. Pastikan domain tanpa www mengarah ke domain utama yang dipilih. Sitemap seluruh halaman menggunakan domain www agar konsisten dengan canonical utama.
6. Kirim kedua URL ke Google Search Console untuk inspeksi dan permintaan pengindeksan.

Catatan:
- Patch hanya menambah dua halaman profil dan metadata terkait; tidak mengubah Firebase, checkout, autentikasi, atau dashboard.
- Metadata dan JSON-LD Person dipasang di browser melalui React useEffect. Ini membantu crawler yang menjalankan JavaScript, tetapi bukan jaminan rich result atau ringkasan Google.
- Nomor WhatsApp ditautkan dalam format internasional.
