import React from 'react';
import { Link } from 'react-router-dom';
import { formatShortDate } from '../lib/seo';
import type { Article } from '../types';
import { ImageWithFallback } from './ImageWithFallback';

interface ArticleCardProps {
  article: Article;
  variant?: 'lead' | 'featured' | 'grid' | 'compact';
  demoSuffix?: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  variant = 'grid',
  demoSuffix = '',
}) => {
  const articleUrl = `/gatsuwewarah/berita/${article.slug}${demoSuffix}`;
  const categoryUrl = `/gatsuwewarah/kategori/${article.categorySlug}${demoSuffix}`;

  if (variant === 'lead') {
    return (
      <article className="group border-b border-stone-200 pb-7">
        <Link to={articleUrl} className="block overflow-hidden bg-stone-100 mb-4">
          <ImageWithFallback
            src={article.coverImage}
            alt={article.title}
            loading="eager"
            optimize={{ width: 1200, height: 675, crop: 'fill' }}
            className="w-full aspect-[16/9] object-cover transition-transform duration-300 group-hover:scale-[1.015]"
          />
        </Link>

        <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
          <Link
            to={categoryUrl}
            className="font-semibold text-red-700 hover:underline uppercase tracking-wider"
          >
            {article.categoryName}
          </Link>
          <span aria-hidden="true">·</span>
          <time dateTime={article.publishedAt} className="tabular-nums">
            {formatShortDate(article.publishedAt)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{article.readingTimeMinutes || 2} mnt baca</span>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-bold leading-[1.18] text-neutral-950 text-balance mb-3">
          <Link to={articleUrl} className="hover:text-red-700 transition-colors">
            {article.title}
          </Link>
        </h2>

        <p className="text-sm sm:text-base text-stone-600 leading-relaxed line-clamp-3 mb-3">
          {article.summary}
        </p>

        <div className="text-xs text-stone-500">
          Oleh{' '}
          <Link
            to={`/gatsuwewarah/penulis/${article.authorId}${demoSuffix}`}
            className="font-semibold text-neutral-800 hover:text-red-700"
          >
            {article.authorName}
          </Link>
        </div>
      </article>
    );
  }

  if (variant === 'featured') {
    return (
      <article className="group border-b border-stone-200 pb-5 last:border-b-0 last:pb-0">
        <Link to={articleUrl} className="block overflow-hidden bg-stone-100 mb-3">
          <ImageWithFallback
            src={article.coverImage}
            alt={article.title}
            optimize={{ width: 640, height: 420, crop: 'fill' }}
            className="w-full aspect-[16/10] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-1.5">
          <Link
            to={categoryUrl}
            className="font-semibold text-red-700 hover:underline uppercase tracking-wider"
          >
            {article.categoryName}
          </Link>
          <span aria-hidden="true">·</span>
          <time dateTime={article.publishedAt} className="tabular-nums">
            {formatShortDate(article.publishedAt)}
          </time>
        </div>
        <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug text-neutral-950 text-balance">
          <Link to={articleUrl} className="hover:text-red-700 transition-colors">
            {article.title}
          </Link>
        </h3>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="group flex items-start gap-4 py-4 border-b border-stone-200 last:border-b-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1">
            <Link
              to={categoryUrl}
              className="font-semibold text-red-700 hover:underline uppercase tracking-wider"
            >
              {article.categoryName}
            </Link>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt} className="tabular-nums">
              {formatShortDate(article.publishedAt)}
            </time>
          </div>
          <h3 className="font-serif text-base sm:text-lg font-bold leading-snug text-neutral-950 line-clamp-3">
            <Link to={articleUrl} className="hover:text-red-700 transition-colors">
              {article.title}
            </Link>
          </h3>
          <p className="hidden sm:block text-xs text-stone-600 mt-1.5 line-clamp-2">
            {article.summary}
          </p>
        </div>

        <Link
          to={articleUrl}
          className="w-24 h-20 sm:w-32 sm:h-24 shrink-0 overflow-hidden bg-stone-100"
        >
          <ImageWithFallback
            src={article.coverImage}
            alt={article.title}
            optimize={{ width: 320, height: 240, crop: 'fill' }}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>
      </article>
    );
  }

  return (
    <article className="group flex flex-col border-b border-stone-200 pb-5">
      <Link to={articleUrl} className="block overflow-hidden bg-stone-100 mb-3">
        <ImageWithFallback
          src={article.coverImage}
          alt={article.title}
          optimize={{ width: 640, height: 480, crop: 'fill' }}
          className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </Link>
      <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1.5">
        <Link
          to={categoryUrl}
          className="font-semibold text-red-700 hover:underline uppercase tracking-wider"
        >
          {article.categoryName}
        </Link>
        <span aria-hidden="true">·</span>
        <time dateTime={article.publishedAt} className="tabular-nums">
          {formatShortDate(article.publishedAt)}
        </time>
      </div>
      <h3 className="font-serif text-lg font-bold leading-snug text-neutral-950 text-balance mb-2">
        <Link to={articleUrl} className="hover:text-red-700 transition-colors">
          {article.title}
        </Link>
      </h3>
      <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
        {article.summary}
      </p>
    </article>
  );
};
