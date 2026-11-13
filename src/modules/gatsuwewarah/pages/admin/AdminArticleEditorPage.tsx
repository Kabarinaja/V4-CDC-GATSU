import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { RichHtmlEditor } from '../../components/RichHtmlEditor';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import { slugify } from '../../lib/seo';
import { useDocumentHead } from '../../lib/useDocumentHead';
import {
  fetchArticleByIdAdmin,
  saveArticleAdmin,
} from '../../services/firestoreService';
import type { ArticleStatus, Author, Category } from '../../types';

interface AdminArticleEditorPageProps {
  categories: Category[];
  authors: Author[];
  onSaved: () => Promise<void>;
}

function toDatetimeLocalValue(iso?: string): string {
  const date = iso ? new Date(iso) : new Date(Date.now() + 3600 * 1000);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const AdminArticleEditorPage: React.FC<AdminArticleEditorPageProps> = ({
  categories,
  authors,
  onSaved,
}) => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(articleId);

  useDocumentHead({
    title: isEditing
      ? 'Sunting Berita — Meja Redaksi GATSU WEWARAH'
      : 'Tulis Berita — Meja Redaksi GATSU WEWARAH',
    description: 'Editor berita profesional GATSU WEWARAH.',
  });

  const [loadingInitial, setLoadingInitial] = useState(isEditing);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [summary, setSummary] = useState('');
  const [contentHtml, setContentHtml] = useState('<p></p>');
  const [coverImage, setCoverImage] = useState('');
  const [coverCaption, setCoverCaption] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('published');
  const [scheduledLocal, setScheduledLocal] = useState(toDatetimeLocalValue());
  const [isBreaking, setIsBreaking] = useState(false);
  const [isHeadline, setIsHeadline] = useState(false);
  const [isEditorPick, setIsEditorPick] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditing && !categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
    if (!isEditing && !authorId && authors.length > 0) {
      setAuthorId(authors[0].id);
    }
  }, [isEditing, categories, authors, categoryId, authorId]);

  useEffect(() => {
    if (!articleId) return;
    let active = true;
    const load = async () => {
      setLoadingInitial(true);
      try {
        const existing = await fetchArticleByIdAdmin(articleId);
        if (!active) return;
        if (!existing) {
          setError('Artikel tidak ditemukan di database.');
          setLoadingInitial(false);
          return;
        }
        setTitle(existing.title);
        setSlug(existing.slug);
        setSlugTouched(true);
        setSummary(existing.summary);
        setContentHtml(existing.contentHtml || '<p></p>');
        setCoverImage(existing.coverImage);
        setCoverCaption(existing.coverCaption);
        setCategoryId(existing.categoryId);
        setAuthorId(existing.authorId);
        setStatus(existing.status);
        if (existing.scheduledAt) {
          setScheduledLocal(toDatetimeLocalValue(existing.scheduledAt));
        }
        setIsBreaking(existing.isBreaking);
        setIsHeadline(existing.isHeadline);
        setIsEditorPick(existing.isEditorPick);
        setTagsInput((existing.tags || []).join(', '));
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Gagal memuat artikel.'
          );
        }
      } finally {
        if (active) setLoadingInitial(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [articleId]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched) {
      setSlug(slugify(val));
    }
  };

  const handleUploadCover = async (file: File) => {
    setError(null);
    setUploadingCover(true);
    try {
      const res = await uploadImageToCloudinary(file, 'covers');
      setCoverImage(res.secureUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal mengunggah gambar utama.'
      );
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const selectedAuthor = authors.find((a) => a.id === authorId);

    if (!selectedCategory) {
      setError('Silakan pilih atau buat kategori berita terlebih dahulu.');
      return;
    }
    if (!selectedAuthor) {
      setError('Silakan pilih atau tambahkan penulis terlebih dahulu.');
      return;
    }
    if (!coverImage.trim()) {
      setError('Gambar utama artikel (Cloudinary) wajib diunggah.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveArticleAdmin({
        id: articleId,
        title,
        slug,
        summary,
        contentHtml,
        coverImage,
        coverCaption,
        categoryId: selectedCategory.id,
        categorySlug: selectedCategory.slug,
        categoryName: selectedCategory.name,
        authorId: selectedAuthor.id,
        authorName: selectedAuthor.name,
        authorPhoto: selectedAuthor.photoUrl,
        status,
        scheduledAt:
          status === 'scheduled' && scheduledLocal
            ? new Date(scheduledLocal).toISOString()
            : undefined,
        isBreaking,
        isHeadline,
        isEditorPick,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });

      await onSaved();
      setSuccessMsg('Artikel berhasil disimpan.');
      if (!articleId) {
        navigate(`/gatsuwewarah/admin/edit/${saved.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan artikel.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return <div className="py-12 text-sm text-stone-500">Memuat editor artikel...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-300 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/gatsuwewarah/admin/berita"
            className="p-2 border border-stone-300 bg-white hover:bg-stone-50"
            aria-label="Kembali ke daftar berita"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-neutral-950">
              {isEditing ? 'Sunting Berita' : 'Tulis Berita Baru'}
            </h1>
            <p className="text-xs text-stone-500">
              Pastikan kategori, penulis, gambar utama, dan metadata terisi lengkap.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-red-700 text-white hover:bg-red-800 inline-flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Menyimpan...' : 'Simpan Berita'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border border-red-200 text-xs font-medium text-red-800"
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Editorial Content Column */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white border border-stone-300 p-5 space-y-4">
            <div>
              <label
                htmlFor="article-title"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5"
              >
                Judul Berita
              </label>
              <input
                id="article-title"
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Masukkan judul berita jurnalistik yang jelas dan padat..."
                className="w-full px-3.5 py-2.5 font-serif text-lg font-bold border border-stone-300 focus:outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label
                htmlFor="article-slug"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5"
              >
                Slug URL (/gatsuwewarah/berita/...)
              </label>
              <input
                id="article-slug"
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="judul-berita-seo-friendly"
                className="w-full px-3.5 py-2 text-xs font-mono border border-stone-300 bg-stone-50 focus:outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label
                htmlFor="article-summary"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5"
              >
                Ringkasan / Teras Berita (Tampil di Preview WhatsApp &amp; SEO)
              </label>
              <textarea
                id="article-summary"
                rows={3}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Ringkasan padat 1–2 kalimat mengenai inti peristiwa..."
                className="w-full px-3.5 py-2.5 text-sm border border-stone-300 focus:outline-none focus:border-neutral-950"
              />
            </div>
          </div>

          {/* Tiptap HTML Editor */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
              Isi Berita Lengkap
            </p>
            <RichHtmlEditor value={contentHtml} onChange={setContentHtml} />
          </div>
        </div>

        {/* Right Publishing Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          {/* Status & Schedule */}
          <div className="bg-white border border-stone-300 p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-950 border-b border-stone-200 pb-2">
              Publikasi
            </h2>

            <div>
              <label
                htmlFor="article-status"
                className="block text-xs font-semibold text-neutral-700 mb-1.5"
              >
                Status Penayangan
              </label>
              <select
                id="article-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                className="w-full px-3 py-2 text-sm border border-stone-300 bg-white focus:outline-none focus:border-neutral-950"
              >
                <option value="published">Terbitkan Langsung (Published)</option>
                <option value="draft">Simpan Sebagai Draft</option>
                <option value="scheduled">Jadwalkan Penayangan</option>
              </select>
            </div>

            {status === 'scheduled' && (
              <div>
                <label
                  htmlFor="article-schedule"
                  className="block text-xs font-semibold text-neutral-700 mb-1.5"
                >
                  Waktu Terbit Terjadwal
                </label>
                <input
                  id="article-schedule"
                  type="datetime-local"
                  required
                  value={scheduledLocal}
                  onChange={(e) => setScheduledLocal(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 bg-white focus:outline-none focus:border-neutral-950"
                />
              </div>
            )}

            <div className="space-y-2.5 pt-2 border-t border-stone-200">
              <label className="flex items-center gap-2.5 text-xs font-medium text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHeadline}
                  onChange={(e) => setIsHeadline(e.target.checked)}
                  className="w-4 h-4 accent-red-700"
                />
                Jadikan Headline Utama
              </label>
              <label className="flex items-center gap-2.5 text-xs font-medium text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="w-4 h-4 accent-red-700"
                />
                Tampilkan di Breaking News
              </label>
              <label className="flex items-center gap-2.5 text-xs font-medium text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEditorPick}
                  onChange={(e) => setIsEditorPick(e.target.checked)}
                  className="w-4 h-4 accent-red-700"
                />
                Pilihan Editor
              </label>
            </div>
          </div>

          {/* Category & Author */}
          <div className="bg-white border border-stone-300 p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-950 border-b border-stone-200 pb-2">
              Klasifikasi &amp; Penulis
            </h2>

            <div>
              <label
                htmlFor="article-category"
                className="block text-xs font-semibold text-neutral-700 mb-1.5"
              >
                Kategori
              </label>
              {categories.length === 0 ? (
                <p className="text-xs text-red-700">
                  Belum ada kategori.{' '}
                  <Link to="/gatsuwewarah/admin/kategori" className="underline">
                    Buat kategori dulu
                  </Link>
                  .
                </p>
              ) : (
                <select
                  id="article-category"
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 bg-white focus:outline-none focus:border-neutral-950"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label
                htmlFor="article-author"
                className="block text-xs font-semibold text-neutral-700 mb-1.5"
              >
                Penulis
              </label>
              {authors.length === 0 ? (
                <p className="text-xs text-red-700">
                  Belum ada penulis.{' '}
                  <Link to="/gatsuwewarah/admin/penulis" className="underline">
                    Tambah penulis dulu
                  </Link>
                  .
                </p>
              ) : (
                <select
                  id="article-author"
                  required
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 bg-white focus:outline-none focus:border-neutral-950"
                >
                  {authors.map((au) => (
                    <option key={au.id} value={au.id}>
                      {au.name} ({au.role})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label
                htmlFor="article-tags"
                className="block text-xs font-semibold text-neutral-700 mb-1.5"
              >
                Topik / Tag (pisahkan dengan koma)
              </label>
              <input
                id="article-tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="UMKM, Kuliner, Indramayu"
                className="w-full px-3 py-2 text-sm border border-stone-300 bg-white focus:outline-none focus:border-neutral-950"
              />
            </div>
          </div>

          {/* Cover Image (Cloudinary) */}
          <div className="bg-white border border-stone-300 p-5 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-950 border-b border-stone-200 pb-2">
              Gambar Utama (Cloudinary &amp; OG WhatsApp)
            </h2>

            {coverImage && (
              <div className="overflow-hidden border border-stone-200">
                <ImageWithFallback
                  src={coverImage}
                  alt="Pratinjau gambar utama"
                  className="w-full aspect-[16/9] object-cover"
                />
              </div>
            )}

            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUploadCover(file);
              }}
            />

            <button
              type="button"
              disabled={uploadingCover}
              onClick={() => coverInputRef.current?.click()}
              className="w-full py-2.5 text-xs font-semibold border border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploadingCover ? 'Mengunggah ke Cloudinary...' : 'Unggah Foto Utama'}
            </button>

            <div>
              <label
                htmlFor="cover-url"
                className="block text-[11px] font-semibold text-stone-500 mb-1"
              >
                URL Cloudinary
              </label>
              <input
                id="cover-url"
                type="url"
                required
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://res.cloudinary.com/nj6kyxex/..."
                className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 focus:outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label
                htmlFor="cover-caption"
                className="block text-[11px] font-semibold text-stone-500 mb-1"
              >
                Keterangan Foto (Caption)
              </label>
              <input
                id="cover-caption"
                type="text"
                value={coverCaption}
                onChange={(e) => setCoverCaption(e.target.value)}
                placeholder="Contoh: Aktivitas pelaku usaha di Indramayu (Foto: Redaksi)"
                className="w-full px-3 py-1.5 text-xs border border-stone-300 focus:outline-none focus:border-neutral-950"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
