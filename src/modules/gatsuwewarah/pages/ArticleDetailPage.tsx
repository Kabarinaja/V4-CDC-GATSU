import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Copy, Share2 } from 'lucide-react';
import { sanitizeEditorialHtml } from '../lib/sanitize';
import {
  buildArticleMeta,
  formatIndonesianDate,
  splitHtmlAfterParagraphs,
} from '../lib/seo';
import { filterEligibleAds } from '../lib/ads';
import { useDocumentHead } from '../lib/useDocumentHead';
import {
  fetchArticleBySlug,
  incrementArticleViews,
} from '../services/firestoreService';
import type { Advertisement, Article } from '../types';
import { AdSlot } from '../components/AdSlot';
import { ArticleDetailSkeleton } from '../components/EditorialSkeleton';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface ArticleDetailPageProps {
  articles: Article[];
  ads: Advertisement[];
  isDemoMode: boolean;
  demoSuffix: string;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({
  articles,
  ads,
  isDemoMode,
  demoSuffix,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const loadArticle = async () => {
      setLoading(true);
      const fromList = articles.find((a) => a.slug === slug);
      if (fromList) {
        if (active) {
          setArticle(fromList);
          setLoading(false);
        }
        if (!isDemoMode) {
          void incrementArticleViews(fromList.id);
        }
        return;
      }

      if (slug && !isDemoMode) {
        try {
          const fetched = await fetchArticleBySlug(slug);
          if (active) {
            setArticle(fetched);
            setLoading(false);
          }
          if (fetched) {
            void incrementArticleViews(fetched.id);
          }
          return;
        } catch {
          // Handled below
        }
      }

      if (active) {
        setArticle(null);
        setLoading(false);
      }
    };

    void loadArticle();
    return () => {
      active = false;
    };
  }, [slug, articles, isDemoMode]);

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://www.dicelupayamcrispy.store';

  const meta = useMemo(
    () => (article ? buildArticleMeta(article, origin) : null),
    [article, origin]
  );

  useDocumentHead({
    title: meta?.title || 'Artikel — GATSU WEWARAH',
    description: meta?.description || 'Portal berita GATSU WEWARAH.',
    image: meta?.imageUrl,
    url: meta?.canonicalUrl,
    type: 'article',
    jsonLd: meta?.jsonLd,
  });

  const inContentAds = useMemo(() => {
    if (!article) return [];
    return filterEligibleAds(ads, {
      position: 'article_in_content',
      articleId: article.id,
      categoryId: article.categoryId,
    });
  }, [ads, article]);

  const sanitizedHtml = useMemo(
    () => (article ? sanitizeEditorialHtml(article.contentHtml) : ''),
    [article]
  );

  const splitContent = useMemo(() => {
    if (!sanitizedHtml) return { before: '', after: '', totalParagraphs: 0 };
    if (inContentAds.length === 0) {
      return { before: sanitizedHtml, after: '', totalParagraphs: 0 };
    }
    const targetParagraph = inContentAds[0].afterParagraph || 2;
    return splitHtmlAfterParagraphs(sanitizedHtml, targetParagraph);
  }, [sanitizedHtml, inContentAds]);

  const relatedArticles = useMemo(() => {
    if (!article) return [];
    return articles
      .filter(
        (a) =>
          a.id !== article.id &&
          (a.categorySlug === article.categorySlug ||
            a.categoryId === article.categoryId)
      )
      .slice(0, 4);
  }, [articles, article]);

  const popularArticles = useMemo(
    () =>
      [...articles]
        .filter((a) => a.id !== article?.id)
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5),
    [articles, article]
  );

  if (loading) {
    return <ArticleDetailSkeleton />;
  }

  if (!article) {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-neutral-950 mb-3">
          Berita Tidak Ditemukan
        </h1>
        <p className="text-sm text-stone-600 mb-6">
          Artikel yang Anda cari mungkin telah dipindahkan, belum diterbitkan, atau tautannya tidak tersedia.
        </p>
        <Link
          to={`/gatsuwewarah${demoSuffix}`}
          className="inline-block px-5 py-2.5 text-xs font-semibold bg-neutral-950 text-white hover:bg-neutral-800"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const shareUrl = meta?.canonicalUrl || window.location.href;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${article.title}\n\n${shareUrl}`
  )}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Editorial Article Column */}
        <article className="lg:col-span-8">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="text-xs text-stone-500 mb-4 flex items-center gap-2 flex-wrap"
          >
            <Link to={`/gatsuwewarah${demoSuffix}`} className="hover:text-neutral-950">
              Beranda
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              to={`/gatsuwewarah/kategori/${article.categorySlug}${demoSuffix}`}
              className="font-semibold text-red-700 hover:underline uppercase tracking-wider"
            >
              {article.categoryName}
            </Link>
          </nav>

          {/* Headline */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold leading-[1.16] text-neutral-950 text-balance mb-4">
            {article.title}
          </h1>

          {/* Article Summary / Deck */}
          {article.summary && (
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed mb-5">
              {article.summary}
            </p>
          )}

          {/* Author Byline Directly Below Summary (Clickable Photo 1:1 & Name) */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-stone-200 mb-6">
            <Link
              to={`/gatsuwewarah/penulis/${article.authorId}${demoSuffix}`}
              className="flex items-center gap-3 group"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden bg-stone-200 shrink-0 border border-stone-200">
                <ImageWithFallback
                  src={article.authorPhoto}
                  alt={article.authorName}
                  optimize={{ width: 160, height: 160, crop: 'fill', gravity: 'face' }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="block text-sm font-bold text-neutral-950 group-hover:text-red-700 transition-colors">
                  {article.authorName}
                </span>
                <div className="text-xs text-stone-500 flex items-center gap-2 flex-wrap tabular-nums">
                  <time dateTime={article.publishedAt}>
                    {formatIndonesianDate(article.publishedAt, true)}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>{article.readingTimeMinutes || 2} mnt baca</span>
                </div>
              </div>
            </Link>

            {/* Share Controls */}
            <div className="flex items-center gap-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-semibold border border-stone-300 text-neutral-800 hover:bg-stone-100 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" />
                Bagikan WhatsApp
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 text-xs font-semibold border border-stone-300 text-neutral-800 hover:bg-stone-100 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    Disalin
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Salin Tautan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Lead Cover Photo + Caption */}
          {article.coverImage && (
            <figure className="mb-7">
              <div className="overflow-hidden bg-stone-100">
                <ImageWithFallback
                  src={article.coverImage}
                  alt={article.coverCaption || article.title}
                  loading="eager"
                  optimize={{ width: 1200, crop: 'limit' }}
                  className="w-full aspect-[16/9] object-cover"
                />
              </div>
              {article.coverCaption && (
                <figcaption className="text-xs text-stone-500 italic mt-2 leading-relaxed">
                  {article.coverCaption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Article Prose Body + Paragraph-Based Ad Injection */}
          <div className="max-w-2xl">
            <div
              className="gatsu-prose"
              dangerouslySetInnerHTML={{ __html: splitContent.before }}
            />

            {inContentAds.length > 0 && splitContent.after && (
              <AdSlot
                ads={ads}
                position="article_in_content"
                articleId={article.id}
                categoryId={article.categoryId}
              />
            )}

            {splitContent.after && (
              <div
                className="gatsu-prose"
                dangerouslySetInnerHTML={{ __html: splitContent.after }}
              />
            )}

            {/* If article has fewer paragraphs than afterParagraph, show ad at end of prose */}
            {inContentAds.length > 0 && !splitContent.after && (
              <AdSlot
                ads={ads}
                position="article_in_content"
                articleId={article.id}
                categoryId={article.categoryId}
              />
            )}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 pt-5 border-t border-stone-200 flex items-center gap-2 flex-wrap text-xs">
              <span className="font-semibold uppercase tracking-wider text-stone-500 mr-1">
                Topik:
              </span>
              {article.tags.map((tag, idx) => (
                <span key={tag} className="text-neutral-700 font-medium">
                  {tag}
                  {idx < article.tags.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          )}

          {/* Bottom Article Ad */}
          <AdSlot
            ads={ads}
            position="article_bottom"
            articleId={article.id}
            categoryId={article.categoryId}
          />

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className="mt-10 pt-8 border-t border-stone-300">
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-950 mb-5">
                Berita Terkait di {article.categoryName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {relatedArticles.map((rel) => (
                  <article key={rel.id} className="group border-b border-stone-200 pb-4">
                    <Link
                      to={`/gatsuwewarah/berita/${rel.slug}${demoSuffix}`}
                      className="block overflow-hidden bg-stone-100 mb-2.5"
                    >
                      <ImageWithFallback
                        src={rel.coverImage}
                        alt={rel.title}
                        optimize={{ width: 560, height: 360, crop: 'fill' }}
                        className="w-full aspect-[16/10] object-cover"
                      />
                    </Link>
                    <h3 className="font-serif text-base font-bold leading-snug text-neutral-950">
                      <Link
                        to={`/gatsuwewarah/berita/${rel.slug}${demoSuffix}`}
                        className="hover:text-red-700 transition-colors"
                      >
                        {rel.title}
                      </Link>
                    </h3>
                  </article>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Right Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <AdSlot
            ads={ads}
            position="sidebar"
            articleId={article.id}
            categoryId={article.categoryId}
          />

          {popularArticles.length > 0 && (
            <div>
              <div className="border-b-2 border-red-700 pb-2 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-950">
                  Terpopuler
                </h2>
              </div>
              <ol className="divide-y divide-stone-200">
                {popularArticles.map((item, idx) => (
                  <li key={item.id} className="py-3 flex items-start gap-3">
                    <span className="font-serif text-xl font-bold text-stone-300 tabular-nums shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <Link
                        to={`/gatsuwewarah/kategori/${item.categorySlug}${demoSuffix}`}
                        className="text-[11px] font-semibold uppercase tracking-wider text-red-700 hover:underline"
                      >
                        {item.categoryName}
                      </Link>
                      <h3 className="font-serif text-sm font-bold leading-snug text-neutral-950 mt-0.5">
                        <Link
                          to={`/gatsuwewarah/berita/${item.slug}${demoSuffix}`}
                          className="hover:text-red-700 transition-colors"
                        >
                          {item.title}
                        </Link>
                      </h3>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
