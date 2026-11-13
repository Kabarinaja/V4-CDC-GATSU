import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Article } from '../types';

interface BreakingNewsBarProps {
  articles: Article[];
  label?: string;
  demoSuffix?: string;
}

export const BreakingNewsBar: React.FC<BreakingNewsBarProps> = ({
  articles,
  label = 'TERKINI',
  demoSuffix = '',
}) => {
  const [index, setIndex] = useState(0);

  if (!articles.length) return null;

  const safeIndex = index % articles.length;
  const current = articles[safeIndex];

  return (
    <div className="bg-stone-100 border-b border-stone-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="bg-red-700 text-white text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 shrink-0">
            {label}
          </span>
          <Link
            to={`/gatsuwewarah/berita/${current.slug}${demoSuffix}`}
            className="text-xs sm:text-sm font-medium text-neutral-900 hover:text-red-700 transition-colors truncate"
          >
            {current.title}
          </Link>
        </div>

        {articles.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() =>
                setIndex((prev) => (prev - 1 + articles.length) % articles.length)
              }
              aria-label="Berita terkini sebelumnya"
              className="p-1.5 text-neutral-600 hover:text-neutral-950 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev + 1) % articles.length)}
              aria-label="Berita terkini berikutnya"
              className="p-1.5 text-neutral-600 hover:text-neutral-950 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
