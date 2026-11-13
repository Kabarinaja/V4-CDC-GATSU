import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { gatsuDb } from '../lib/firebase';
import { computeAdEndDate, validateAdUrl } from '../lib/ads';
import { sanitizeEditorialHtml } from '../lib/sanitize';
import { calculateReadingTime, slugify } from '../lib/seo';
import type {
  Advertisement,
  Article,
  ArticleStatus,
  Author,
  Category,
  DashboardStats,
  PortalSettings,
} from '../types';

const COL_ARTICLES = 'articles';
const COL_CATEGORIES = 'categories';
const COL_AUTHORS = 'authors';
const COL_ADS = 'ads';
const COL_SETTINGS = 'settings';
const SETTINGS_DOC_ID = 'portal';

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  siteName: 'GATSU WEWARAH',
  tagline: 'Informasi, Inspirasi, dan Kabar Terkini.',
  breakingLabel: 'TERKINI',
  contactEmail: 'redaksi@dicelupayamcrispy.store',
  contactPhone: '+62 811-2345-6789',
  officeAddress: 'Jl. Jenderal Gatot Subroto, Indramayu, Jawa Barat',
  editorialAboutHtml: `
    <p><strong>GATSU WEWARAH</strong> adalah kanal media digital dan jurnalistik independen yang menghadirkan informasi, inspirasi, dan kabar terkini bagi pembaca di Indramayu dan Indonesia.</p>
    <h2>Visi Redaksi</h2>
    <p>Menyajikan liputan berimbang, akurat, dan terverifikasi dengan standar etika jurnalistik profesional serta sudut pandang yang mencerahkan pelaku usaha, komunitas, dan masyarakat luas.</p>
    <h2>Fokus Liputan</h2>
    <ul>
      <li>Ekonomi daerah, dinamika pasar, dan perkembangan UMKM kuliner.</li>
      <li>Peristiwa nasional, kebijakan publik, dan layanan masyarakat.</li>
      <li>Inovasi teknologi terapan, gaya hidup, serta opini konstruktif.</li>
    </ul>
  `,
  editorialContactHtml: `
    <p>Redaksi <strong>GATSU WEWARAH</strong> terbuka terhadap siaran pers, klarifikasi hak jawab, laporan warga, dan kerja sama liputan atau pemasangan iklan komersial.</p>
    <h2>Alamat Redaksi</h2>
    <p>Jl. Jenderal Gatot Subroto, Indramayu, Jawa Barat.</p>
    <h2>Kontak Resmi</h2>
    <ul>
      <li>Email Redaksi: redaksi@dicelupayamcrispy.store</li>
      <li>Layanan Iklan &amp; Kolaborasi: iklan@dicelupayamcrispy.store</li>
    </ul>
  `,
  privacyPolicyHtml: `
    <p><strong>GATSU WEWARAH</strong> menghormati privasi setiap pembaca yang mengakses portal berita ini.</p>
    <h2>Data yang Kami Kumpulkan</h2>
    <p>Kami hanya mencatat statistik kunjungan artikel secara agregat tanpa menjual data pribadi pembaca kepada pihak ketiga.</p>
    <h2>Tautan Iklan &amp; Pihak Ketiga</h2>
    <p>Setiap materi iklan diberi label <strong>IKLAN</strong> secara transparan. Saat Anda mengeklik tautan iklan, Anda akan diarahkan ke situs mitra di tab baru sesuai kebijakan privasi masing-masing mitra.</p>
  `,
  cyberMediaGuidelinesHtml: `
    <p>Pengelolaan konten di <strong>GATSU WEWARAH</strong> mengacu pada Pedoman Pemberitaan Media Siber Dewan Pers Republik Indonesia.</p>
    <h2>Verifikasi dan Keberimbangan</h2>
    <p>Setiap berita yang diterbitkan melewati proses verifikasi fakta redaksi. Dalam keadaan mendesak yang memerlukan pembaruan cepat, berita akan diperbarui segera setelah konfirmasi lanjutan diperoleh.</p>
    <h2>Hak Jawab dan Koreksi</h2>
    <p>Pembaca berhak mengajukan hak jawab atau permintaan koreksi melalui alamat email resmi redaksi dengan menyertakan tautan artikel terkait dan bukti pendukung.</p>
  `,
  updatedAt: new Date().toISOString(),
};

function generateReadableId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36);
  return `${prefix}-${ts}-${rand}`;
}

// ============================================================
// PUBLIC & ADMIN READS
// ============================================================

export async function fetchPublishedArticles(maxCount = 50): Promise<Article[]> {
  const q = query(
    collection(gatsuDb, COL_ARTICLES),
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Article, 'id'>) }));
}

