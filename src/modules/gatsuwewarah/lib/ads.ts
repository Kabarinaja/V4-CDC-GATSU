import type { AdPosition, Advertisement } from '../types';

export function validateAdUrl(rawUrl: string): {
  valid: boolean;
  normalized?: string;
  reason?: string;
} {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, reason: 'URL tujuan iklan wajib diisi.' };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        reason: 'URL tujuan hanya diperbolehkan menggunakan protokol http:// atau https://.',
      };
    }
    return { valid: true, normalized: parsed.toString() };
  } catch {
    return { valid: false, reason: 'Format URL tujuan tidak valid (contoh: https://example.com).' };
  }
}

export function computeAdEndDate(startDateStr: string, durationDays: number): string {
  const safeDays = Math.max(1, Math.floor(durationDays || 1));
  const start = new Date(startDateStr);
  if (Number.isNaN(start.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + safeDays);
    fallback.setHours(23, 59, 59, 999);
    return fallback.toISOString();
  }
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + safeDays);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

export function isAdActiveNow(ad: Advertisement, now: Date = new Date()): boolean {
  if (!ad.active) return false;
  if (!ad.imageUrl?.trim()) return false;

  const urlCheck = validateAdUrl(ad.targetUrl);
  if (!urlCheck.valid) return false;

  const start = new Date(ad.startDate);
  if (Number.isNaN(start.getTime())) return false;
  start.setHours(0, 0, 0, 0);

  const end = ad.endDate
    ? new Date(ad.endDate)
    : new Date(computeAdEndDate(ad.startDate, ad.durationDays));
  if (Number.isNaN(end.getTime())) return false;

  return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
}

export function getRemainingAdDays(ad: Advertisement, now: Date = new Date()): number {
  const end = ad.endDate
    ? new Date(ad.endDate)
    : new Date(computeAdEndDate(ad.startDate, ad.durationDays));
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function filterEligibleAds(
  ads: Advertisement[],
  context: {
    position: AdPosition;
    articleId?: string;
    categoryId?: string;
    now?: Date;
  }
): Advertisement[] {
  const now = context.now ?? new Date();

  return ads.filter((ad) => {
    if (ad.position !== context.position) return false;
    if (!isAdActiveNow(ad, now)) return false;

    if (ad.targetScope === 'all') return true;

    if (ad.targetScope === 'categories') {
      if (!context.categoryId) return false;
      return ad.targetCategoryIds.includes(context.categoryId);
    }

    if (ad.targetScope === 'articles') {
      if (!context.articleId) return false;
      return ad.targetArticleIds.includes(context.articleId);
    }

    return false;
  });
}
