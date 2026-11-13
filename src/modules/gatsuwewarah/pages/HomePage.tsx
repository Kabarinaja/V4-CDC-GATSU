import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useDocumentHead } from '../lib/useDocumentHead';
import { formatShortDate } from '../lib/seo';
import type { Advertisement, Article, Category, PortalSettings } from '../types';
import { AdSlot } from '../components/AdSlot';
import { ArticleCard } from '../components/ArticleCard';
import { BreakingNewsBar } from '../components/BreakingNewsBar';
import { EditorialHomeSkeleton } from '../components/EditorialSkeleton';

interface HomePageProps {
  articles: Article[];
  categories: Category[];
  ads: Advertisement[];
  settings: PortalSettings;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onClearSearch: () => void;
  isDemoMode: boolean;
  demoSuffix: string;
}

const ARTICLES_PER_PAGE = 8;

export const HomePage: React.FC<HomePageProps> = ({
  articles,
  categories,
  ads,
  settings,
  loading,
  error,
  searchQuery,
  onClearSearch,
  isDemoMode,
  demoSuffix,
}) => {
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);

  useDocumentHead({
    title: `${settings.siteName} — ${settings.tagline}`,
    description: `${settings.siteName}: ${settings.tagline}`,
    type: 'website',
  });

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.categoryName.toLowerCase().includes(q) ||
        a.authorName.toLowerCase().includes(q)
    );
  }, [articles, searchQuery]);

  const breakingArticles = useMemo(
    () => articles.filter((a) => a.isBreaking).slice(0, 6),
    [articles]
  );

  const headlinePool = useMemo(() => {
    const flagged = filteredArticles.filter((a) => a.isHeadline);
    return flagged.length > 0 ? flagged : filteredArticles;
  }, [filteredArticles]);

  const leadArticle = headlinePool[0];
  const secondaryHeadlines = useMemo(() => {
    if (!leadArticle) return [];
    const flaggedRest = headlinePool.slice(1, 3);
    if (flaggedRest.length >= 2) return flaggedRest;
    const usedIds = new Set([leadArticle.id, ...flaggedRest.map((a) => a.id)]);
    const backfill = filteredArticles
      .filter((a) => !usedIds.has(a.id))
      .slice(0, 2 - flaggedRest.length);
    return [...flaggedRest, ...backfill];
  }, [headlinePool, leadArticle, filteredArticles]);

  const editorPicks = useMemo(() => {
    const picked = articles.filter((a) => a.isEditorPick);
    return (picked.length > 0 ? picked : articles).slice(0, 4);
  }, [articles]);

  const popularArticles = useMemo(
    () => [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
    [articles]
  );

  const latestFeed = useMemo(() => {
    const headlineIds = new Set(
      [leadArticle, ...secondaryHeadlines].filter(Boolean).map((a) => a!.id)
    );
    const remaining = filteredArticles.filter((a) => !headlineIds.has(a.id));
    return remaining.length > 0 ? remaining : filteredArticles;
  }, [filteredArticles, leadArticle, secondaryHeadlines]);

  const categorySpotlights = useMemo(() => {
    return categories
      .map((cat) => ({
        category: cat,
        items: articles
          .filter((a) => a.categoryId === cat.id || a.categorySlug === cat.slug)
          .slice(0, 3),
      }))
      .filter((group) => group.items.length > 0)
      .slice(0, 3);
  }, [categories, articles]);

  if (loading) {
    return <EditorialHomeSkeleton />;
  }

  return (
    <div>
      {!searchQuery && (
        <BreakingNewsBar
          articles={breakingArticles}
          label={settings.breakingLabel}
          demoSuffix={demoSuffix}
        />
      )}

      {/* Optional Transient Preview Banner when ?demo=1 is active */}
      {isDemoMode && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
            <span>
              Mode Pratinjau Tata Letak Redaksi aktif (data sementara, tidak tersimpan di Firestore).
            </span>
            <Link
              to="/gatsuwewarah"
              className="font-semibold underline hover:text-red-700 whitespace-nowrap"
            >
              Keluar dari Pratinjau
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Top Home Advertisement */}
        <AdSlot ads={ads} position="home_top" />

        {/* Search Filter Header */}
        {searchQuery.trim() && (
          <div className="mb-8 pb-4 border-b border-stone-200 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-1">
                Hasil Pencarian
              </p>
              <h1 className="font-serif text-2xl font-bold text-neutral-950">
                &ldquo;{searchQuery}&rdquo; ({filteredArticles.length} berita)
              </h1>
            </div>
            <button
              type="button"
              onClick={onClearSearch}
              className="px-3 py-1.5 text-xs font-semibold border border-stone-300 hover:bg-stone-100 whitespace-nowrap"
            >
              Hapus Filter
            </button>
          </div>
        )}

        {/* Empty / Firestore Permission Setup State */}
        {articles.length === 0 && (
          <section className="my-10 border border-stone-200 bg-white p-8 sm:p-12 max-w-2xl mx-auto text-center">
            <BookOpen className="w-9 h-9 mx-auto text-stone-400 stroke-[1.5] mb-4" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950 mb-3">
              Portal Berita GATSU WEWARAH Siap Diterbitkan
            </h1>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-6">
              {error
                ? 'Koneksi database redaksi membutuhkan penerapan Firestore Security Rules terlebih dahulu atau belum memiliki artikel terbit.'
                : 'Belum ada berita berstatus terbit di Firestore. Masuk ke Meja Redaksi untuk menulis artikel pertama atau inisialisasi kanal berita.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/gatsuwewarah/admin"
                className="px-5 py-2.5 text-xs font-semibold bg-neutral-950 text-white hover:bg-neutral-800 transition-colors"
              >
                Masuk ke Meja Redaksi
              </Link>
              <Link
                to="/gatsuwewarah?demo=1"
                className="px-5 py-2.5 text-xs font-semibold border border-stone-300 text-neutral-800 hover:bg-stone-50 transition-colors"
              >
                Lihat Pratinjau Tata Letak
              </Link>
            </div>
          </section>
        )}

        {/* Main Editorial Front-Page Layout */}
        {articles.length > 0 && filteredArticles.length === 0 && (
          <div className="py-14 text-center border border-stone-200 bg-white">
            <p className="font-serif text-xl font-bold text-neutral-900 mb-2">
              Berita tidak ditemukan
            </p>
            <p className="text-sm text-stone-600 mb-5">
              Tidak ada artikel yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={onClearSearch}
              className="px-4 py-2 text-xs font-semibold bg-neutral-950 text-white"
            >
              Tampilkan Semua Berita
            </button>
          </div>
        )}

        {leadArticle && (
          <>
            {/* Tier 1: Lead Story + Secondary Headlines */}
            <section
              aria-label="Berita Utama"
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b border-stone-300"
            >
              <div className="lg:col-span-8">
                <ArticleCard
                  article={leadArticle}
                  variant="lead"
                  demoSuffix={demoSuffix}
                />
              </div>

              <div className="lg:col-span-4 lg:border-l lg:border-stone-200 lg:pl-7 space-y-6">
                <div className="border-b-2 border-neutral-950 pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-950">
                    Sorotan Utama
                  </h2>
                </div>
                {secondaryHeadlines.length > 0 ? (
                  secondaryHeadlines.map((item) => (
                    <ArticleCard
                      key={item.id}
                      article={item}
                      variant="featured"
                      demoSuffix={demoSuffix}
                    />
                  ))
                ) : (
                  <p className="text-sm text-stone-500">
                    Tambahkan berita utama lainnya melalui panel admin untuk mengisi kolom sorotan.
                  </p>
                )}
              </div>
            </section>

            {/* Tier 2: Berita Terbaru + Sidebar (Terpopuler & Pilihan Redaksi) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 py-10">
              <div className="lg:col-span-8">
                <div className="flex items-center justify-between border-b-2 border-neutral-950 pb-2.5 mb-2">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-950">
                    Berita Terbaru
                  </h2>
                  <span className="text-xs text-stone-500 tabular-nums">
                    {latestFeed.length} artikel
                  </span>
                </div>

                <div>
                  {latestFeed.slice(0, visibleCount).map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="compact"
                      demoSuffix={demoSuffix}
                    />
                  ))}
                </div>

                {visibleCount < latestFeed.length && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((prev) => prev + ARTICLES_PER_PAGE)
                      }
                      className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider border border-neutral-950 text-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors"
                    >
                      Muat Lebih Banyak
                    </button>
                  </div>
                )}

                {/* Mid-Home Ad Placement */}
                <AdSlot ads={ads} position="home_mid" />
              </div>

              {/* Editorial Sidebar */}
              <aside className="lg:col-span-4 space-y-10">
                {/* Berita Terpopuler */}
                <div>
                  <div className="border-b-2 border-red-700 pb-2 mb-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-950">
                      Terpopuler
                    </h2>
                  </div>
                  <ol className="divide-y divide-stone-200">
                    {popularArticles.map((item, idx) => (
                      <li key={item.id} className="py-3.5 flex items-start gap-3.5">
                        <span className="font-serif text-2xl font-bold text-stone-300 tabular-nums leading-none pt-0.5 shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <Link
                            to={`/gatsuwewarah/kategori/${item.categorySlug}${demoSuffix}`}
                            className="text-[11px] font-semibold uppercase tracking-wider text-red-700 hover:underline"
                          >
                            {item.categoryName}
                          </Link>
                          <h3 className="font-serif text-[15px] font-bold leading-snug text-neutral-950 mt-0.5">
                            <Link
                              to={`/gatsuwewarah/berita/${item.slug}${demoSuffix}`}
                              className="hover:text-red-700 transition-colors"
                            >
                              {item.title}
                            </Link>
                          </h3>
                          <span className="text-[11px] text-stone-500 tabular-nums mt-1 block">
                            {(item.views || 0).toLocaleString('id-ID')} dibaca
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Sidebar Ad */}
                <AdSlot ads={ads} position="sidebar" />

                {/* Pilihan Editor */}
                <div>
                  <div className="border-b-2 border-neutral-950 pb-2 mb-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-950">
                      Pilihan Editor
                    </h2>
                  </div>
                  <div className="space-y-4 divide-y divide-stone-200">
                    {editorPicks.map((item) => (
                      <div key={item.id} className="pt-4 first:pt-0">
                        <div className="text-[11px] text-stone-500 mb-1 flex items-center gap-1.5">
                          <span className="font-semibold text-neutral-800">
                            {item.categoryName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <time className="tabular-nums">
                            {formatShortDate(item.publishedAt)}
                          </time>
                        </div>
                        <h3 className="font-serif text-base font-bold leading-snug text-neutral-950">
                          <Link
                            to={`/gatsuwewarah/berita/${item.slug}${demoSuffix}`}
                            className="hover:text-red-700 transition-colors"
                          >
                            {item.title}
                          </Link>
                        </h3>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </section>

            {/* Tier 3: Category Spotlights */}
            {categorySpotlights.length > 0 && (
              <section
                aria-label="Berita Berdasarkan Kategori"
                className="border-t border-stone-300 pt-10 space-y-10"
              >
                {categorySpotlights.map(({ category, items }) => (
                  <div key={category.id}>
                    <div className="flex items-center justify-between border-b-2 border-neutral-950 pb-2 mb-6">
                      <h2 className="font-serif text-xl font-bold text-neutral-950">
                        {category.name}
                      </h2>
                      <Link
                        to={`/gatsuwewarah/kategori/${category.slug}${demoSuffix}`}
                        className="text-xs font-semibold text-red-700 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        Lihat semua <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {items.map((art) => (
                        <ArticleCard
                          key={art.id}
                          article={art}
                          variant="grid"
                          demoSuffix={demoSuffix}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
