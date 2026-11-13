import test from 'node:test';
import assert from 'node:assert/strict';
import {
  slugify,
  stripHtml,
  calculateReadingTime,
  splitHtmlAfterParagraphs,
  buildArticleMeta,
  generateSitemapXml,
} from '../seo';
import {
  validateAdUrl,
  computeAdEndDate,
  isAdActiveNow,
  filterEligibleAds,
} from '../ads';
import { optimizeCloudinaryUrl } from '../cloudinary';
import { sanitizeEditorialHtml } from '../sanitize';
import type { Advertisement, Article, Author, Category } from '../../types';

const sampleArticle: Article = {
  id: 'art-1',
  title: 'Ekonomi Kuliner Lokal Tumbuh Pesat di Indramayu',
  slug: 'ekonomi-kuliner-lokal-tumbuh-pesat-di-indramayu',
  summary: 'Pelaku UMKM kuliner daerah mencatat lonjakan permintaan digital sepanjang kuartal terakhir.',
  contentHtml: '<p>Paragraf pertama.</p><p>Paragraf kedua.</p><p>Paragraf ketiga.</p>',
  coverImage: 'https://res.cloudinary.com/nj6kyxex/image/upload/v1700000000/celupnews/images/sample.jpg',
  coverCaption: 'Suasana dapur UMKM kuliner.',
  categoryId: 'cat-1',
  categorySlug: 'ekonomi',
  categoryName: 'Ekonomi',
  authorId: 'penulis-01',
  authorName: 'Raka Pratama',
  authorPhoto: 'https://res.cloudinary.com/nj6kyxex/image/upload/v1700000000/celupnews/images/raka.jpg',
  status: 'published',
  isBreaking: true,
  isHeadline: true,
  isEditorPick: false,
  views: 120,
  tags: ['UMKM', 'Ekonomi'],
  readingTimeMinutes: 2,
  publishedAt: '2026-11-10T08:00:00.000Z',
  createdAt: '2026-11-10T07:00:00.000Z',
  updatedAt: '2026-11-10T09:00:00.000Z',
};

const sampleDraft: Article = {
  ...sampleArticle,
  id: 'art-draft',
  title: 'Draft Rahasia',
  slug: 'draft-rahasia',
  status: 'draft',
};

const sampleScheduled: Article = {
  ...sampleArticle,
  id: 'art-sched',
  title: 'Terjadwal Besok',
  slug: 'terjadwal-besok',
  status: 'scheduled',
  scheduledAt: '2026-11-20T08:00:00.000Z',
};

const sampleCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Ekonomi',
    slug: 'ekonomi',
    description: 'Berita ekonomi & UMKM',
    order: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
];

const sampleAuthors: Author[] = [
  {
    id: 'penulis-01',
    name: 'Raka Pratama',
    photoUrl: 'https://res.cloudinary.com/nj6kyxex/image/upload/v1700000000/celupnews/images/raka.jpg',
    bio: 'Jurnalis ekonomi daerah.',
    role: 'Editor Ekonomi',
    createdAt: '2026-11-01T00:00:00.000Z',
  },
];

test('slugify formats Indonesian titles cleanly', () => {
  assert.equal(
    slugify('Ekonomi & UMKM: Tumbuh 20% di Indramayu!'),
    'ekonomi-umkm-tumbuh-20-di-indramayu'
  );
});

test('stripHtml and calculateReadingTime extract plain text accurately', () => {
  const html = '<h1>Judul</h1><p>Satu dua tiga empat lima.</p>';
  assert.equal(stripHtml(html), 'Judul Satu dua tiga empat lima.');
  assert.equal(calculateReadingTime(html), 1);
});

test('splitHtmlAfterParagraphs splits strictly after Nth paragraph', () => {
  const { before, after, totalParagraphs } = splitHtmlAfterParagraphs(
    sampleArticle.contentHtml,
    2
  );
  assert.equal(totalParagraphs, 3);
  assert.equal(before, '<p>Paragraf pertama.</p><p>Paragraf kedua.</p>');
  assert.equal(after, '<p>Paragraf ketiga.</p>');
});

