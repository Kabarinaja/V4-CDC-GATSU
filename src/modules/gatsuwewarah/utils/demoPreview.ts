import type { Article, Author, Category } from '../types';
import leadImg from '../assets/demo/lead_economy.jpg';
import culinaryImg from '../assets/demo/culinary_umkm.jpg';
import newsroomImg from '../assets/demo/tech_indonesia.jpg';
import authorPortraitImg from '../assets/demo/author_portrait.jpg';

/**
 * Transient layout-preview data used ONLY when explicitly requested via ?demo=1
 * so reviewers can inspect editorial typography, grid hierarchy, and ad placement
 * before Firestore rules/content are populated. Never written to Firestore.
 */
export const TRANSIENT_DEMO_CATEGORIES: Category[] = [
  {
    id: 'demo-ekonomi',
    name: 'Ekonomi & UMKM',
    slug: 'ekonomi-umkm',
    description: 'Liputan mendalam dinamika perdagangan daerah, pasar rakyat, dan pertumbuhan UMKM.',
    order: 1,
    createdAt: '2026-11-10T06:00:00.000Z',
  },
  {
    id: 'demo-kuliner',
    name: 'Kuliner',
    slug: 'kuliner',
    description: 'Cerita dapur, standar mutu pangan, dan inovasi rasa dari pelaku kuliner lokal.',
    order: 2,
    createdAt: '2026-11-10T06:00:00.000Z',
  },
  {
    id: 'demo-teknologi',
    name: 'Teknologi',
    slug: 'teknologi',
    description: 'Transformasi digital redaksi, sistem kasir modern, dan ekosistem daring daerah.',
    order: 3,
    createdAt: '2026-11-10T06:00:00.000Z',
  },
  {
    id: 'demo-nasional',
    name: 'Nasional',
    slug: 'nasional',
    description: 'Kabar terkini kebijakan publik dan pembangunan infrastruktur strategis.',
    order: 4,
    createdAt: '2026-11-10T06:00:00.000Z',
  },
  {
    id: 'demo-opini',
    name: 'Opini',
    slug: 'opini',
    description: 'Sudut pandang editorial dan esai terkurasi dari penulis senior.',
    order: 5,
    createdAt: '2026-11-10T06:00:00.000Z',
  },
];

export const TRANSIENT_DEMO_AUTHORS: Author[] = [
  {
    id: 'demo-author-1',
    name: 'Hendra Wijaya',
    photoUrl: authorPortraitImg,
    bio: 'Pemimpin Redaksi GATSU WEWARAH. Menekuni liputan ekonomi kerakyatan, rantai pasok pangan, dan transformasi usaha mikro di pesisir utara Jawa sejak 2014.',
    role: 'Pemimpin Redaksi',
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'demo-author-2',
    name: 'Nadia Kartika',
    photoUrl: authorPortraitImg,
    bio: 'Redaktur Pelaksana bidang kuliner dan teknologi terapan. Aktif mengawal standar jurnalisme data dan liputan lapangan.',
    role: 'Redaktur Pelaksana',
    createdAt: '2026-11-01T00:00:00.000Z',
  },
];

