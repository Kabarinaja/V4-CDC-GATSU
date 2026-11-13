import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import { useDocumentHead } from '../../lib/useDocumentHead';
import {
  deleteAuthorAdmin,
  saveAuthorAdmin,
} from '../../services/firestoreService';
import type { Author } from '../../types';

interface AdminAuthorsPageProps {
  authors: Author[];
  onRefresh: () => Promise<void>;
}

export const AdminAuthorsPage: React.FC<AdminAuthorsPageProps> = ({
  authors,
  onRefresh,
}) => {
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Jurnalis Redaksi');
  const [photoUrl, setPhotoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useDocumentHead({
    title: 'Manajemen Penulis — Meja Redaksi GATSU WEWARAH',
    description: 'Kelola data jurnalis dan penulis GATSU WEWARAH.',
  });

  const resetForm = () => {
    setEditingId(undefined);
    setName('');
    setRole('Jurnalis Redaksi');
    setPhotoUrl('');
    setBio('');
  };

  const handleEdit = (au: Author) => {
    setEditingId(au.id);
    setName(au.name);
    setRole(au.role);
    setPhotoUrl(au.photoUrl);
    setBio(au.bio);
    setMessage(null);
  };

  const handleUploadPhoto = async (file: File) => {
    setMessage(null);
    setUploading(true);
    try {
      const res = await uploadImageToCloudinary(file, 'authors');
      setPhotoUrl(res.secureUrl);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Gagal mengunggah foto penulis.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!photoUrl.trim()) {
      setMessage('Foto profil penulis 1:1 wajib diunggah ke Cloudinary.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveAuthorAdmin({
        id: editingId,
        name,
        role,
        photoUrl,
        bio,
      });
      await onRefresh();
      resetForm();
      setMessage(`Penulis "${saved.name}" tersimpan dengan ID unik: ${saved.id}`);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan data penulis.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setMessage(null);
    try {
      await deleteAuthorAdmin(id);
      setConfirmDeleteId(null);
      await onRefresh();
      setMessage('Profil penulis dihapus.');
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Gagal menghapus penulis.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-300 pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950">
          Manajemen Penulis
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Tambahkan profil jurnalis dengan foto 1:1, nama, biodata, dan ID unik otomatis.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-white border border-stone-300 text-xs font-medium text-neutral-800">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-stone-300 p-5 space-y-4 h-fit"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-950 border-b border-stone-200 pb-2">
            {editingId ? 'Sunting Profil Penulis' : 'Tambah Penulis Baru'}
          </h2>

          {/* 1:1 Avatar Preview + Upload */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-stone-300 bg-stone-100 shrink-0">
              <ImageWithFallback
                src={photoUrl}
                alt={name || 'Foto penulis'}
                optimize={{ width: 200, height: 200, crop: 'fill', gravity: 'face' }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUploadPhoto(file);
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 text-xs font-semibold border border-neutral-950 bg-white hover:bg-neutral-950 hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploading ? 'Mengunggah...' : 'Unggah Foto 1:1'}
              </button>
              <p className="text-[11px] text-stone-500">
                Disarankan rasio persegi 1:1 (otomatis dipotong Cloudinary).
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="author-photo-url"
              className="block text-xs font-semibold text-neutral-700 mb-1"
            >
              URL Foto Cloudinary
            </label>
            <input
              id="author-photo-url"
              type="url"
              required
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/nj6kyxex/..."
              className="w-full px-3 py-2 text-xs font-mono border border-stone-300 focus:outline-none focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="author-name"
              className="block text-xs font-semibold text-neutral-700 mb-1"
            >
              Nama Lengkap
            </label>
            <input
              id="author-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Hendra Wijaya"
              className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="author-role"
              className="block text-xs font-semibold text-neutral-700 mb-1"
            >
              Jabatan / Peran Redaksi
            </label>
            <input
              id="author-role"
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Contoh: Redaktur Ekonomi"
              className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="author-bio"
              className="block text-xs font-semibold text-neutral-700 mb-1"
            >
              Biodata Singkat
            </label>
            <textarea
              id="author-bio"
              rows={3}
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Pengalaman jurnalistik dan fokus liputan..."
              className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-neutral-950"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-neutral-950 text-white hover:bg-neutral-800 inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <Plus className="w-3.5 h-3.5" />
              {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan Penulis'}
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

        <div className="lg:col-span-7 bg-white border border-stone-300">
          {authors.length === 0 ? (
            <div className="p-8 text-center text-sm text-stone-500">
              Belum ada penulis terdaftar.
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {authors.map((au) => (
                <div
                  key={au.id}
                  className="p-4 flex items-start justify-between gap-4 hover:bg-stone-50"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                      <ImageWithFallback
                        src={au.photoUrl}
                        alt={au.name}
                        optimize={{
                          width: 140,
                          height: 140,
                          crop: 'fill',
                          gravity: 'face',
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-neutral-950">
                        {au.name}
                      </h3>
                      <p className="text-xs font-medium text-red-700">
                        {au.role}
                      </p>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                        {au.bio}
                      </p>
                      <p className="text-[11px] font-mono text-stone-400 mt-1">
                        ID: {au.id}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {confirmDeleteId === au.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void handleDelete(au.id)}
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
                        <Link
                          to={`/gatsuwewarah/penulis/${au.id}`}
                          target="_blank"
                          aria-label={`Lihat profil publik ${au.name}`}
                          className="p-1.5 text-stone-500 hover:text-neutral-950"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleEdit(au)}
                          aria-label={`Edit ${au.name}`}
                          className="p-1.5 text-stone-600 hover:text-neutral-950"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(au.id)}
                          aria-label={`Hapus ${au.name}`}
                          className="p-1.5 text-stone-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
