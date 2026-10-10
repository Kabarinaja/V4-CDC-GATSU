import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Promotion } from '../../types';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Megaphone, Plus, Trash2, Edit3, Upload, Image as ImageIcon, Eye, CheckCircle2, X } from 'lucide-react';

export const AdminPromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { showToast } = useNotification();
  const { currentUser } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'promotions'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Promotion[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Promotion[];
        list.sort((a, b) => a.sortOrder - b.sortOrder);
        setPromotions(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Promotions snapshot note:', err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const openCreateModal = () => {
    setEditingPromoId(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setSortOrder(promotions.length + 1);
    setIsActive(true);
    setUploadFile(null);
    setModalOpen(true);
  };

  const openEditModal = (promo: Promotion) => {
    setEditingPromoId(promo.id);
    setTitle(promo.title);
    setDescription(promo.description || '');
    setImageUrl(promo.imageUrl);
    setSortOrder(promo.sortOrder || 1);
    setIsActive(promo.isActive);
    setUploadFile(null);
    setModalOpen(true);
  };

  const handleTogglePromo = async (promo: Promotion) => {
    try {
      await updateDoc(doc(db, 'promotions', promo.id), {
        isActive: !promo.isActive,
        updatedAt: serverTimestamp(),
      });
      showToast(`Status banner "${promo.title}" diubah.`, 'info');
    } catch {
      showToast('Gagal mengubah status banner.', 'error');
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus banner promosi ini?')) return;
    try {
      await deleteDoc(doc(db, 'promotions', id));
      showToast('Banner promosi berhasil dihapus.', 'success');
    } catch {
      showToast('Gagal menghapus banner.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Judul promosi wajib diisi.', 'error');
      return;
    }

    let finalImageUrl = imageUrl;

    setUploading(true);
    try {
      // If user uploaded a new image file, upload to Cloudinary folder promotions
      if (uploadFile) {
        showToast('Sedang mengunggah poster ke Cloudinary...', 'info');
        finalImageUrl = await uploadToCloudinary(uploadFile, 'promotions');
      }

      if (!finalImageUrl) {
        showToast('Wajib melampirkan gambar poster atau URL poster.', 'error');
        setUploading(false);
        return;
      }

      const promoId = editingPromoId || doc(collection(db, 'promotions')).id;
      const promoData = {
        id: promoId,
        title: title.trim(),
        description: description.trim(),
        imageUrl: finalImageUrl,
        sortOrder: Number(sortOrder) || 1,
        isActive,
        updatedAt: serverTimestamp(),
        createdAt: editingPromoId ? undefined : serverTimestamp(),
      };

      // Clean undefined
      const payload: any = { ...promoData };
      if (!editingPromoId) payload.createdAt = serverTimestamp();

      await setDoc(doc(db, 'promotions', promoId), payload, { merge: true });

      showToast(
        editingPromoId ? 'Banner promosi berhasil diperbarui.' : 'Banner promosi baru berhasil diterbitkan!',
        'success'
      );
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan banner promosi.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Kelola Banner Promosi</h1>
          <p className="text-xs text-stone-400">
            Upload poster & pengumuman ke Cloudinary untuk ditampilkan di carousel beranda pelanggan
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-colors shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Upload Banner Baru</span>
        </button>
      </div>

      {/* Promotions List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-stone-400">Memuat banner promosi...</div>
      ) : promotions.length === 0 ? (
        <div className="bg-stone-950 border border-stone-800 rounded-3xl p-8 text-center space-y-3 text-stone-400">
          <Megaphone className="w-12 h-12 text-stone-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">Belum Ada Banner Promosi</h3>
          <p className="text-xs max-w-sm mx-auto">
            Upload poster event, promo diskon ayam, atau pengumuman outlet untuk menarik perhatian pelanggan di beranda.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
          >
            Upload Banner Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {promotions.map((p) => (
            <div
              key={p.id}
              className={`rounded-3xl border overflow-hidden transition-all flex flex-col justify-between ${
                p.isActive
                  ? 'bg-stone-950 border-stone-800 shadow-md'
                  : 'bg-stone-950/60 border-stone-900 opacity-60'
              }`}
            >
              <div>
                <div className="relative aspect-[21/9] w-full overflow-hidden bg-black">
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-stone-900/90 text-white text-[10px] font-bold">
                    Urutan #{p.sortOrder}
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-white text-base truncate">{p.title}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        p.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {p.isActive ? 'Tayang di Beranda' : 'Non-aktif'}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-xs text-stone-300 leading-relaxed line-clamp-2">
                      {p.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-stone-850 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleTogglePromo(p)}
                  className="text-xs font-bold text-stone-400 hover:text-white"
                >
                  {p.isActive ? 'Non-aktifkan' : 'Aktifkan'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
                    title="Edit Promo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePromo(p.id)}
                    className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/40 text-rose-300 text-xs font-bold"
                    title="Hapus Promo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-base text-white">
                {editingPromoId ? 'Edit Banner Promosi' : 'Upload Banner Promosi Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">Judul Banner *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Promo Spesial Ayam Mentai Beli 2 Lebih Hemat"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-850 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">Deskripsi Singkat (Opsional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan singkat promo atau pengumuman outlet..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-700 bg-stone-850 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Poster File Upload to Cloudinary */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">Gambar Poster (Cloudinary mycdcgatsu)</label>
                <div className="border border-stone-700 rounded-2xl p-3 bg-stone-850 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-stone-950"
                  />
                  {imageUrl && !uploadFile && (
                    <div className="text-[11px] text-stone-400 truncate">
                      URL saat ini: <span className="font-mono text-amber-400">{imageUrl}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-stone-300">Urutan Tampil (Sort Order)</label>
                  <input
                    type="number"
                    min={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl border border-stone-700 bg-stone-850 text-white font-bold"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-stone-700 bg-stone-850">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="font-bold text-stone-200 text-xs">Tayang Aktif</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-750"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-colors shadow-md"
                >
                  {uploading ? 'Mengunggah ke Cloudinary...' : 'Simpan Banner Promosi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
