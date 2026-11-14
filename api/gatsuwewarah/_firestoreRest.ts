import type { Article, Author, Category } from '../../src/modules/gatsuwewarah/types';

export const GATSU_FIREBASE_PROJECT_ID =
  process.env.GATSU_FIREBASE_PROJECT_ID ||
  process.env.VITE_GATSU_FIREBASE_PROJECT_ID ||
  'celupnewsxxxncom';

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
}

interface FirestoreDoc {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

function decodeValue(val?: FirestoreValue): unknown {
  if (!val) return undefined;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return Number(val.integerValue);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.arrayValue?.values) {
    return val.arrayValue.values.map((v) => decodeValue(v));
  }
  return undefined;
}

function docToPlainObject(doc: FirestoreDoc): Record<string, unknown> {
  const id = doc.name.split('/').pop() || '';
  const result: Record<string, unknown> = { id };
  if (doc.fields) {
    for (const [key, val] of Object.entries(doc.fields)) {
      result[key] = decodeValue(val);
    }
  }
  return result;
}

export async function fetchCollectionViaRest<T>(
  collectionName: string,
  pageSize = 200
): Promise<T[]> {
  const results: T[] = [];
  let pageToken = '';

  do {
    const tokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      GATSU_FIREBASE_PROJECT_ID
    )}/databases/(default)/documents/${encodeURIComponent(
      collectionName
    )}?pageSize=${pageSize}${tokenParam}`;

    const resp = await fetch(url);
    if (!resp.ok) {
      // Return gracefully if rules or network block anonymous REST listing
      break;
    }

    const json = (await resp.json()) as {
      documents?: FirestoreDoc[];
      nextPageToken?: string;
    };

    if (Array.isArray(json.documents)) {
      for (const d of json.documents) {
        results.push(docToPlainObject(d) as T);
      }
    }
    pageToken = json.nextPageToken || '';
  } while (pageToken);

  return results;
}

export async function fetchPublishedArticlesRest(): Promise<Article[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    GATSU_FIREBASE_PROJECT_ID
  )}/databases/(default)/documents:runQuery`;

  const body = {
    structuredQuery: {
      from: [{ collectionId: 'articles' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'status' },
          op: 'EQUAL',
          value: { stringValue: 'published' },
        },
      },
      limit: 500,
    },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(
      `Firestore published articles query failed (${resp.status}): ${detail}`
    );
  }

  const rows = (await resp.json()) as Array<{ document?: FirestoreDoc }>;

  return rows
    .filter((r) => Boolean(r.document))
    .map((r) => docToPlainObject(r.document!) as unknown as Article)
    .sort(
      (a, b) =>
        Date.parse(b.publishedAt || '') - Date.parse(a.publishedAt || '')
    );
}

export async function fetchPublishedArticleBySlugRest(
  slug: string
): Promise<Article | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    GATSU_FIREBASE_PROJECT_ID
  )}/databases/(default)/documents:runQuery`;

  const body = {
    structuredQuery: {
      from: [{ collectionId: 'articles' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'slug' },
                op: 'EQUAL',
                value: { stringValue: slug },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: 'status' },
                op: 'EQUAL',
                value: { stringValue: 'published' },
              },
            },
          ],
        },
      },
      limit: 1,
    },
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) return null;

    const rows = (await resp.json()) as Array<{ document?: FirestoreDoc }>;
    const first = rows.find((r) => Boolean(r.document));
    return first?.document
      ? (docToPlainObject(first.document) as unknown as Article)
      : null;
  } catch {
    return null;
  }
}

export async function fetchCategoriesRest(): Promise<Category[]> {
  return fetchCollectionViaRest<Category>('categories', 100);
}

export async function fetchAuthorsRest(): Promise<Author[]> {
  return fetchCollectionViaRest<Author>('authors', 200);
}
