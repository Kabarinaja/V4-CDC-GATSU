import React from 'react';
import { filterEligibleAds } from '../lib/ads';
import { incrementAdClicks } from '../services/firestoreService';
import type { AdPosition, Advertisement } from '../types';
import { ImageWithFallback } from './ImageWithFallback';

interface AdSlotProps {
  ads: Advertisement[];
  position: AdPosition;
  articleId?: string;
  categoryId?: string;
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  ads,
  position,
  articleId,
  categoryId,
  className = '',
}) => {
  const eligible = filterEligibleAds(ads, {
    position,
    articleId,
    categoryId,
  });

  if (eligible.length === 0) return null;

  const ad = eligible[0];

  return (
    <aside
      aria-label="Ruang Iklan"
      className={`my-6 border-y border-stone-200 py-4 bg-stone-50/70 ${className}`}
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-stone-500">
          IKLAN
        </span>
        <span className="text-[10px] text-stone-400 truncate max-w-[60%]">
          {ad.title}
        </span>
      </div>
      <a
        href={ad.targetUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => {
          void incrementAdClicks(ad.id);
        }}
        className="block overflow-hidden bg-white border border-stone-200 hover:opacity-95 transition-opacity"
      >
        <ImageWithFallback
          src={ad.imageUrl}
          alt={ad.title}
          optimize={{ width: 1000, crop: 'limit' }}
          className="w-full max-h-[260px] object-contain mx-auto bg-stone-100"
        />
      </a>
    </aside>
  );
};
