# DICELUP UI redesign notes

This build keeps the existing application features and Firebase data flow while refining the mobile-first UI.

## Latest changes
- Member Area is now the first content block on the home page and uses a compact member summary on mobile.
- Removed decorative/icon-heavy elements from the member card; the full member page still keeps the QR/member information.
- Admin member QR scanning now speaks a dynamic Indonesian confirmation using browser Text-to-Speech: member name, point balance, and point value (1 point = Rp100 based on the existing app rule).
- Promo & Pengumuman Spesial now preserves A4 portrait framing (210:297) and uses `object-contain`, so uploaded A4 posters are not cropped.
- Promo carousel auto-advances every 5 seconds, loops continuously, supports swipe gestures, and pauses briefly during touch interaction.
- Home page no longer has the extra quick-action icon cards, reducing visual clutter without removing their destination features (Menu, Troli, Pesanan remain available through the app navigation/buttons).
- Menu catalogue is now a two-column shopping grid on mobile, with compact product cards and no feature/checkout logic changes.

## Firebase
The build keeps the verified `mycdc-7035a` Firebase configuration supplied for this project.
