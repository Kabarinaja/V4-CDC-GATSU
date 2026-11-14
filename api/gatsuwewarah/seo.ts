import type { IncomingMessage, ServerResponse } from 'node:http';
import { fetchPublishedArticleBySlugRest } from './_firestoreRest.js';

interface VercelRequest extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
}

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  send: (body: string) => void;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentHtml: string;
  coverImage: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  status: 'draft' | 'published' | 'scheduled';
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

function escapeHtmlAttr(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function optimizeCloudinaryUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    gravity?: string;
    quality?: string;
  } = {}
): string {
  if (!url) return '';

  if (
    !url.includes('res.cloudinary.com') ||
    !url.includes('/image/upload/')
  ) {
    return url;
  }

  const transforms = [
    'f_auto',
    `q_${options.quality || 'auto:good'}`,
  ];

  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop) transforms.push(`c_${options.crop}`);
  if (options.gravity) transforms.push(`g_${options.gravity}`);

  const marker = '/image/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const prefix = url.slice(0, idx + marker.length);
  const rest = url.slice(idx + marker.length);

  if (/^[a-z]_[^/]+/.test(rest) && !rest.startsWith('v')) {
    return url;
  }

  return `${prefix}${transforms.join(',')}/${rest}`;
}

function stripHtml(html: string): string {
  return String(html || '')
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

function buildArticleMeta(article: Article, originBaseUrl: string) {
  const cleanBase = originBaseUrl.replace(/\/+$/, '');

  const canonicalUrl =
    `${cleanBase}/gatsuwewarah/berita/${encodeURIComponent(article.slug)}`;

  const rawSummary =
    article.summary?.trim() ||
    stripHtml(article.contentHtml).slice(0, 160);

  const description =
    rawSummary.length > 160
      ? `${rawSummary.slice(0, 157)}...`
      : rawSummary;

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
    dateModified:
      article.updatedAt || article.publishedAt || article.createdAt,
    author: {
      '@type': 'Person',
      name: article.authorName || 'Redaksi GATSU WEWARAH',
      url:
        `${cleanBase}/gatsuwewarah/penulis/${encodeURIComponent(article.authorId)}`,
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
    modifiedTime:
      article.updatedAt || article.publishedAt || article.createdAt,
    authorName: article.authorName,
    sectionName: article.categoryName,
    jsonLd,
  };
}

export function renderArticleOgHtml(params: {
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  sectionName?: string;
  jsonLd?: Record<string, unknown>;
}): string {
  const t = escapeHtmlAttr(params.title);
  const d = escapeHtmlAttr(params.description);
  const img = escapeHtmlAttr(params.imageUrl);
  const url = escapeHtmlAttr(params.canonicalUrl);
  const author = escapeHtmlAttr(
    params.authorName || 'Redaksi GATSU WEWARAH'
  );
  const section = escapeHtmlAttr(params.sectionName || 'Berita');

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${url}" />

    <meta property="og:site_name" content="GATSU WEWARAH" />
    <meta property="og:locale" content="id_ID" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:secure_url" content="${img}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="article:author" content="${author}" />
    <meta property="article:section" content="${section}" />
    ${params.publishedTime ? `<meta property="article:published_time" content="${escapeHtmlAttr(params.publishedTime)}" />` : ''}
    ${params.modifiedTime ? `<meta property="article:modified_time" content="${escapeHtmlAttr(params.modifiedTime)}" />` : ''}

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />

    ${params.jsonLd ? `<script type="application/ld+json">${JSON.stringify(params.jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
  </head>
  <body>
    <main>
      <article>
        <h1>${t}</h1>
        <p>${d}</p>
        ${img ? `<img src="${img}" alt="${t}" />` : ''}
        <p><a href="${url}">Baca berita selengkapnya di GATSU WEWARAH</a></p>
      </article>
    </main>
  </body>
</html>`;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const host =
    req.headers['x-forwarded-host'] ||
    req.headers.host ||
    'www.dicelupayamcrispy.store';

  const proto = req.headers['x-forwarded-proto'] || 'https';

  const originBase =
    `${proto}://${Array.isArray(host) ? host[0] : host}`;

  const rawSlug = req.query?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug || '';

  if (!slug) {
    const html = renderArticleOgHtml({
      title: 'GATSU WEWARAH — Informasi, Inspirasi, dan Kabar Terkini',
      description: 'Portal berita editorial GATSU WEWARAH.',
      imageUrl: `${originBase}/gatsuwewarah/logo-header.png`,
      canonicalUrl: `${originBase}/gatsuwewarah`,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
    return;
  }

  const article = await fetchPublishedArticleBySlugRest(slug);

  if (!article) {
    const fallbackUrl =
      `${originBase}/gatsuwewarah/berita/${encodeURIComponent(slug)}`;

    const html = renderArticleOgHtml({
      title: 'GATSU WEWARAH — Kabar Terkini',
      description: 'Informasi, Inspirasi, dan Kabar Terkini.',
      imageUrl: `${originBase}/gatsuwewarah/logo-header.png`,
      canonicalUrl: fallbackUrl,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
    return;
  }

  const meta = buildArticleMeta(article as Article, originBase);

  const ogImage = article.coverImage?.trim()
    ? optimizeCloudinaryUrl(article.coverImage.trim(), {
        width: 1200,
        height: 630,
        crop: 'fill',
        gravity: 'auto',
      })
    : meta.imageUrl;

  const html = renderArticleOgHtml({
    title: meta.title,
    description: meta.description,
    imageUrl: ogImage,
    canonicalUrl: meta.canonicalUrl,
    publishedTime: meta.publishedTime,
    modifiedTime: meta.modifiedTime,
    authorName: meta.authorName,
    sectionName: meta.sectionName,
    jsonLd: meta.jsonLd,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=300, stale-while-revalidate=600'
  );
  res.status(200).send(html);
}
