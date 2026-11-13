import React, { useRef, useState } from 'react';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { getRemainingAdDays, isAdActiveNow } from '../../lib/ads';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import { useDocumentHead } from '../../lib/useDocumentHead';
import { deleteAdAdmin, saveAdAdmin } from '../../services/firestoreService';
import type {
  AdPosition,
  AdTargetScope,
  Advertisement,
  Article,
  Category,
} from '../../types';

interface AdminAdsPageProps {
  ads: Advertisement[];
  categories: Category[];
  articles: Article[];
  onRefresh: () => Promise<void>;
}

const POSITION_LABELS: Record<AdPosition, string> = {
  home_top: 'Beranda — Atas (Leaderboard)',
  home_mid: 'Beranda — Tengah Feed',
  article_in_content: 'Artikel — Di Dalam Paragraf',
  article_bottom: 'Artikel — Bawah Naskah',
  sidebar: 'Sidebar Portal',
};

export const AdminAdsPage: React.FC<AdminAdsPageProps> = ({
  ads,
  categories,
  articles,
  onRefresh,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [targetScope, setTargetScope] = useState<AdTargetScope>('all');
  const [targetCategoryIds, setTargetCategoryIds] = useState<string[]>([]);
  const [targetArticleIds, setTargetArticleIds] = useState<string[]>([]);
  const [position, setPosition] = useState<AdPosition>('article_in_content');
  const [afterParagraph, setAfterParagraph] = useState(2);
  const [startDate, setStartDate] = useState(todayStr);
  const [durationDays, setDurationDays] = useState(7);
  const [active, setActive] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useDocumentHead({
    title: 'Manajemen Iklan — Meja Redaksi GATSU WEWARAH',
    description: 'Kelola penayangan dan penjadwalan iklan GATSU WEWARAH.',
  });

  const resetForm = () => {
    setEditingId(undefined);
    setTitle('');
    setImageUrl('');
    setTargetUrl('');
    setTargetScope('all');
    setTargetCategoryIds([]);
    setTargetArticleIds([]);
    setPosition('article_in_content');
    setAfterParagraph(2);
    setStartDate(todayStr);
    setDurationDays(7);
    setActive(true);
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingId(ad.id);
    setTitle(ad.title);
    setImageUrl(ad.imageUrl);
    setTargetUrl(ad.targetUrl);
    setTargetScope(ad.targetScope);
    setTargetCategoryIds(ad.targetCategoryIds || []);
    setTargetArticleIds(ad.targetArticleIds || []);
    setPosition(ad.position);
    setAfterParagraph(ad.afterParagraph || 2);
    setStartDate(ad.startDate.slice(0, 10));
    setDurationDays(ad.durationDays || 7);
    setActive(ad.active);
    setMessage(null);
  };

  const handleUploadImage = async (file: File) => {
    setMessage(null);
    setUploading(true);
    try {
      const res = await uploadImageToCloudinary(file, 'ads');
      setImageUrl(res.secureUrl);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Gagal mengunggah banner iklan.'
      );
    } finally {
      setUploading(false);
    }
  };

  const toggleSelection = (
    list: string[],
    id: string,
    setter: (next: string[]) => void
  ) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      await saveAdAdmin({
        id: editingId,
        title,
        imageUrl,
        targetUrl,
        targetScope,
        targetCategoryIds: targetScope === 'categories' ? targetCategoryIds : [],
        targetArticleIds: targetScope === 'articles' ? targetArticleIds : [],
        position,
        afterParagraph,
        startDate,
        durationDays,
        active,
      });
      await onRefresh();
      resetForm();
      setMessage('Konfigurasi iklan berhasil disimpan.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal menyimpan iklan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setMessage(null);
    try {
      await deleteAdAdmin(id);
      setConfirmDeleteId(null);
      await onRefresh();
      setMessage('Iklan berhasil dihapus.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal menghapus iklan.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-300 pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950">
          Manajemen Iklan
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Atur materi banner, target halaman, posisi paragraf, dan durasi tayang (otomatis berhenti saat masa berlaku habis).
        </p>
      </div>

      {message && (
        <div className="p-3 bg-white border border-stone-300 text-xs font-medium text-neutral-800">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ad Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-stone-300 p-5 space-y-4 h-fit"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-950 border-b border-stone-200 pb-2">
            {editingId ? 'Sunting Kampanye Iklan' : 'Buat Iklan Baru'}
          </h2>

          <div>
            <label
              htmlFor="ad-title"
              className="block text-xs font-semibold text-neutral-700 mb-1"
            >
              Nama Kampanye / Pengiklan
            </label>
            <input
              id="ad-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Promo Paket Hemat Dicelup Ayam Crispy"
              className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-neutral-950"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            {imageUrl && (
              <div className="border border-stone-200 overflow-hidden bg-stone-100">
                <ImageWithFallback
                  src={imageUrl}
                  alt={title || 'Preview Iklan'}
                  className="w-full max-h-40 object-contain"
                />
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUploadImage(file);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="w-full py-2 text-xs font-semibold border border-neutral-950 bg-white hover:bg-neutral-950 hover:text-white transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Mengunggah...' : 'Unggah Banner Iklan ke Cloudinary'}
            </button>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL Gambar Iklan (https://res.cloudinary.com/...)"
              className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 focus:outline-none focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="ad-target-url"
              className="block text-xs font-semibold text-neutral-700 mb-1"
            >
              URL Tujuan Iklan (Dibuka di tab baru dengan rel=&quot;sponsored&quot;)
            </label>
            <input
              id="ad-target-url"
              type="url"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://www.dicelupayamcrispy.store/menu"
              className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="ad-position"
              className="block text-xs font-semibold text-neutral-700 mb-1"
            >
              Posisi Penempatan Iklan
            </label>
            <select
              id="ad-position"
              value={position}
              onChange={(e) => setPosition(e.target.value as AdPosition)}
              className="w-full px-3 py-2 text-sm border border-stone-300 bg-white focus:outline-none focus:border-neutral-950"
            >
              {Object.entries(POSITION_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {position === 'article_in_content' && (
            <div>
              <label
                htmlFor="ad-after-p"
                className="block text-xs font-semibold text-neutral-700 mb-1"
              >
                Sisipkan Setelah Paragraf Ke-
              </label>
              <input
                id="ad-after-p"
                type="number"
                min={1}
                max={30}
                value={afterParagraph}
                onChange={(e) => setAfterParagraph(Number(e.target.value))}
                className="w-28 px-3 py-2 text-sm font-mono border border-stone-300 focus:outline-none focus:border-neutral-950"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="ad-scope"
              className="block text-xs font-semibold text-neutral-700 mb-1"
            >
              Target Penayangan
            </label>
            <select
              id="ad-scope"
              value={targetScope}
              onChange={(e) => setTargetScope(e.target.value as AdTargetScope)}
              className="w-full px-3 py-2 text-sm border border-stone-300 bg-white focus:outline-none focus:border-neutral-950"
            >
              <option value="all">Semua Artikel &amp; Halaman</option>
              <option value="categories">Kategori Tertentu</option>
              <option value="articles">Artikel Tertentu</option>
            </select>
          </div>

          {targetScope === 'categories' && (
            <div className="border border-stone-200 p-3 max-h-40 overflow-y-auto space-y-1.5">
              <p className="text-[11px] font-semibold uppercase text-stone-500 mb-1">
                Pilih Kategori:
              </p>
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2 text-xs text-neutral-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={targetCategoryIds.includes(cat.id)}
                    onChange={() =>
                      toggleSelection(
                        targetCategoryIds,
                        cat.id,
                        setTargetCategoryIds
                      )
                    }
                    className="accent-red-700"
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          )}

          {targetScope === 'articles' && (
            <div className="border border-stone-200 p-3 max-h-44 overflow-y-auto space-y-1.5">
              <p className="text-[11px] font-semibold uppercase text-stone-500 mb-1">
                Pilih Artikel:
              </p>
              {articles.map((art) => (
                <label
                  key={art.id}
                  className="flex items-start gap-2 text-xs text-neutral-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={targetArticleIds.includes(art.id)}
                    onChange={() =>
                      toggleSelection(
                        targetArticleIds,
                        art.id,
                        setTargetArticleIds
                      )
                    }
                    className="mt-0.5 accent-red-700"
                  />
                  <span className="line-clamp-1">{art.title}</span>
                </label>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="ad-start"
                className="block text-xs font-semibold text-neutral-700 mb-1"
              >
                Tanggal Mulai
              </label>
              <input
                id="ad-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-stone-300 focus:outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label
                htmlFor="ad-duration"
                className="block text-xs font-semibold text-neutral-700 mb-1"
              >
                Durasi (Hari)
              </label>
              <input
                id="ad-duration"
                type="number"
                min={1}
                max={365}
                required
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-stone-300 focus:outline-none focus:border-neutral-950"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 accent-red-700"
            />
            Status Iklan Aktif
          </label>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-neutral-950 text-white hover:bg-neutral-800 inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <Plus className="w-3.5 h-3.5" />
              {saving ? 'Menyimpan...' : editingId ? 'Perbarui Iklan' : 'Simpan Iklan'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 text-xs border border-stone-300 bg-white"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        {/* Ad List */}
        <div className="lg:col-span-7 bg-white border border-stone-300">
          {ads.length === 0 ? (
            <div className="p-8 text-center text-sm text-stone-500">
              Belum ada iklan terjadwal.
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {ads.map((ad) => {
                const liveNow = isAdActiveNow(ad);
                const remaining = getRemainingAdDays(ad);
                return (
                  <div
                    key={ad.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-24 h-16 bg-stone-100 border border-stone-200 shrink-0 overflow-hidden">
                        <ImageWithFallback
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-neutral-950 truncate">
                            {ad.title}
                          </h3>
                          <span
                            className={`text-[11px] font-bold ${
                              liveNow
                                ? 'text-emerald-700'
                                : !ad.active
                                  ? 'text-stone-500'
                                  : 'text-red-700'
                            }`}
                          >
                            {liveNow
                              ? `Tayang (${remaining} hari lagi)`
                              : !ad.active
                                ? 'Nonaktif'
                                : 'Berakhir / Belum Mulai'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5">
                          {POSITION_LABELS[ad.position]}
                          {ad.position === 'article_in_content'
                            ? ` (Setelah paragraf ${ad.afterParagraph})`
                            : ''}
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono tabular-nums mt-1">
                          Mulai: {ad.startDate} &middot; {ad.durationDays} hari &middot;{' '}
                          {(ad.clicks || 0).toLocaleString('id-ID')} klik
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {confirmDeleteId === ad.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void handleDelete(ad.id)}
                            className="px-2 py-1 text-[11px] bg-red-700 text-white font-semibold"
                          >
                            Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-[11px] border border-stone-300"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(ad)}
                            aria-label={`Edit iklan ${ad.title}`}
                            className="p-1.5 text-stone-600 hover:text-neutral-950"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(ad.id)}
                            aria-label={`Hapus iklan ${ad.title}`}
                            className="p-1.5 text-stone-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
