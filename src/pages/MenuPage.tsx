import React, { useState, useEffect } from 'react';
import { Product, ProductVariantKey } from '../types';
import { INITIAL_PRODUCTS, formatRupiah, applyOfficialPricing } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { Plus, Check, ShoppingBag, X, Info, Flame } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const MenuPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modal customizer state
  const [variant, setVariant] = useState<ProductVariantKey>('dengan_nasi');
  const [extraSausCount, setExtraSausCount] = useState(0);
  const [extraSausName, setExtraSausName] = useState('');
  const [extraNasiCount, setExtraNasiCount] = useState(0);
  const [chickenPartNote, setChickenPartNote] = useState('Bebas');
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCart();
  const { showToast } = useNotification();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const q = query(
          collection(db, 'products'),
          where('isActive', '==', true),
          orderBy('sortOrder', 'asc')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];
          const pricedList = list.map(applyOfficialPricing);
          // Strictly exclude Teriyaki and Wings
          const validList = pricedList.filter(
            (p) =>
              !p.name.toLowerCase().includes('teriyaki') &&
              !p.name.toLowerCase().includes('wings')
          );
          if (validList.length > 0) {
            setProducts(validList);
          }
        }
      } catch (e) {
        console.warn('Note using initial catalog:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const openCustomizer = (product: Product) => {
    setSelectedProduct(product);
    // If product is Mentai, default to 'dengan_nasi' because Mentai doesn't offer ayam saja
    setVariant('dengan_nasi');
    setExtraSausCount(0);
    setExtraSausName('');
    setExtraNasiCount(0);
    setChickenPartNote('Bebas');
    setQuantity(1);
  };

  const getVariantPrice = (prod: Product, v: ProductVariantKey): number => {
    if (v === 'tanpa_nasi') return prod.prices.tanpaNasi || 12000;
    return prod.prices.denganNasi || 16000;
  };

  const getVariantLabel = (prod: Product, v: ProductVariantKey): string => {
    if (prod.id === 'ori') return v === 'tanpa_nasi' ? 'Ori (Tanpa Nasi)' : 'Ori + Nasi';
    if (prod.id === 'mentai') return v === 'tanpa_nasi' ? 'Mentai (Tanpa Nasi)' : 'Mentai + Nasi';
    return v === 'tanpa_nasi' ? 'Ayam + Saus (Tanpa Nasi)' : 'Ayam + Saus + Nasi';
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const basePrice = getVariantPrice(selectedProduct, variant);
    addToCart({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productImage: selectedProduct.imageUrl,
      variant,
      variantLabel: getVariantLabel(selectedProduct, variant),
      basePrice,
      extraSausCount: extraSausName.trim() ? Math.max(1, extraSausCount) : 0,
      extraSausPrice: 2000,
      extraSausName: extraSausName.trim(),
      extraNasiCount,
      extraNasiPrice: selectedProduct.extraOptions.extraNasi || 4000,
      chickenPartNote,
      quantity,
    });

    showToast(
      `${quantity}x ${selectedProduct.name} (${getVariantLabel(selectedProduct, variant)}) ditambahkan ke pesanan.`,
      'success',
      'Ditambahkan ke Keranjang'
    );

    setSelectedProduct(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Title Header */}
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Daftar Menu MY CDC GATSU
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-600">
          Ayam renyah krispi dengan aneka lumuran saus pilihan terbaik. Silakan pilih menu dan tentukan paket favoritmu.
        </p>
      </div>

      {/* Notice info on chicken part */}
      <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Catatan:</strong> Anda dapat memilih preferensi bagian ayam (dada, paha, atau sayap) saat memesan. Permintaan bagian ayam menyesuaikan ketersediaan harian di outlet.
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {products.map((item) => {
          const startingPrice = item.prices.tanpaNasi;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover object-center transition-transform duration-300"
                    loading="lazy"
                  />
                  {item.badge && (
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-950/90 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm shadow-md">
                      {item.badge}
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-stone-900/80 text-white text-[11px] font-bold backdrop-blur-sm">
                    {item.category}
                  </span>
                </div>

                <div className="p-3 space-y-1.5 sm:p-5 sm:space-y-2">
                  <h3 className="line-clamp-1 text-sm font-extrabold text-stone-900 sm:text-lg">{item.name}</h3>
                  <p className="hidden text-xs text-stone-600 leading-relaxed min-h-[36px] sm:block">
                    {item.description}
                  </p>

                  {/* Price Tag Preview */}
                  <div className="pt-1 flex flex-wrap gap-1 text-[9px] font-semibold text-stone-600 sm:pt-2 sm:gap-1.5 sm:text-[11px]">
                    <span className="px-1.5 py-0.5 rounded-lg bg-stone-100 sm:px-2">
                      {item.id === 'ori' ? 'Ori tanpa nasi' : `${item.name} tanpa nasi`}: <strong>{formatRupiah(item.prices.tanpaNasi)}</strong>
                    </span>
                    <span className="px-1.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 sm:px-2">
                      {item.id === 'ori' ? 'Ori + nasi' : `${item.name} + nasi`}: <strong>{formatRupiah(item.prices.denganNasi)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 pt-0 sm:p-5 sm:pt-0">
                <button
                  type="button"
                  onClick={() => openCustomizer(item)}
                  className="w-full rounded-xl bg-amber-500 px-2 py-2.5 text-[10px] font-extrabold text-stone-950 shadow-sm transition-colors hover:bg-amber-400 sm:px-4 sm:text-xs"
                >
                  <span>Pesan · {formatRupiah(startingPrice)}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Item Customizer Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-stone-200"
                />
                <div>
                  <h3 className="text-lg font-black text-stone-900">{selectedProduct.name}</h3>
                  <p className="text-xs text-stone-500">{selectedProduct.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Variant Option */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Pilih Paket Ayam
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVariant('tanpa_nasi')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    variant === 'tanpa_nasi'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span className="block text-xs font-bold text-stone-900">{selectedProduct.id === 'ori' ? 'Ori (Tanpa Nasi)' : selectedProduct.id === 'mentai' ? 'Mentai (Tanpa Nasi)' : 'Ayam + Saus'}</span>
                  <span className="block text-xs text-amber-700 font-extrabold mt-1">
                    {formatRupiah(selectedProduct.prices.tanpaNasi)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVariant('dengan_nasi')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    variant === 'dengan_nasi'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span className="block text-xs font-bold text-stone-900">{selectedProduct.id === 'ori' ? 'Ori + Nasi' : selectedProduct.id === 'mentai' ? 'Mentai + Nasi' : 'Ayam + Saus + Nasi'}</span>
                  <span className="block text-xs text-amber-700 font-extrabold mt-1">
                    {formatRupiah(selectedProduct.prices.denganNasi)}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-stone-500">
                {selectedProduct.id === 'mentai'
                  ? 'Mentai: Rp14.000 tanpa nasi • Rp18.000 dengan nasi.'
                  : selectedProduct.id === 'ori'
                    ? 'Ori: Rp10.000 tanpa nasi • Rp13.000 dengan nasi.'
                    : 'Saus lainnya: Rp12.000 tanpa nasi • Rp16.000 dengan nasi.'}
              </p>
            </div>

            {/* Chicken Part Preference */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Preferensi Bagian Ayam
                </label>
                <span className="text-[10px] text-amber-700 font-semibold">Opsional</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {['Bebas', 'Minta dada', 'Minta paha', 'Minta sayap'].map((part) => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => setChickenPartNote(part)}
                    className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all ${
                      chickenPartNote === part
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {part}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-stone-500 italic">
                *Permintaan bagian ayam menyesuaikan ketersediaan di outlet saat pesanan diproses.
              </p>
            </div>

            {/* Extras Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Pilihan Tambahan (Extra)
              </label>

              {/* Extra Saus */}
              <div className="p-3 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-2">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Extra Saus</span>
                  <span className="text-[11px] text-stone-500">Ketik sendiri saus yang diinginkan • Rp2.000 / porsi</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={extraSausName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setExtraSausName(value);
                      if (!value.trim()) setExtraSausCount(0);
                      else if (extraSausCount === 0) setExtraSausCount(1);
                    }}
                    placeholder="Contoh: Keju, Sadis, BBQ..."
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setExtraSausCount((c) => Math.max(0, c - 1))}
                      className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-800 text-sm"
                    >-</button>
                    <span className="text-xs font-bold w-4 text-center">{extraSausCount}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (extraSausName.trim()) setExtraSausCount((c) => c + 1);
                      }}
                      className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-800 text-sm"
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Extra Nasi */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 bg-stone-50/50">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Extra Nasi Putih</span>
                  <span className="text-[11px] text-stone-500">+Rp4.000 / porsi</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExtraNasiCount((c) => Math.max(0, c - 1))}
                    className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 font-bold text-stone-800 text-sm"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{extraNasiCount}</span>
                  <button
                    type="button"
                    onClick={() => setExtraNasiCount((c) => c + 1)}
                    className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 font-bold text-stone-800 text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Quantity and Final Subtotal button */}
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold text-stone-900"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-xs">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold text-stone-900"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm transition-colors flex items-center justify-between shadow-md"
              >
                <span>Tambahkan</span>
                <span>
                  {formatRupiah(
                    (getVariantPrice(selectedProduct, variant) +
                      (extraSausName.trim() ? extraSausCount : 0) * 2000 +
                      extraNasiCount * 4000) *
                      quantity
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
