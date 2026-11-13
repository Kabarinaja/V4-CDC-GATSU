import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, PenSquare } from 'lucide-react';
import { formatShortDate } from '../../lib/seo';
import { useDocumentHead } from '../../lib/useDocumentHead';
import {
  bootstrapInitialCategoriesAndSettings,
  computeDashboardStats,
} from '../../services/firestoreService';
import type {
  Advertisement,
  Article,
  Author,
  Category,
  DashboardStats,
} from '../../types';

interface AdminDashboardPageProps {
  articles: Article[];
  categories: Category[];
  authors: Author[];
  ads: Advertisement[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  articles,
  categories,
  authors,
  ads,
  loading,
  onRefresh,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [bootstrapMsg, setBootstrapMsg] = useState<string | null>(null);

  useDocumentHead({
    title: 'Statistik Redaksi — GATSU WEWARAH',
    description: 'Ringkasan statistik dan aktivitas redaksi GATSU WEWARAH.',
  });

  useEffect(() => {
    void computeDashboardStats(articles, categories, authors, ads).then(setStats);
  }, [articles, categories, authors, ads]);

  const handleBootstrap = async () => {
    setBootstrapping(true);
    setBootstrapMsg(null);
    try {
      await bootstrapInitialCategoriesAndSettings();
      await onRefresh();
      setBootstrapMsg(
        'Kanal kategori awal dan halaman informasi redaksi berhasil disimpan ke Firestore.'
      );
    } catch (err) {
      setBootstrapMsg(
        err instanceof Error
          ? err.message
          : 'Gagal menginisialisasi data awal.'
      );
    } finally {
      setBootstrapping(false);
    }
  };

  const statItems = [
    { label: 'Total Artikel', value: stats?.totalArticles ?? 0 },
    { label: 'Artikel Terbit', value: stats?.publishedCount ?? 0 },
    { label: 'Draft', value: stats?.draftCount ?? 0 },
    { label: 'Terjadwal', value: stats?.scheduledCount ?? 0 },
    { label: 'Total Pembacaan', value: stats?.totalViews ?? 0 },
    { label: 'Kategori Aktif', value: stats?.totalCategories ?? 0 },
    { label: 'Penulis Terdaftar', value: stats?.totalAuthors ?? 0 },
    { label: 'Iklan Aktif', value: stats?.activeAdsCount ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-300 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950">
            Dashboard Redaksi
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Ringkasan publikasi berita, penulis, dan penayangan iklan GATSU WEWARAH.
          </p>
        </div>

        <Link
          to="/gatsuwewarah/admin/tulis"
          className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-red-700 text-white hover:bg-red-800 inline-flex items-center gap-2 whitespace-nowrap"
        >
          <PenSquare className="w-3.5 h-3.5" />
          Tulis Berita Baru
        </Link>
      </div>

      {/* Bootstrap helper when categories are empty */}
      {!loading && categories.length === 0 && (
        <div className="bg-white border border-stone-300 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-sm font-bold text-neutral-950">
              Inisialisasi Kanal Kategori &amp; Pengaturan Awal
            </h2>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Belum ada kategori berita di Firestore. Anda dapat membuat 6 kanal standar (Nasional, Ekonomi &amp; UMKM, Kuliner, Teknologi, Gaya Hidup, Opini) sekaligus halaman redaksi dalam satu klik.
            </p>
          </div>
          <button
            type="button"
            disabled={bootstrapping}
            onClick={() => void handleBootstrap()}
            className="px-4 py-2 text-xs font-semibold bg-neutral-950 text-white hover:bg-neutral-800 inline-flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
          >
            <Database className="w-3.5 h-3.5" />
            {bootstrapping ? 'Menyimpan...' : 'Buat Kategori Awal'}
          </button>
        </div>
      )}

      {bootstrapMsg && (
        <div className="p-3.5 bg-white border border-stone-300 text-xs font-medium text-neutral-800">
          {bootstrapMsg}
        </div>
      )}

      {/* Editorial Stat Grid (Single-elevation, tabular figures) */}
      <section aria-label="Statistik Portal">
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-stone-300 bg-white">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="p-5 border-r border-b border-stone-300"
            >
              <p className="text-xs font-medium text-stone-500 mb-2">
                {item.label}
              </p>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-neutral-950 tabular-nums">
                {loading ? '—' : item.value.toLocaleString('id-ID')}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Articles Table */}
      <section className="bg-white border border-stone-300">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-950">
            Artikel Terbaru
          </h2>
          <Link
            to="/gatsuwewarah/admin/berita"
            className="text-xs font-semibold text-red-700 hover:underline"
          >
            Kelola Semua
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-stone-500">Memuat data berita...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-500">
            Belum ada berita tersimpan. Klik &ldquo;Tulis Berita Baru&rdquo; untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Judul</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Penulis</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Pembaca</th>
                  <th className="py-3 px-4 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs">
                {articles.slice(0, 8).map((art) => (
                  <tr key={art.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-semibold text-neutral-900 max-w-xs truncate">
                      <Link
                        to={`/gatsuwewarah/admin/edit/${art.id}`}
                        className="hover:text-red-700"
                      >
                        {art.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                      {art.categoryName}
                    </td>
                    <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                      {art.authorName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          art.status === 'published'
                            ? 'text-emerald-700'
                            : art.status === 'scheduled'
                              ? 'text-amber-700'
                              : 'text-stone-500'
                        }`}
                      >
                        {art.status === 'published'
                          ? 'Terbit'
                          : art.status === 'scheduled'
                            ? 'Terjadwal'
                            : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-700">
                      {(art.views || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-stone-500 whitespace-nowrap">
                      {formatShortDate(art.publishedAt || art.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
