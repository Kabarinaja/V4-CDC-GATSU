# PANDUAN IMPLEMENTASI & SETUP WEBRTC VOICE CALL — MY CDC GATSU

Fitur panggilan suara (audio-only) telah diintegrasikan langsung pada halaman chat:
- Pelanggan: `/chat`
- Kru Outlet / Admin: `/admin/chat`

---

## 1. Arsitektur & Teknologi

1. **Audio-Only Constraints**:
   - Media constraints disetel secara ketat ke `{ audio: true, video: false }`.
   - Tidak pernah meminta izin kamera atau menyalakan video streaming.
   - Dilengkapi indikator visual ketika mikrofon aktif dan tombol bisukan (Mute/Unmute).

2. **Signaling via Firebase Firestore**:
   - Koleksi: `calls/{callId}`
   - Menyimpan session offer SDP, answer SDP, serta pertukaran ICE Candidates antara caller dan callee.
   - Siklus status: `calling` → `ringing` → `connected` → `ended` / `rejected` / `failed` / `unanswered`.
   - Timeout otomatis 45 detik jika panggilan tidak dijawab.

3. **STUN vs TURN**:
   - **STUN Server Default**: Menggunakan Google Public STUN:
     - `stun:stun.l.google.com:19302`
     - `stun:stun1.l.google.com:19302`
     - `stun:stun2.l.google.com:19302`
   - **Kapan Membutuhkan TURN**:
     - STUN bekerja dengan baik jika salah satu atau kedua perangkat berada di jaringan direct IP, Full-cone NAT, atau Port-restricted NAT.
     - Jika kedua perangkat berada di balik **Symmetric NAT** (misal jaringan data seluler 4G/5G dari operator tertentu dengan firewall ketat atau hotspot kantor), koneksi P2P direct bisa terhambat (`iceConnectionState: failed`).
     - **Solusi TURN**: Gunakan penyedia TURN server (misal Metered.ca, Twilio Network Traversal, Coturn, atau Cloudflare Calls) dan masukkan URL turn + credential via backend proxy token (jangan menaruh secret statis di frontend).

---

## 2. Security Rules Firestore

Rules untuk koleksi `calls` telah ditambahkan di `firestore.rules`:
```javascript
match /calls/{callId} {
  allow get, list: if isSignedIn();
  allow create: if isSignedIn();
  allow update: if isSignedIn();
  allow delete: if isAdmin();
}
```

Deploy rules ke Firebase project:
```bash
firebase deploy --only firestore:rules
```

---

## 3. Privasi & Keamanan Audio

- Panggilan terenkripsi secara peer-to-peer (DTLS-SRTP).
- Sistem tidak merekam atau menyimpan rekaman suara di server maupun di database.
- Saat panggilan berakhir, audio track langsung dihentikan (`track.stop()`) dan resource peer connection ditutup secara bersih.
