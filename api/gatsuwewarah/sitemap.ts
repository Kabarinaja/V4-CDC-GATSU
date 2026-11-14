import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  fetchAuthorsRest,
  fetchCategoriesRest,
  fetchPublishedArticlesRest,
} from './_firestoreRest';

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  send: (body: string) => void;
}

interface SitemapItem {
  id?: string;
  slug?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeDate(value?: string, fallback?: string): string {
  const date = value ? new Date(value) : new Date(fallback || Date.now());
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

function generateSitemapXml(params: {
  baseUrl: string;
  articles: SitemapItem[];
  categories: SitemapItem[];
  authors: SitemapItem[];
}): string {
  const base = params.baseUrl.replace(/\/+$/, '');
  const now = new Date().toISOString();

  const urls: Array<{
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: string;
  }> = [
    {
      loc: `${base}/gatsuwewarah`,
      lastmod: now,
      changefreq: 'hourly',
      priority: '1.0',
    },
    {
      loc: `${base}/gatsuwewarah/tentang-redaksi`,
      lastmod: now,
      changefreq: 'monthly',
      priority: '0.5',
    },
    {
      loc: `${base}/gatsuwewarah/kontak-redaksi`,
      lastmod: now,
      changefreq: 'monthly',
      priority: '0.5',
    },
    {
      loc: `${base}/gatsuwewarah/kebijakan-privasi`,
      lastmod: now,
      changefreq: 'yearly',
      priority: '0.4',
    },
    {
      loc: `${base}/gatsuwewarah/pedoman-media-siber`,
      lastmod: now,
      changefreq: 'yearly',
      priority: '0.4',
    },
  ];

  for (const category of params.categories) {
    if (!category.slug?.trim()) continue;

    urls.push({
      loc: `${base}/gatsuwewarah/kategori/${encodeURIComponent(category.slug)}`,
      lastmod: safeDate(category.createdAt, now),
      changefreq: 'daily',
      priority: '0.8',
    });
  }

  for (const author of params.authors) {
    if (!author.id?.trim()) continue;

    urls.push({
      loc: `${base}/gatsuwewarah/penulis/${encodeURIComponent(author.id)}`,
      lastmod: safeDate(author.createdAt, now),
      changefreq: 'weekly',
      priority: '0.6',
    });
  }

  for (const article of params.articles) {
    if (article.status !== 'published' || !article.slug?.trim()) continue;

    urls.push({
      loc: `${base}/gatsuwewarah/berita/${encodeURIComponent(article.slug)}`,
      lastmod: safeDate(
        article.updatedAt || article.publishedAt || article.createdAt,
        now
      ),
      changefreq: 'daily',
      priority: '0.9',
    });
  }

  const entries = urls
    .map(
      (item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${escapeXml(item.lastmod)}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

export default async function handler(
  req: IncomingMessage,
  res: VercelResponse
) {
  try {
    const host =
      req.headers['x-forwarded-host'] ||
      req.headers.host ||
      'v4-cdc-gatsu.vercel.app';

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${Array.isArray(proto) ? proto[0] : proto}://${Array.isArray(host) ? host[0] : host}`;

    const [articles, categories, authors] = await Promise.all([
      fetchPublishedArticlesRest(),
      fetchCategoriesRest(),
      fetchAuthorsRest(),
    ]);

    const xml = generateSitemapXml({
      baseUrl,
      articles,
      categories,
      authors,
    });

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );

    res.status(200).send(xml);
  } catch (error) {
    console.error('[GATSU SITEMAP ERROR]', error);
    res.status(500).send('GATSU sitemap generation failed');
  }
}
