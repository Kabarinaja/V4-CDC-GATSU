import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { slugify } from '../../lib/seo';
import { useDocumentHead } from '../../lib/useDocumentHead';
import {
  deleteCategoryAdmin,
  saveCategoryAdmin,
} from '../../services/firestoreService';
import type { Category } from '../../types';

interface AdminCategoriesPageProps {
  categories: Category[];
  onRefresh: () => Promise<void>;
}

export const AdminCategoriesPage: React.FC<AdminCategoriesPageProps> = ({
  categories,
  onRefresh,
}) => {
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(categories.length + 1);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useDocumentHead({
    title: 'Manajemen Kategori — Meja Redaksi GATSU WEWARAH',
    description: 'Kelola kanal kategori berita GATSU WEWARAH.',
  });

  const resetForm = () => {
    setEditingId(undefined);
    setName('');
    setSlug('');
    setDescription('');
    setOrder(categories.length + 1);
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setOrder(cat.order);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await saveCategoryAdmin({
        id: editingId,
        name,
        slug,
        description,
        order,
      });
      await onRefresh();
      resetForm();
      setMessage('Kategori berhasil disimpan.');
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan kategori.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setMessage(null);
    try {
      await deleteCategoryAdmin(id);
      setConfirmDeleteId(null);
      await onRefresh();
      setMessage('Kategori dihapus.');
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Gagal menghapus kategori.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-300 pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950">
          Manajemen Kategori
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Atur kanal navigasi berita yang tampil di header, beranda, dan sitemap.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-white border border-stone-300 text-xs font-medium text-neutral-800">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-stone-300 p-5 space-y-4 h-fit"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-950 border-b border-stone-200 pb-2">
            {editingId ? 'Sunting Kategori' : 'Tambah Kategori Baru'}
          </h2>

          <div>
            <label
              htmlFor="cat-name"
              className="block text-xs font-semibold text-neutral-700 mb-1"
            >
              Nama Kategori
            </label>
            <input
              id="cat-name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingId) setSlug(slugify(e.target.value));
              }}
              placeholder="Contoh: Ekonomi & UMKM"
              className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="cat-slug"
              className="block text-xs font-semibold text-neutral-700 mb-1"
            >
              Slug URL
            </label>
            <input
              id="cat-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="ekonomi-umkm"
              className="w-full px-3 py-2 text-xs font-mono border border-stone-300 bg-stone-50 focus:outline-none focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="cat-desc"
              className="block text-xs font-semibold text-neutral-700 mb-1"
            >
              Deskripsi Singkat
            </label>
            <textarea
              id="cat-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Penjelasan singkat kanal berita..."
              className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="cat-order"
              className="block text-xs font-semibold text-neutral-700 mb-1"
            >
              Urutan Navigasi
            </label>
            <input
              id="cat-order"
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-28 px-3 py-2 text-sm font-mono border border-stone-300 focus:outline-none focus:border-neutral-950"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-neutral-950 text-white hover:bg-neutral-800 inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <Plus className="w-3.5 h-3.5" />
              {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Tambah Kategori'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 text-xs border border-stone-300 bg-white hover:bg-stone-50"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        {/* Table */}
        <div className="lg:col-span-7 bg-white border border-stone-300">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-sm text-stone-500">
              Belum ada kategori terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                    <th className="py-3 px-4">Urutan</th>
                    <th className="py-3 px-4">Nama &amp; Deskripsi</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-xs">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-stone-50">
                      <td className="py-3 px-4 font-mono tabular-nums text-stone-600">
                        {cat.order}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-neutral-950 block">
                          {cat.name}
                        </span>
                        <span className="text-stone-500 line-clamp-1">
                          {cat.description}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        {cat.slug}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {confirmDeleteId === cat.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void handleDelete(cat.id)}
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
                              onClick={() => handleEdit(cat)}
                              aria-label={`Edit ${cat.name}`}
                              className="p-1.5 text-stone-600 hover:text-neutral-950"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(cat.id)}
                              aria-label={`Hapus ${cat.name}`}
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
        </div>
      </div>
    </div>
  );
};
