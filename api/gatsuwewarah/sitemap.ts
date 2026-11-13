import type { IncomingMessage, ServerResponse } from 'node:http';
import { generateSitemapXml } from '../../src/modules/gatsuwewarah/lib/seo';
import {
  fetchAuthorsRest,
  fetchCategoriesRest,
  fetchPublishedArticlesRest,
} from './_firestoreRest';

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  send: (body: string) => void;
}

export default async function handler(req: IncomingMessage, res: VercelResponse) {
  const host =
    req.headers['x-forwarded-host'] ||
    req.headers.host ||
    'www.dicelupayamcrispy.store';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${proto}://${Array.isArray(host) ? host[0] : host}`;

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
}
