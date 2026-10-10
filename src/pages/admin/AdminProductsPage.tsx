import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types';
import { INITIAL_PRODUCTS, formatRupiah } from '../../lib/utils';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Utensils, Edit3, CheckCircle2, RotateCcw, Save, X, Sparkles, AlertCircle } from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const { showToast } = useNotification();
  const { currentUser } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Product[];
          // Exclude Teriyaki and Wings strictly
          const filtered = list.filter(
            (p) =>
              !p.name.toLowerCase().includes('teriyaki') &&
              !p.name.toLowerCase().includes('wings')
          );
          filtered.sort((a, b) => a.sortOrder - b.sortOrder);
          setProducts(filtered);
        } else {
          setProducts([]);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Products snapshot note:', err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Seed default 7 products to Firestore
  const handleSeedDefaultProducts = async () => {
    setSaving(true);
    try {
      const batch = writeBatch(db);
      for (const prod of INITIAL_PRODUCTS) {
        const ref = doc(db, 'products', prod.id);
        batch.set(ref, {
          ...prod,
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      showToast('Katalog 7 menu resmi MY CDC GATSU berhasil disinkronkan ke Firestore!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyinkronkan produk.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (prod: Product) => {
    try {
      await updateDoc(doc(db, 'products', prod.id), {
        isActive: !prod.isActive,
        updatedAt: serverTimestamp(),
      });
      showToast(`Status ${prod.name} diubah menjadi ${!prod.isActive ? 'Aktif' : 'Non-aktif'}.`, 'info');
    } catch (e) {
      showToast('Gagal mengubah status aktif produk.', 'error');
    }
  };

  const handleSavePriceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const prices = [editingProduct.prices.tanpaNasi, editingProduct.prices.denganNasi, editingProduct.extraOptions.extraSaus, editingProduct.extraOptions.extraNasi];
    if (prices.some(value => !Number.isFinite(value) || value < 0) || editingProduct.prices.tanpaNasi <= 0 || editingProduct.prices.denganNasi <= 0) {
      showToast('Harga utama wajib positif; semua nominal harus berupa angka valid dan tidak negatif.', 'error');
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, 'products', editingProduct.id),
        {
          ...editingProduct,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      showToast(`Harga dan rincian ${editingProduct.name} berhasil diperbarui.`, 'success');
      setEditingProduct(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan perubahan produk.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const displayedList = products.length > 0 ? products : INITIAL_PRODUCTS;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Katalog Menu & Harga Produk</h1>
          <p className="text-xs text-stone-400">
            Kelola harga paket Ayam + Saus, Ayam + Saus + Nasi, Extra Saus & Extra Nasi (Data tersimpan di Firestore)
          </p>
        </div>

        <button
          type="button"
          onClick={handleSeedDefaultProducts}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-colors shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Sinkronkan 7 Menu Resmi ke Database</span>
        </button>
      </div>

      {/* Info notice */}
      <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs text-stone-300">
        <span>
          Menu Teriyaki & Paket Wings telah dihapus permanen sesuai arahan manajemen. Hanya 7 menu utama yang aktif.
        </span>
        <span className="text-amber-400 font-bold">{displayedList.length} Menu</span>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedList.map((prod) => (
          <div
            key={prod.id}
            className={`rounded-3xl border p-5 space-y-4 transition-all ${
              prod.isActive
                ? 'bg-stone-950 border-stone-800 shadow-md'
                : 'bg-stone-950/60 border-stone-900 opacity-60'
            }`}
          >
            <div className="flex items-start gap-3">
              <img
                src={prod.imageUrl}
                alt={prod.name}
                className="w-16 h-16 rounded-2xl object-cover border border-stone-800 shrink-0"
              />
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-base truncate">{prod.name}</h3>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
                    {prod.category}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 leading-snug">
                  {prod.description}
                </p>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="space-y-1.5 bg-stone-900/90 rounded-2xl p-3 border border-stone-850 text-xs">
              <div className="flex justify-between text-stone-300">
                <span>{prod.id === 'ori' ? 'Ori tanpa nasi:' : 'Ayam + Saus:'}</span>
                <strong className="text-white">{formatRupiah(prod.prices.tanpaNasi)}</strong>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>{prod.id === 'ori' ? 'Ori + nasi:' : 'Ayam + Saus + Nasi:'}</span>
                <strong className="text-amber-400">{formatRupiah(prod.prices.denganNasi)}</strong>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Extra Saus: {formatRupiah(prod.extraOptions.extraSaus)}</span>
                <span>Extra Nasi: {formatRupiah(prod.extraOptions.extraNasi)}</span>
              </div>

            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => handleToggleActive(prod)}
                className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-colors ${
                  prod.isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                {prod.isActive ? 'Tersedia di Menu' : 'Disembunyikan (Habis)'}
              </button>

              <button
                type="button"
                onClick={() => setEditingProduct(prod)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors flex items-center gap-1 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ubah Harga</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base text-white">Ubah Harga: {editingProduct.name}</h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePriceEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">Deskripsi Menu</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-700 bg-stone-850 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-stone-300">Ayam + Saus / Tanpa Nasi (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={Number.isFinite(editingProduct.prices.tanpaNasi) ? editingProduct.prices.tanpaNasi : ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        prices: { ...editingProduct.prices, tanpaNasi: e.target.value === '' ? Number.NaN : Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-700 bg-stone-850 text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-300">Ayam + Saus + Nasi (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={Number.isFinite(editingProduct.prices.denganNasi) ? editingProduct.prices.denganNasi : ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        prices: { ...editingProduct.prices, denganNasi: e.target.value === '' ? Number.NaN : Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-700 bg-stone-850 text-white font-bold text-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-stone-300">Extra Saus (Rp)</label>
                  <input
                    type="number"
                    value={Number.isFinite(editingProduct.extraOptions.extraSaus) ? editingProduct.extraOptions.extraSaus : ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        extraOptions: { ...editingProduct.extraOptions, extraSaus: e.target.value === '' ? Number.NaN : Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-700 bg-stone-850 text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-300">Extra Nasi (Rp)</label>
                  <input
                    type="number"
                    value={Number.isFinite(editingProduct.extraOptions.extraNasi) ? editingProduct.extraOptions.extraNasi : ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        extraOptions: { ...editingProduct.extraOptions, extraNasi: e.target.value === '' ? Number.NaN : Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-700 bg-stone-850 text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-750"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-colors shadow-md"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Harga Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