test('buildArticleMeta uses Cloudinary cover image instead of logo', () => {
  const meta = buildArticleMeta(sampleArticle, 'https://www.dicelupayamcrispy.store');
  assert.equal(meta.imageUrl, sampleArticle.coverImage);
  assert.equal(
    meta.canonicalUrl,
    'https://www.dicelupayamcrispy.store/gatsuwewarah/berita/ekonomi-kuliner-lokal-tumbuh-pesat-di-indramayu'
  );
});

test('generateSitemapXml includes published articles, categories, authors and excludes drafts & scheduled', () => {
  const xml = generateSitemapXml({
    baseUrl: 'https://www.dicelupayamcrispy.store',
    articles: [sampleArticle, sampleDraft, sampleScheduled],
    categories: sampleCategories,
    authors: sampleAuthors,
  });

  assert.match(xml, /<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /ekonomi-kuliner-lokal-tumbuh-pesat-di-indramayu/);
  assert.match(xml, /\/gatsuwewarah\/kategori\/ekonomi/);
  assert.match(xml, /\/gatsuwewarah\/penulis\/penulis-01/);
  assert.doesNotMatch(xml, /draft-rahasia/);
  assert.doesNotMatch(xml, /terjadwal-besok/);
});

test('validateAdUrl rejects javascript: URLs and accepts https URLs', () => {
  assert.equal(validateAdUrl('javascript:alert(1)').valid, false);
  assert.equal(validateAdUrl('https://www.dicelupayamcrispy.store/menu').valid, true);
});

test('isAdActiveNow automatically stops expired advertisements', () => {
  const activeAd: Advertisement = {
    id: 'ad-1',
    title: 'Promo Paket Crispy',
    imageUrl: 'https://res.cloudinary.com/nj6kyxex/image/upload/v1700000000/celupnews/images/ad.jpg',
    targetUrl: 'https://www.dicelupayamcrispy.store/menu',
    targetScope: 'categories',
    targetCategoryIds: ['cat-1'],
    targetArticleIds: [],
    position: 'article_in_content',
    afterParagraph: 2,
    startDate: '2026-11-10',
    durationDays: 5,
    endDate: computeAdEndDate('2026-11-10', 5),
    active: true,
    clicks: 0,
    createdAt: '2026-11-10T00:00:00.000Z',
    updatedAt: '2026-11-10T00:00:00.000Z',
  };

  assert.equal(isAdActiveNow(activeAd, new Date('2026-11-12T12:00:00.000Z')), true);
  assert.equal(isAdActiveNow(activeAd, new Date('2026-11-20T12:00:00.000Z')), false);

  const matched = filterEligibleAds([activeAd], {
    position: 'article_in_content',
    categoryId: 'cat-1',
    articleId: 'art-1',
    now: new Date('2026-11-12T12:00:00.000Z'),
  });
  assert.equal(matched.length, 1);

  const unmatchedCat = filterEligibleAds([activeAd], {
    position: 'article_in_content',
    categoryId: 'cat-other',
    articleId: 'art-1',
    now: new Date('2026-11-12T12:00:00.000Z'),
  });
  assert.equal(unmatchedCat.length, 0);
});

test('optimizeCloudinaryUrl injects f_auto,q_auto transforms safely', () => {
  const optimized = optimizeCloudinaryUrl(
    'https://res.cloudinary.com/nj6kyxex/image/upload/v1700000000/celupnews/images/hero.jpg',
    { width: 800, crop: 'fill' }
  );
  assert.equal(
    optimized,
    'https://res.cloudinary.com/nj6kyxex/image/upload/f_auto,q_auto:good,w_800,c_fill/v1700000000/celupnews/images/hero.jpg'
  );
});

test('sanitizeEditorialHtml strips script tags and inline event handlers', () => {
  const dirty = '<p onclick="evil()">Halo</p><script>alert(1)</script><a href="javascript:alert(2)">Klik</a>';
  const clean = sanitizeEditorialHtml(dirty);
  assert.doesNotMatch(clean, /<script/i);
  assert.doesNotMatch(clean, /onclick/i);
  assert.doesNotMatch(clean, /javascript:/i);
});
