import type { IncomingMessage, ServerResponse } from 'node:http';
import { optimizeCloudinaryUrl } from '../../src/modules/gatsuwewarah/lib/cloudinary.ts';
import { buildArticleMeta, escapeHtmlAttr } from '../../src/modules/gatsuwewarah/lib/seo.ts';
import { fetchPublishedArticleBySlugRest } from './_firestoreRest';

interface VercelRequest extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
}

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  send: (body: string) => void;
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
  const author = escapeHtmlAttr(params.authorName || 'Redaksi GATSU WEWARAH');
  const section = escapeHtmlAttr(params.sectionName || 'Berita');

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${url}" />

    <!-- Open Graph / WhatsApp / Facebook -->
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

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />

    ${params.jsonLd ? `<script type="application/ld+json">${JSON.stringify(params.jsonLd)}</script>` : ''}
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.dicelupayamcrispy.store';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const originBase = `${proto}://${Array.isArray(host) ? host[0] : host}`;

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
    const fallbackUrl = `${originBase}/gatsuwewarah/berita/${encodeURIComponent(slug)}`;
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

  const meta = buildArticleMeta(article, originBase);
  // Optimize Cloudinary hero image for WhatsApp 1200x630 summary card
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
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.status(200).send(html);
}