export async function fetchAllArticlesAdmin(): Promise<Article[]> {
  const q = query(
    collection(gatsuDb, COL_ARTICLES),
    orderBy('updatedAt', 'desc'),
    limit(250)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Article, 'id'>) }));
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const q = query(
    collection(gatsuDb, COL_ARTICLES),
    where('slug', '==', slug),
    where('status', '==', 'published'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const first = snap.docs[0];
  return { id: first.id, ...(first.data() as Omit<Article, 'id'>) };
}

export async function fetchArticleByIdAdmin(id: string): Promise<Article | null> {
  const ref = doc(gatsuDb, COL_ARTICLES, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Article, 'id'>) };
}

export async function fetchArticlesByCategorySlug(
  categorySlug: string,
  maxCount = 60
): Promise<Article[]> {
  const q = query(
    collection(gatsuDb, COL_ARTICLES),
    where('status', '==', 'published'),
    where('categorySlug', '==', categorySlug),
    orderBy('publishedAt', 'desc'),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Article, 'id'>) }));
}

export async function fetchArticlesByAuthorId(
  authorId: string,
  maxCount = 60
): Promise<Article[]> {
  const q = query(
    collection(gatsuDb, COL_ARTICLES),
    where('status', '==', 'published'),
    where('authorId', '==', authorId),
    orderBy('publishedAt', 'desc'),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Article, 'id'>) }));
}

export async function incrementArticleViews(articleId: string): Promise<void> {
  try {
    await updateDoc(doc(gatsuDb, COL_ARTICLES, articleId), {
      views: increment(1),
    });
  } catch {
    // Non-blocking telemetry
  }
}

export async function fetchCategories(): Promise<Category[]> {
  const q = query(collection(gatsuDb, COL_CATEGORIES), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }));
}

export async function fetchAuthors(): Promise<Author[]> {
  const q = query(collection(gatsuDb, COL_AUTHORS), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Author, 'id'>) }));
}

export async function fetchAuthorById(authorId: string): Promise<Author | null> {
  const snap = await getDoc(doc(gatsuDb, COL_AUTHORS, authorId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Author, 'id'>) };
}

export async function fetchActiveAdsPublic(): Promise<Advertisement[]> {
  const q = query(collection(gatsuDb, COL_ADS), where('active', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Advertisement, 'id'>) }));
}

export async function fetchAllAdsAdmin(): Promise<Advertisement[]> {
  const q = query(collection(gatsuDb, COL_ADS), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Advertisement, 'id'>) }));
}

export async function incrementAdClicks(adId: string): Promise<void> {
  try {
    await updateDoc(doc(gatsuDb, COL_ADS, adId), {
      clicks: increment(1),
    });
  } catch {
    // Non-blocking
  }
}

export async function fetchPortalSettings(): Promise<PortalSettings> {
  try {
    const snap = await getDoc(doc(gatsuDb, COL_SETTINGS, SETTINGS_DOC_ID));
    if (!snap.exists()) return DEFAULT_PORTAL_SETTINGS;
    return {
      ...DEFAULT_PORTAL_SETTINGS,
      ...(snap.data() as Partial<PortalSettings>),
    };
  } catch {
    return DEFAULT_PORTAL_SETTINGS;
  }
}

// ============================================================
// ADMIN MUTATIONS
// ============================================================

export interface SaveArticleInput {
  id?: string;
  title: string;
  slug?: string;
  summary: string;
  contentHtml: string;
  coverImage: string;
  coverCaption: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  status: ArticleStatus;
  isBreaking: boolean;
  isHeadline: boolean;
  isEditorPick: boolean;
  tags: string[];
  scheduledAt?: string;
  publishedAt?: string;
}

