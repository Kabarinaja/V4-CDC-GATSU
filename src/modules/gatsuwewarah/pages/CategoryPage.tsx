import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDocumentHead } from '../lib/useDocumentHead';
import type { Advertisement, Article, Category } from '../types';
import { AdSlot } from '../components/AdSlot';
import { ArticleCard } from '../components/ArticleCard';

interface CategoryPageProps {
  articles: Article[];
  categories: Category[];
  ads: Advertisement[];
  loading: boolean;
  demoSuffix: string;
}

const PAGE_SIZE = 9;

export const CategoryPage: React.FC<CategoryPageProps> = ({
  articles,
  categories,
  ads,
  loading,
  demoSuffix,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const category = useMemo(
    () => categories.find((c) => c.slug === slug),
    [categories, slug]
  );

  const categoryArticles = useMemo(
    () =>
      articles.filter(
        (a) => a.categorySlug === slug || (category && a.categoryId === category.id)
      ),
    [articles, slug, category]
  );

  const categoryName = category?.name || slug || 'Kategori';

  useDocumentHead({
    title: `${categoryName} — GATSU WEWARAH`,
    description:
      category?.description ||
      `Berita dan liputan terkini kanal ${categoryName} di GATSU WEWARAH.`,
  });

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-pulse space-y-6">
        <div className="h-8 w-56 bg-stone-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/3] bg-stone-200" />
              <div className="h-5 w-5/6 bg-stone-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8">
      <header className="border-b-2 border-neutral-950 pb-5 mb-8">
        <nav aria-label="Breadcrumb" className="text-xs text-stone-500 mb-2">
          <Link to={`/gatsuwewarah${demoSuffix}`} className="hover:text-neutral-950">
            Beranda
          </Link>{' '}
          / <span className="text-neutral-950 font-medium">{categoryName}</span>
        </nav>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950">
          {categoryName}
        </h1>
        {category?.description && (
          <p className="text-sm sm:text-base text-stone-600 mt-2 max-w-2xl">
            {category.description}
          </p>
        )}
      </header>

      <AdSlot
        ads={ads}
        position="home_top"
        categoryId={category?.id}
      />

      {categoryArticles.length === 0 ? (
        <div className="py-16 text-center border border-stone-200 bg-white">
          <p className="font-serif text-xl font-bold text-neutral-950 mb-2">
            Belum ada berita di kanal ini
          </p>
          <p className="text-sm text-stone-600 mb-5">
            Berita terbaru untuk kategori {categoryName} akan segera hadir.
          </p>
          <Link
            to={`/gatsuwewarah${demoSuffix}`}
            className="inline-block px-5 py-2 text-xs font-semibold bg-neutral-950 text-white"
          >
            Kembali ke Beranda
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {categoryArticles.slice(0, visibleCount).map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="grid"
                demoSuffix={demoSuffix}
              />
            ))}
          </div>

          {visibleCount < categoryArticles.length && (
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider border border-neutral-950 text-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors"
              >
                Tampilkan Lebih Banyak
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
