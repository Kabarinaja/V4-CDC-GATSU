import { Product } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateMemberId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CDC-${result}`;
}

export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CDC${y}${m}${d}-${random}`;
}

export function toDateSafe(value: unknown): Date | null {
  if (!value) return null;

  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    date = (value as { toDate: () => Date }).toDate();
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  } else {
    return null;
  }

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateIndo(dateValue: unknown): string {
  const d = toDateSafe(dateValue);
  if (!d) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

// 1 poin = Rp100
export const POINT_VALUE_IN_RUPIAH = 100;
export const MIN_POINT_REDEEM = 10; // 10 poin = Rp1.000

export function pointsToRupiah(points: number): number {
  return Number.isFinite(points) && points > 0 ? points * POINT_VALUE_IN_RUPIAH : 0;
}

/**
 * Reward schedule. Explicit business examples are pinned here so every transaction
 * flow uses one calculation. The supplied examples are not described by one linear
 * rate (notably Rp32.000 => 4 points), so amounts between anchors use piecewise linear
 * interpolation rounded to the nearest 0.5 point. This is a provisional assumption;
 * please confirm the intended general formula before treating it as final business policy.
 */
const REWARD_ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [10000, 0.5], [12000, 1], [14000, 1.5], [16000, 2], [18000, 2.5], [32000, 4],
];
export function rupiahToPoints(rupiah: number): number {
  if (!Number.isFinite(rupiah) || rupiah <= 0) return 0;
  const exact = REWARD_ANCHORS.find(([amount]) => amount === rupiah);
  if (exact) return exact[1];
  if (rupiah < REWARD_ANCHORS[0][0]) return 0;
  let lower = REWARD_ANCHORS[0];
  for (const upper of REWARD_ANCHORS.slice(1)) {
    if (rupiah <= upper[0]) {
      const ratio = (rupiah - lower[0]) / (upper[0] - lower[0]);
      const interpolated = lower[1] + ratio * (upper[1] - lower[1]);
      return Math.round(interpolated * 2) / 2;
    }
    lower = upper;
  }
  const previous = REWARD_ANCHORS[REWARD_ANCHORS.length - 2];
  const slope = (lower[1] - previous[1]) / (lower[0] - previous[0]);
  return Math.max(0, Math.round((lower[1] + (rupiah - lower[0]) * slope) * 2) / 2);
}

export function parseNonNegativeAmount(raw: string, options: { allowFraction?: boolean } = {}): number | null {
  const value = raw.trim().replace(',', '.');
  if (!value || !/^(?:\d+)(?:\.\d+)?$/.test(value)) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  if (!options.allowFraction && !Number.isInteger(amount)) return null;
  if (options.allowFraction && Math.round(amount * 2) !== amount * 2) return null;
  return amount;
}

export function getJakartaDateKey(value: unknown = new Date()): string {
  const date = toDateSafe(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function isSameJakartaDay(value: unknown, now: Date = new Date()): boolean {
  return getJakartaDateKey(value) === getJakartaDateKey(now);
}

// Initial catalog products as required by user prompt
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'sadis',
    name: 'Sadis',
    description: 'Ayam krispi gurih dengan lumuran saus Sadis super pedas membakar lidah, favorit pecinta pedas sejati!',
    imageUrl: 'https://cdn.phototourl.com/member/2026-04-29-8fc4beda-99f1-4e51-b445-bf6b5355eca0.jpg',
    category: 'Saus Pedas',
    isActive: true,
    sortOrder: 1,
    badge: 'Best Seller Pedas',
    prices: {
      tanpaNasi: 12000,
      denganNasi: 16000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
  {
    id: 'mentai',
    name: 'Mentai',
    description: 'Ayam krispi diselimuti saus mentai lembut creamy bercita rasa gurih Jepang yang meleleh di mulut.',
    imageUrl: 'https://cdn.phototourl.com/member/2026-04-29-5f704978-969c-4d7a-9ad6-ee07a2af6efd.jpg',
    category: 'Creamy',
    isActive: true,
    sortOrder: 2,
    badge: 'Favorit Creamy',
    prices: {
      tanpaNasi: 14000,
      denganNasi: 18000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
  {
    id: 'lada-hitam',
    name: 'Lada Hitam',
    description: 'Sensasi bumbu lada hitam pekat yang harum aromatik dengan sentuhan pedas manis gurih mantap.',
    imageUrl: 'https://cdn.phototourl.com/member/2026-04-29-a4ef8163-80df-4d3a-af6c-a3e247cc50bb.jpg',
    category: 'Saus Gurih',
    isActive: true,
    sortOrder: 3,
    prices: {
      tanpaNasi: 12000,
      denganNasi: 16000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
  {
    id: 'keju',
    name: 'Keju',
    description: 'Ayam renyah berpadu saus keju cheddar kental yang creamy dan gurih lezat, disukai semua usia.',
    imageUrl: 'https://cdn.phototourl.com/member/2026-04-29-c94a7dc9-6a79-43d0-ae05-aa1db38547b9.jpg',
    category: 'Creamy Cheese',
    isActive: true,
    sortOrder: 4,
    badge: 'Kids Favorite',
    prices: {
      tanpaNasi: 12000,
      denganNasi: 16000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
  {
    id: 'geprek',
    name: 'Geprek',
    description: 'Ayam goreng crispy digeprek dengan sambal bawang segar ulek dadakan yang wangi dan pedas nendang.',
    imageUrl: 'https://cdn.phototourl.com/member/2026-04-29-586579ad-b883-4a11-8c85-f5d153856fb9.jpg',
    category: 'Sambal Tradisional',
    isActive: true,
    sortOrder: 5,
    prices: {
      tanpaNasi: 12000,
      denganNasi: 16000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
  {
    id: 'bbq',
    name: 'BBQ',
    description: 'Aroma smokey khas saus barbekyu dengan perpaduan rasa manis legit gurih yang meresap sempurna.',
    imageUrl: 'https://cdn.phototourl.com/member/2026-04-29-35095ad3-5964-456a-b25b-18a7143c4d8d.jpg',
    category: 'Smoky Sweet',
    isActive: true,
    sortOrder: 6,
    prices: {
      tanpaNasi: 12000,
      denganNasi: 16000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
  {
    id: 'ori',
    name: 'Ori (Tanpa Saus)',
    description: 'Ayam goreng krispi original dengan kulit renyah berempah dan daging yang juicy gurih alami.',
    imageUrl: 'https://cdn.phototourl.com/member/2026-07-15-951385c9-005c-4e97-8c0c-6ac713e698c5.jpg',
    category: 'Original Crispy',
    isActive: true,
    sortOrder: 7,
    prices: {
      tanpaNasi: 10000,
      denganNasi: 13000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
];


// Official current pricing requested by MY CDC GATSU.
// This keeps the customer-facing catalog correct even if older Firestore price data is still present.
export function applyOfficialPricing(product: Product): Product {
  const official = INITIAL_PRODUCTS.find((item) => item.id === product.id);
  if (!official) return product;
  return {
    ...product,
    prices: official.prices,
    extraOptions: official.extraOptions,
  };
}