export async function saveArticleAdmin(input: SaveArticleInput): Promise<Article> {
  const now = new Date().toISOString();
  const cleanHtml = sanitizeEditorialHtml(input.contentHtml);
  const finalSlug = slugify(input.slug?.trim() || input.title);

  if (!input.title.trim()) throw new Error('Judul berita wajib diisi.');
  if (!finalSlug) throw new Error('Slug URL berita tidak valid.');
  if (!input.categoryId) throw new Error('Kategori berita wajib dipilih.');
  if (!input.authorId) throw new Error('Penulis berita wajib dipilih.');

  const readingTimeMinutes = calculateReadingTime(cleanHtml);
  const articleId = input.id || generateReadableId('art');

  let publishedAt = input.publishedAt || now;
  if (input.status === 'scheduled' && input.scheduledAt) {
    publishedAt = new Date(input.scheduledAt).toISOString();
  }

  const existing = input.id ? await fetchArticleByIdAdmin(input.id) : null;

  const payload: Omit<Article, 'id'> = {
    title: input.title.trim(),
    slug: finalSlug,
    summary: input.summary.trim(),
    contentHtml: cleanHtml,
    coverImage: input.coverImage.trim(),
    coverCaption: input.coverCaption.trim(),
    categoryId: input.categoryId,
    categorySlug: input.categorySlug,
    categoryName: input.categoryName,
    authorId: input.authorId,
    authorName: input.authorName,
    authorPhoto: input.authorPhoto,
    status: input.status,
    isBreaking: input.isBreaking,
    isHeadline: input.isHeadline,
    isEditorPick: input.isEditorPick,
    views: existing?.views ?? 0,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    readingTimeMinutes,
    publishedAt,
    scheduledAt: input.status === 'scheduled' ? publishedAt : '',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await setDoc(doc(gatsuDb, COL_ARTICLES, articleId), payload, { merge: true });
  return { id: articleId, ...payload };
}

export async function deleteArticleAdmin(articleId: string): Promise<void> {
  await deleteDoc(doc(gatsuDb, COL_ARTICLES, articleId));
}

export async function publishDueScheduledArticles(): Promise<number> {
  const q = query(
    collection(gatsuDb, COL_ARTICLES),
    where('status', '==', 'scheduled')
  );
  const snap = await getDocs(q);
  const nowMs = Date.now();
  const batch = writeBatch(gatsuDb);
  let promoted = 0;

  snap.docs.forEach((docSnap) => {
    const data = docSnap.data() as Article;
    const schedTime = data.scheduledAt ? new Date(data.scheduledAt).getTime() : 0;
    if (schedTime > 0 && schedTime <= nowMs) {
      batch.update(docSnap.ref, {
        status: 'published',
        publishedAt: data.scheduledAt,
        updatedAt: new Date().toISOString(),
      });
      promoted += 1;
    }
  });

  if (promoted > 0) {
    await batch.commit();
  }
  return promoted;
}

export async function saveCategoryAdmin(input: {
  id?: string;
  name: string;
  slug?: string;
  description: string;
  order: number;
}): Promise<Category> {
  const name = input.name.trim();
  const slug = slugify(input.slug?.trim() || name);
  if (!name || !slug) throw new Error('Nama dan slug kategori wajib diisi.');

  const id = input.id || generateReadableId('cat');
  const existing = input.id
    ? await getDoc(doc(gatsuDb, COL_CATEGORIES, input.id))
    : null;

  const payload: Omit<Category, 'id'> = {
    name,
    slug,
    description: input.description.trim(),
    order: Number.isFinite(input.order) ? input.order : 1,
    createdAt:
      existing && existing.exists()
        ? (existing.data() as Category).createdAt
        : new Date().toISOString(),
  };

  await setDoc(doc(gatsuDb, COL_CATEGORIES, id), payload, { merge: true });
  return { id, ...payload };
}

export async function deleteCategoryAdmin(categoryId: string): Promise<void> {
  await deleteDoc(doc(gatsuDb, COL_CATEGORIES, categoryId));
}

export async function saveAuthorAdmin(input: {
  id?: string;
  name: string;
  photoUrl: string;
  bio: string;
  role: string;
}): Promise<Author> {
  const name = input.name.trim();
  if (!name) throw new Error('Nama penulis wajib diisi.');

  // Auto-generate unique readable ID when creating a new author
  const id =
    input.id ||
    `${slugify(name).slice(0, 20) || 'penulis'}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

  const existing = input.id
    ? await getDoc(doc(gatsuDb, COL_AUTHORS, input.id))
    : null;

  const payload: Omit<Author, 'id'> = {
    name,
    photoUrl: input.photoUrl.trim(),
    bio: input.bio.trim(),
    role: input.role.trim() || 'Jurnalis Redaksi',
    createdAt:
      existing && existing.exists()
        ? (existing.data() as Author).createdAt
        : new Date().toISOString(),
  };

  await setDoc(doc(gatsuDb, COL_AUTHORS, id), payload, { merge: true });
  return { id, ...payload };
}

export async function deleteAuthorAdmin(authorId: string): Promise<void> {
  await deleteDoc(doc(gatsuDb, COL_AUTHORS, authorId));
}

export async function saveAdAdmin(
  input: Omit<Advertisement, 'id' | 'endDate' | 'clicks' | 'createdAt' | 'updatedAt'> & {
    id?: string;
  }
): Promise<Advertisement> {
  const urlCheck = validateAdUrl(input.targetUrl);
  if (!urlCheck.valid || !urlCheck.normalized) {
    throw new Error(urlCheck.reason || 'URL tujuan iklan tidak valid.');
  }
  if (!input.title.trim()) throw new Error('Judul iklan wajib diisi.');
  if (!input.imageUrl.trim()) throw new Error('Gambar iklan wajib diunggah.');

  const now = new Date().toISOString();
  const id = input.id || generateReadableId('ad');
  const existing = input.id
    ? await getDoc(doc(gatsuDb, COL_ADS, input.id))
    : null;

  const durationDays = Math.max(1, Math.floor(Number(input.durationDays) || 1));
  const endDate = computeAdEndDate(input.startDate, durationDays);

  const payload: Omit<Advertisement, 'id'> = {
    title: input.title.trim(),
    imageUrl: input.imageUrl.trim(),
    targetUrl: urlCheck.normalized,
    targetScope: input.targetScope,
    targetCategoryIds: input.targetCategoryIds,
    targetArticleIds: input.targetArticleIds,
    position: input.position,
    afterParagraph: Math.max(1, Math.floor(Number(input.afterParagraph) || 2)),
    startDate: input.startDate,
    durationDays,
    endDate,
    active: input.active,
    clicks: existing && existing.exists() ? (existing.data() as Advertisement).clicks : 0,
    createdAt:
      existing && existing.exists()
        ? (existing.data() as Advertisement).createdAt
        : now,
    updatedAt: now,
  };

  await setDoc(doc(gatsuDb, COL_ADS, id), payload, { merge: true });
  return { id, ...payload };
}

export async function deleteAdAdmin(adId: string): Promise<void> {
  await deleteDoc(doc(gatsuDb, COL_ADS, adId));
}

export async function savePortalSettingsAdmin(
  settings: Omit<PortalSettings, 'updatedAt'>
): Promise<PortalSettings> {
  const payload: PortalSettings = {
    ...settings,
    editorialAboutHtml: sanitizeEditorialHtml(settings.editorialAboutHtml),
    editorialContactHtml: sanitizeEditorialHtml(settings.editorialContactHtml),
    privacyPolicyHtml: sanitizeEditorialHtml(settings.privacyPolicyHtml),
    cyberMediaGuidelinesHtml: sanitizeEditorialHtml(settings.cyberMediaGuidelinesHtml),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(gatsuDb, COL_SETTINGS, SETTINGS_DOC_ID), payload, {
    merge: true,
  });
  return payload;
}

export async function computeDashboardStats(
  articles: Article[],
  categories: Category[],
  authors: Author[],
  ads: Advertisement[]
): Promise<DashboardStats> {
  const now = Date.now();
  const activeAdsCount = ads.filter(
    (ad) => ad.active && new Date(ad.endDate).getTime() >= now
  ).length;

  return {
    totalArticles: articles.length,
    publishedCount: articles.filter((a) => a.status === 'published').length,
    draftCount: articles.filter((a) => a.status === 'draft').length,
    scheduledCount: articles.filter((a) => a.status === 'scheduled').length,
    totalViews: articles.reduce((sum, a) => sum + (a.views || 0), 0),
    totalCategories: categories.length,
    totalAuthors: authors.length,
    activeAdsCount,
  };
}

export async function bootstrapInitialCategoriesAndSettings(): Promise<void> {
  const batch = writeBatch(gatsuDb);
  const now = new Date().toISOString();

  const initialCategories = [
    { id: 'cat-nasional', name: 'Nasional', slug: 'nasional', description: 'Peristiwa utama, kebijakan publik, dan kabar dari seluruh penjuru negeri.', order: 1 },
    { id: 'cat-ekonomi', name: 'Ekonomi & UMKM', slug: 'ekonomi-umkm', description: 'Liputan bisnis, perdagangan daerah, dan geliat pelaku UMKM Indonesia.', order: 2 },
    { id: 'cat-kuliner', name: 'Kuliner', slug: 'kuliner', description: 'Jelajah rasa, industri pangan, dan cerita di balik dapur nusantara.', order: 3 },
    { id: 'cat-teknologi', name: 'Teknologi', slug: 'teknologi', description: 'Transformasi digital, perangkat lunak, dan inovasi lokal.', order: 4 },
    { id: 'cat-gaya-hidup', name: 'Gaya Hidup', slug: 'gaya-hidup', description: 'Budaya urban, kesehatan, dan inspirasi keseharian.', order: 5 },
    { id: 'cat-opini', name: 'Opini', slug: 'opini', description: 'Esai mendalam dan pandangan jernih dari redaksi serta kontributor.', order: 6 },
  ];

  initialCategories.forEach((cat) => {
    batch.set(
      doc(gatsuDb, COL_CATEGORIES, cat.id),
      {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        order: cat.order,
        createdAt: now,
      },
      { merge: true }
    );
  });

  batch.set(
    doc(gatsuDb, COL_SETTINGS, SETTINGS_DOC_ID),
    { ...DEFAULT_PORTAL_SETTINGS, updatedAt: now },
    { merge: true }
  );

  await batch.commit();
}
