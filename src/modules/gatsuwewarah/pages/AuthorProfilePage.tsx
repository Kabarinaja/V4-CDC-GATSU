import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDocumentHead } from '../lib/useDocumentHead';
import { fetchAuthorById } from '../services/firestoreService';
import type { Article, Author } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface AuthorProfilePageProps {
  articles: Article[];
  authors: Author[];
  isDemoMode: boolean;
  demoSuffix: string;
}

export const AuthorProfilePage: React.FC<AuthorProfilePageProps> = ({
  articles,
  authors,
  isDemoMode,
  demoSuffix,
}) => {
  const { authorId } = useParams<{ authorId: string }>();
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadAuthor = async () => {
      setLoading(true);
      const fromList = authors.find((a) => a.id === authorId);
      if (fromList) {
        if (active) {
          setAuthor(fromList);
          setLoading(false);
        }
        return;
      }

      if (authorId && !isDemoMode) {
        try {
          const fetched = await fetchAuthorById(authorId);
          if (active) {
            setAuthor(fetched);
            setLoading(false);
          }
          return;
        } catch {
          // Handled below
        }
      }

      if (active) {
        setAuthor(null);
        setLoading(false);
      }
    };
    void loadAuthor();
    return () => {
      active = false;
    };
  }, [authorId, authors, isDemoMode]);

  const authorArticles = useMemo(
    () => articles.filter((a) => a.authorId === authorId),
    [articles, authorId]
  );

  useDocumentHead({
    title: author
      ? `${author.name} — Penulis GATSU WEWARAH`
      : 'Profil Penulis — GATSU WEWARAH',
    description:
      author?.bio || 'Profil jurnalis dan daftar karya tulis di GATSU WEWARAH.',
    image: author?.photoUrl,
    type: 'profile',
  });

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10 animate-pulse space-y-6">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-stone-200" />
          <div className="space-y-3">
            <div className="h-7 w-48 bg-stone-200" />
            <div className="h-4 w-72 bg-stone-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-neutral-950 mb-3">
          Profil Penulis Tidak Ditemukan
        </h1>
        <p className="text-sm text-stone-600 mb-6">
          Data penulis tidak tersedia atau telah dihapus oleh redaksi.
        </p>
        <Link
          to={`/gatsuwewarah${demoSuffix}`}
          className="inline-block px-5 py-2.5 text-xs font-semibold bg-neutral-950 text-white"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-8">
      <section className="border-b-2 border-neutral-950 pb-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-stone-100 border border-stone-300 shrink-0">
          <ImageWithFallback
            src={author.photoUrl}
            alt={author.name}
            optimize={{ width: 280, height: 280, crop: 'fill', gravity: 'face' }}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-red-700 mb-1">
            {author.role || 'Jurnalis Redaksi'}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950 mb-2">
            {author.name}
          </h1>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl mb-3">
            {author.bio || 'Kontributor berita resmi redaksi GATSU WEWARAH.'}
          </p>
          <p className="text-xs text-stone-500 tabular-nums">
            ID Penulis: <span className="font-mono text-neutral-700">{author.id}</span> ·{' '}
            <span className="font-semibold text-neutral-900">
              {authorArticles.length} artikel terbit
            </span>
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-950 mb-6">
          Karya Tulis oleh {author.name}
        </h2>

        {authorArticles.length === 0 ? (
          <p className="text-sm text-stone-500 py-10 border border-stone-200 text-center bg-white">
            Belum ada artikel terbit dari penulis ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {authorArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="grid"
                demoSuffix={demoSuffix}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