export const TRANSIENT_DEMO_ARTICLES: Article[] = [
  {
    id: 'demo-art-1',
    title: 'Denyut Baru Ekonomi Pagi di Koridor Niaga Daerah: Ketika UMKM Kuliner Memadukan Tradisi dan Layanan Digital',
    slug: 'denyut-baru-ekonomi-pagi-di-koridor-niaga-daerah',
    summary: 'Pelaku usaha kecil di jalur komersial daerah membuktikan bahwa disiplin mutu dan pemesanan digital mampu menjaga daya tahan omzet di tengah fluktuasi biaya bahan baku.',
    contentHtml: `
      <p>Pukul setengah tujuh pagi di koridor niaga utama, deretan gerobak kayu dan kedai modern mulai membuka tirai bersamaan dengan arus kendaraan komuter. Di antara aroma kopi tubruk dan gorengan hangat, transaksi kini tak lagi semata mengandalkan uang tunai di meja kasir.</p>
      <p>Catatan lapangan redaksi selama dua pekan terakhir menunjukkan pergeseran nyata pada pola belanja warga. Pelanggan memesan paket sarapan hingga makan siang melalui ponsel sebelum berangkat kerja, lalu mengambil pesanan tanpa antre panjang.</p>
      <h2>Efisiensi Dapur dan Kepastian Stok</h2>
      <p>Bagi pelaku UMKM kuliner, kepastian permintaan sejak pagi hari membantu menekan angka bahan pangan terbuang. Dapur dapat menakar adonan tepung, minyak goreng, dan bumbu marinasi sesuai pesanan masuk.</p>
      <blockquote>"Ketika arus pesanan tercatat rapi secara digital, kami bisa menjaga kerenyahan sajian tetap konsisten dan mengalokasikan laba bersih untuk peningkatan kualitas kemasan," ujar salah satu pengelola gerai di kawasan Gatot Subroto.</blockquote>
      <h3>Standar Kebersihan Sebagai Modal Kepercayaan</h3>
      <p>Selain kecepatan layanan, konsumen muda kini menaruh perhatian besar pada transparansi dapur. Sertifikasi bahan baku, pencatatan suhu penggorengan, dan kebersihan area saji menjadi pembeda utama antara usaha yang bertahan musiman dengan merek lokal yang tumbuh berkelanjutan.</p>
      <p>Ke depan, kolaborasi antara asosiasi pedagang, penyedia logistik lokal, dan media komunitas diharapkan terus memperluas jangkauan pasar produk daerah ke tingkat regional.</p>
    `,
    coverImage: leadImg,
    coverCaption: 'Aktivitas pagi pelaku UMKM dan arus komuter di kawasan niaga Indonesia.',
    categoryId: 'demo-ekonomi',
    categorySlug: 'ekonomi-umkm',
    categoryName: 'Ekonomi & UMKM',
    authorId: 'demo-author-1',
    authorName: 'Hendra Wijaya',
    authorPhoto: authorPortraitImg,
    status: 'published',
    isBreaking: true,
    isHeadline: true,
    isEditorPick: true,
    views: 2840,
    tags: ['UMKM', 'Ekonomi Daerah', 'Digitalisasi'],
    readingTimeMinutes: 4,
    publishedAt: '2026-11-13T07:30:00.000Z',
    createdAt: '2026-11-13T07:00:00.000Z',
    updatedAt: '2026-11-13T07:30:00.000Z',
  },
  {
    id: 'demo-art-2',
    title: 'Di Balik Dapur Ayam Krispi Nusantara: Menjaga Konsistensi Bumbu dan Tekstur di Jam Sibuk',
    slug: 'di-balik-dapur-ayam-krispi-nusantara',
    summary: 'Teknik marinasi bertahap dan kontrol suhu minyak presisi menjadi kunci di balik renyahnya ayam goreng racikan lokal yang digemari keluarga.',
    contentHtml: `
      <p>Menyajikan ayam krispi yang tetap garing di luar namun lembut di dalam bukan perkara kebetulan. Di dapur produksi modern, setiap potongan daging melewati pengukuran berat, suhu ruang pendingin, hingga durasi pencelupan bumbu yang seragam.</p>
      <p>Kombinasi rempah Nusantara seperti bawang putih, ketumbar, kunyit, dan cabai segar untuk sambal pendamping memberi karakter rasa yang akrab di lidah masyarakat Indonesia.</p>
      <p>Penggunaan peralatan baja tahan karat dan pemisahan zona bahan mentah serta matang turut menjamin higienitas sajian pada jam makan siang yang padat.</p>
    `,
    coverImage: culinaryImg,
    coverCaption: 'Juru masak menata sajian ayam krispi dan sambal segar di dapur terbuka.',
    categoryId: 'demo-kuliner',
    categorySlug: 'kuliner',
    categoryName: 'Kuliner',
    authorId: 'demo-author-2',
    authorName: 'Nadia Kartika',
    authorPhoto: authorPortraitImg,
    status: 'published',
    isBreaking: false,
    isHeadline: true,
    isEditorPick: true,
    views: 1960,
    tags: ['Kuliner', 'Inovasi Dapur'],
    readingTimeMinutes: 3,
    publishedAt: '2026-11-12T10:15:00.000Z',
    createdAt: '2026-11-12T09:40:00.000Z',
    updatedAt: '2026-11-12T10:15:00.000Z',
  },
  {
    id: 'demo-art-3',
    title: 'Ruang Redaksi Hibrida: Bagaimana Jurnalisme Daerah Memverifikasi Kabar di Era Arus Informasi Cepat',
    slug: 'ruang-redaksi-hibrida-verifikasi-kabar',
    summary: 'Disiplin verifikasi berlapis tetap menjadi fondasi utama ruang redaksi meski kecepatan distribusi berita di perangkat seluler kian menuntut respons singkat.',
    contentHtml: `
      <p>Meja redaksi modern tidak lagi hanya dipenuhi tumpukan kertas cetak. Layar penyuntingan kolaboratif memungkinkan reporter lapangan mengirimkan foto, kutipan narasumber, dan dokumen verifikasi secara langsung ke meja editor.</p>
      <p>Meski demikian, prinsip dasar jurnalistik tidak berubah: satu informasi belum layak tayang sebelum dikonfirmasi minimal dua sumber tepercaya.</p>
    `,
    coverImage: newsroomImg,
    coverCaption: 'Tim redaksi membahas sudut pandang liputan dan verifikasi naskah berita.',
    categoryId: 'demo-teknologi',
    categorySlug: 'teknologi',
    categoryName: 'Teknologi',
    authorId: 'demo-author-2',
    authorName: 'Nadia Kartika',
    authorPhoto: authorPortraitImg,
    status: 'published',
    isBreaking: false,
    isHeadline: false,
    isEditorPick: true,
    views: 1510,
    tags: ['Jurnalisme', 'Media Digital'],
    readingTimeMinutes: 3,
    publishedAt: '2026-11-11T14:20:00.000Z',
    createdAt: '2026-11-11T13:50:00.000Z',
    updatedAt: '2026-11-11T14:20:00.000Z',
  },
  {
    id: 'demo-art-4',
    title: 'Catatan Akhir Pekan: Mengapa Ruang Informasi Lokal yang Sehat Menentukan Kualitas Keputusan Warga',
    slug: 'catatan-akhir-pekan-ruang-informasi-lokal',
    summary: 'Kehadiran media lokal yang berimbang menjembatani aspirasi warga dengan kebijakan publik di tingkat kabupaten dan kota.',
    contentHtml: `
      <p>Di tengah banjir informasi media sosial yang kerap memotong konteks, warga membutuhkan rujukan berita yang tenang, terstruktur, dan dapat dipertanggungjawabkan.</p>
      <p>Media lokal yang kuat bekerja bukan untuk mengejar sensasi klik sesaat, melainkan mencatat perubahan nyata di lingkungan sekitar pembaca.</p>
    `,
    coverImage: leadImg,
    coverCaption: 'Suasana lalu lintas kawasan perkotaan pada jam berangkat kerja.',
    categoryId: 'demo-opini',
    categorySlug: 'opini',
    categoryName: 'Opini',
    authorId: 'demo-author-1',
    authorName: 'Hendra Wijaya',
    authorPhoto: authorPortraitImg,
    status: 'published',
    isBreaking: false,
    isHeadline: false,
    isEditorPick: false,
    views: 1120,
    tags: ['Opini', 'Literasi Media'],
    readingTimeMinutes: 2,
    publishedAt: '2026-11-10T09:00:00.000Z',
    createdAt: '2026-11-10T08:30:00.000Z',
    updatedAt: '2026-11-10T09:00:00.000Z',
  },
];
