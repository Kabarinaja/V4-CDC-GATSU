import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Pencil, PenSquare, Trash2 } from 'lucide-react';
import { formatIndonesianDate } from '../../lib/seo';
import { useDocumentHead } from '../../lib/useDocumentHead';
import { deleteArticleAdmin } from '../../services/firestoreService';
import type { Article, ArticleStatus } from '../../types';

interface AdminArticlesPageProps {
  articles: Article[];
  filterStatus?: ArticleStatus | 'all';
  loading: boolean;
  onRefresh: () => Promise<void>;
}

const PAGE_SIZE = 15;

export const AdminArticlesPage: React.FC<AdminArticlesPageProps> = ({
  articles,
  filterStatus = 'all',
  loading,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const pageTitle =
    filterStatus === 'draft'
      ? 'Daftar Draft Berita'
      : filterStatus === 'scheduled'
        ? 'Berita Terjadwal'
        : 'Semua Berita';

  useDocumentHead({
    title: `${pageTitle} — Meja Redaksi GATSU WEWARAH`,
    description: `Kelola ${pageTitle.toLowerCase()} di portal GATSU WEWARAH.`,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.categoryName.toLowerCase().includes(q) ||
        a.authorName.toLowerCase().includes(q)
      );
    });
  }, [articles, filterStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleDelete = async (articleId: string) => {
    setBusyId(articleId);
    setFeedback(null);
    try {
      await deleteArticleAdmin(articleId);
      setConfirmDeleteId(null);
      await onRefresh();
      setFeedback('Artikel berhasil dihapus dari Firestore.');
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : 'Gagal menghapus artikel.'
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-300 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950">
            {pageTitle}
          </h1>
          <p className="text-sm text-stone-600 mt-1 tabular-nums">
            Menampilkan {filtered.length} artikel.
          </p>
        </div>

        <Link
          to="/gatsuwewarah/admin/tulis"
          className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-red-700 text-white hover:bg-red-800 inline-flex items-center gap-2 whitespace-nowrap"
        >
          <PenSquare className="w-3.5 h-3.5" />
          Tulis Berita
        </Link>
      </div>

      {feedback && (
        <div className="p-3 bg-white border border-stone-300 text-xs font-medium text-neutral-800">
          {feedback}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari judul, kategori, atau nama penulis..."
          className="w-full sm:w-80 px-3.5 py-2 text-sm bg-white border border-stone-300 focus:outline-none focus:border-neutral-950"
        />
      </div>

      <div className="bg-white border border-stone-300">
        {loading ? (
          <div className="p-8 text-sm text-stone-500">Memuat daftar artikel...</div>
        ) : paginated.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-stone-600">
              Tidak ada artikel pada daftar ini.
            </p>
            <Link
              to="/gatsuwewarah/admin/tulis"
              className="inline-block px-4 py-2 text-xs font-semibold bg-neutral-950 text-white"
            >
              Buat Berita Baru
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Artikel</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Penulis</th>
                  <th className="py-3 px-4">Status &amp; Jadwal</th>
                  <th className="py-3 px-4 text-right">Pembaca</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs">
                {paginated.map((art) => (
                  <tr key={art.id} className="hover:bg-stone-50">
                    <td className="py-3.5 px-4 max-w-sm">
                      <Link
                        to={`/gatsuwewarah/admin/edit/${art.id}`}
                        className="font-semibold text-neutral-950 hover:text-red-700 line-clamp-2"
                      >
                        {art.title}
                      </Link>
                      <span className="text-[11px] text-stone-400 font-mono block truncate mt-0.5">
                        /berita/{art.slug}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-700 whitespace-nowrap">
                      {art.categoryName}
                    </td>
                    <td className="py-3.5 px-4 text-stone-700 whitespace-nowrap">
                      {art.authorName}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold block ${
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
                      <span className="text-[11px] text-stone-500 tabular-nums">
                        {formatIndonesianDate(
                          art.status === 'scheduled'
                            ? art.scheduledAt || art.publishedAt
                            : art.publishedAt || art.updatedAt,
                          true
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-700">
                      {(art.views || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {confirmDeleteId === art.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busyId === art.id}
                            onClick={() => void handleDelete(art.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-red-700 text-white hover:bg-red-800"
                          >
                            {busyId === art.id ? 'Hapus...' : 'Konfirmasi'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-[11px] border border-stone-300 bg-white"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          {art.status === 'published' && (
                            <Link
                              to={`/gatsuwewarah/berita/${art.slug}`}
                              target="_blank"
                              aria-label={`Buka artikel ${art.title}`}
                              className="p-1.5 text-stone-500 hover:text-neutral-950"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          <Link
                            to={`/gatsuwewarah/admin/edit/${art.id}`}
                            aria-label={`Edit ${art.title}`}
                            className="p-1.5 text-stone-600 hover:text-neutral-950"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(art.id)}
                            aria-label={`Hapus ${art.title}`}
                            className="p-1.5 text-stone-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-stone-200 flex items-center justify-between text-xs">
            <span className="text-stone-500 tabular-nums">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-stone-300 bg-white disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border border-stone-300 bg-white disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
