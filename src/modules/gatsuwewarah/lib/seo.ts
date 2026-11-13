import type { Article, Author, Category } from '../types';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateReadingTime(html: string): number {
  const plain = stripHtml(html);
  if (!plain) return 1;
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function splitHtmlAfterParagraphs(
  html: string,
  afterParagraph: number
): { before: string; after: string; totalParagraphs: number } {
  const paragraphClosingRegex = /<\/p>/gi;
  const matches: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = paragraphClosingRegex.exec(html)) !== null) {
    matches.push(match.index + match[0].length);
  }

  const totalParagraphs = matches.length;
  if (totalParagraphs === 0 || afterParagraph <= 0) {
    return { before: '', after: html, totalParagraphs };
  }

  if (afterParagraph >= totalParagraphs) {
    return { before: html, after: '', totalParagraphs };
  }

  const splitIndex = matches[afterParagraph - 1];
  return {
    before: html.slice(0, splitIndex),
    after: html.slice(splitIndex),
    totalParagraphs,
  };
}

export function formatIndonesianDate(isoString: string, includeTime = false): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  const formatted = new Intl.DateTimeFormat('id-ID', options).format(date);
  return includeTime ? `${formatted} WIB` : formatted;
}

export function formatShortDate(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface ArticleMeta {
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl: string;
  publishedTime: string;
  modifiedTime: string;
  authorName: string;
  sectionName: string;
  jsonLd: Record<string, unknown>;
}

export function buildArticleMeta(article: Article, originBaseUrl: string): ArticleMeta {
  const cleanBase = originBaseUrl.replace(/\/+$/, '');
  const canonicalUrl = `${cleanBase}/gatsuwewarah/berita/${encodeURIComponent(article.slug)}`;
  const rawSummary = article.summary?.trim() || stripHtml(article.contentHtml).slice(0, 160);
  const description = rawSummary.length > 160 ? `${rawSummary.slice(0, 157)}...` : rawSummary;

  // Use the article's cover image (Cloudinary). Only fall back to header logo if article has no cover image.
  const imageUrl = article.coverImage?.trim()
    ? article.coverImage.trim()
    : `${cleanBase}/gatsuwewarah/logo-header.png`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt || article.publishedAt || article.createdAt,
    author: {
      '@type': 'Person',
      name: article.authorName || 'Redaksi GATSU WEWARAH',
      url: `${cleanBase}/gatsuwewarah/penulis/${encodeURIComponent(article.authorId)}`,
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'GATSU WEWARAH',
      logo: {
        '@type': 'ImageObject',
        url: `${cleanBase}/gatsuwewarah/logo-favicon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    articleSection: article.categoryName,
  };

  return {
    title: `${article.title} — GATSU WEWARAH`,
    description,
    imageUrl,
    canonicalUrl,
    publishedTime: article.publishedAt || article.createdAt,
    modifiedTime: article.updatedAt || article.publishedAt || article.createdAt,
    authorName: article.authorName,
    sectionName: article.categoryName,
    jsonLd,
  };
}

export function generateSitemapXml(params: {
  baseUrl: string;
  articles: Article[];
  categories: Category[];
  authors: Author[];
}): string {
  const cleanBase = params.baseUrl.replace(/\/+$/, '');
  const nowIso = new Date().toISOString();

  const staticRoutes = [
    { loc: `${cleanBase}/gatsuwewarah`, lastmod: nowIso, changefreq: 'hourly', priority: '1.0' },
    { loc: `${cleanBase}/gatsuwewarah/tentang-redaksi`, lastmod: nowIso, changefreq: 'monthly', priority: '0.5' },
    { loc: `${cleanBase}/gatsuwewarah/kontak-redaksi`, lastmod: nowIso, changefreq: 'monthly', priority: '0.5' },
    { loc: `${cleanBase}/gatsuwewarah/kebijakan-privasi`, lastmod: nowIso, changefreq: 'yearly', priority: '0.4' },
    { loc: `${cleanBase}/gatsuwewarah/pedoman-media-siber`, lastmod: nowIso, changefreq: 'yearly', priority: '0.4' },
  ];

  // Strictly include ONLY published articles (exclude drafts, future scheduled, or invalid slugs)
  const publishedArticles = params.articles.filter(
    (a) => a.status === 'published' && Boolean(a.slug?.trim())
  );

  const categoryUrls = params.categories
    .filter((c) => Boolean(c.slug?.trim()))
    .map((c) => ({
      loc: `${cleanBase}/gatsuwewarah/kategori/${encodeURIComponent(c.slug)}`,
      lastmod: c.createdAt || nowIso,
      changefreq: 'daily',
      priority: '0.8',
    }));

  const authorUrls = params.authors
    .filter((au) => Boolean(au.id?.trim()))
    .map((au) => ({
      loc: `${cleanBase}/gatsuwewarah/penulis/${encodeURIComponent(au.id)}`,
      lastmod: au.createdAt || nowIso,
      changefreq: 'weekly',
      priority: '0.6',
    }));

  const articleUrls = publishedArticles.map((a) => ({
    loc: `${cleanBase}/gatsuwewarah/berita/${encodeURIComponent(a.slug)}`,
    lastmod: new Date(a.updatedAt || a.publishedAt || a.createdAt || nowIso).toISOString(),
    changefreq: 'daily',
    priority: '0.9',
  }));

  const allUrls = [...staticRoutes, ...categoryUrls, ...authorUrls, ...articleUrls];

  const entries = allUrls
    .map(
      (u) =>
        `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${escapeXml(u.lastmod)}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}
