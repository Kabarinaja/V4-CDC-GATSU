import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  formatRupiah,
  pointsToRupiah,
  generateOrderNumber,
  MIN_POINT_REDEEM,
  POINT_VALUE_IN_RUPIAH,
} from '../lib/utils';
import { uploadToCloudinary } from '../lib/cloudinary';
import { ShippingArea, Order } from '../types';
import {
  Trash2,
  Plus,
  Minus,
  Truck,
  Award,
  Upload,
  QrCode,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Download,
  Info,
} from 'lucide-react';
import { doc, setDoc, serverTimestamp, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import confetti from 'canvas-confetti';

const QRIS_IMAGE_URL = 'https://cdn.phototourl.com/member/2026-10-04-fbcdab0a-d217-4805-a1f1-1f77b618f546.jpg';

export const CheckoutPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, cartSubtotal } = useCart();
  const { profile, currentUser } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // Form Fields
  const [recipientName, setRecipientName] = useState(profile?.name || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressNote, setAddressNote] = useState('');
  const [shippingArea, setShippingArea] = useState<ShippingArea>('indramayu_kota');
  const [orderNote, setOrderNote] = useState('');

  // Points redemption
  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [pointsInput, setPointsInput] = useState('');
  const [qrisImageUrl, setQrisImageUrl] = useState(QRIS_IMAGE_URL);

  // Payment proof file & upload state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');

  useEffect(() => {
    return onSnapshot(doc(db, 'appSettings', 'payment'), snap => {
      const url = snap.exists() ? snap.data().qrisImageUrl : '';
      if (typeof url === 'string' && url.startsWith('https://')) setQrisImageUrl(url);
    }, err => console.warn('QRIS setting:', err));
  }, []);

  // Calculations
  const shippingFee = shippingArea === 'indramayu_kota' ? 9000 : 15000;
  const userBalance = profile?.points || 0;
  const maxPossiblePointsToRedeem = Math.min(
    userBalance,
    Math.floor(cartSubtotal / POINT_VALUE_IN_RUPIAH)
  );

  const effectivePointsToUse = pointsToUse >= MIN_POINT_REDEEM
    ? Math.min(pointsToUse, userBalance, Math.floor(cartSubtotal / POINT_VALUE_IN_RUPIAH))
    : 0;
  const discountFromPoints = effectivePointsToUse * POINT_VALUE_IN_RUPIAH;
  const finalTotal = Math.max(0, cartSubtotal - discountFromPoints + shippingFee);

  const handlePointChange = (val: number, rawValue?: string) => {
    if (rawValue !== undefined) setPointsInput(rawValue);
    if (!Number.isFinite(val) || val < 0) { setPointsToUse(0); return; }
    // Do not force the minimum during typing: the user must be able to type 10 naturally.
    setPointsToUse(Math.floor(val * 2) / 2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !profile) {
      showToast('Silakan login atau daftar akun terlebih dahulu untuk melanjutkan pemesanan.', 'error', 'Perlu Login');
      navigate('/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      showToast('Keranjang pesanan masih kosong.', 'error');
      return;
    }

    if (!recipientName.trim()) {
      showToast('Nama penerima wajib diisi.', 'error', 'Validasi Gagal');
      return;
    }

    if (!whatsapp.trim()) {
      showToast('Nomor WhatsApp aktif wajib diisi.', 'error', 'Validasi Gagal');
      return;
    }

    if (!deliveryAddress.trim()) {
      showToast('Alamat lengkap pengantaran wajib diisi.', 'error', 'Validasi Gagal');
      return;
    }

    if (!proofFile) {
      showToast('Wajib mengunggah bukti transfer QRIS sebelum mengirim pesanan.', 'error', 'Bukti Diperlukan');
      return;
    }

    setIsSubmitting(true);
    setUploadStatusText('Sedang mengunggah bukti pembayaran...');

    try {
      // 1. Upload proof to Cloudinary in folder payment-proofs
      let proofUrl = '';
      try {
        proofUrl = await uploadToCloudinary(proofFile, 'payment-proofs');
      } catch (uploadErr) {
        throw new Error('Gagal mengunggah bukti pembayaran. Silakan coba lagi.');
      }

      setUploadStatusText('Menyimpan data pesanan...');

      // 2. Generate unique order ID
      const orderId = doc(collection(db, 'orders')).id;
      const orderNumber = generateOrderNumber();

      // Firestore rejects `undefined` anywhere in an object, including nested
      // cart items. Normalize optional values before writing the order.
      const firestoreItems = items.map((item) => ({
        ...item,
        extraSausName: item.extraSausName ?? '',
        chickenPartNote: item.chickenPartNote ?? 'Bebas',
        productImage: item.productImage ?? '',
        extraSausCount: item.extraSausCount ?? 0,
        extraSausPrice: item.extraSausPrice ?? 0,
        extraNasiCount: item.extraNasiCount ?? 0,
        extraNasiPrice: item.extraNasiPrice ?? 0,
        quantity: item.quantity ?? 1,
        itemSubtotal: item.itemSubtotal ?? 0,
      }));

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        userId: currentUser.uid,
        memberId: profile.memberId ?? '',
        customerName: recipientName.trim(),
        customerWhatsapp: whatsapp.trim(),
        deliveryAddress: deliveryAddress.trim(),
        addressNote: (addressNote + (orderNote ? ` | Catatan: ${orderNote}` : '')).trim(),
        shippingArea,
        shippingFee: shippingFee ?? 0,
        items: firestoreItems,
        subtotal: cartSubtotal ?? 0,
        pointsRedeemed: discountFromPoints > 0 ? effectivePointsToUse : 0,
        discountFromPoints: discountFromPoints ?? 0,
        total: finalTotal ?? 0,
        paymentMethod: 'qris',
        paymentProofUrl: proofUrl ?? '',
        paymentStatus: 'pending_verification',
        orderStatus: 'payment_verification',
        orderType: 'delivery',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'orders', orderId), {
        ...newOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Clear cart
      clearCart();

      // Confetti effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      showToast(
        'Bukti pembayaran berhasil dikirim. Pesanan masuk antrean verifikasi kasir.',
        'success',
        'Pesanan Diterima!'
      );

      navigate(`/pesanan/${orderId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat memproses pesanan.';
      showToast(msg, 'error', 'Gagal Memproses');
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-stone-900">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-stone-600 max-w-sm mx-auto">
          Anda belum memilih menu ayam crispy favorit. Silakan buka menu untuk menambahkan hidangan lezat kami.
        </p>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-md"
        >
          <span>Pilih Menu Sekarang</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          Checkout & Pembayaran QRIS
        </h1>
        <p className="text-xs text-stone-600">
          Lengkapi data pengantaran dan lakukan pembayaran melalui scan QRIS resmi MY CDC GATSU.
        </p>
      </div>

      {!currentUser && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Masuk ke akun member untuk menggunakan poin diskon dan melacak pesananmu.</span>
          </div>
          <Link
            to="/login?redirect=/checkout"
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 shrink-0 shadow-sm"
          >
            Masuk / Daftar
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Delivery form & Cart Items summary */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Item list */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider">
                Item Pesanan ({items.length})
              </h2>
              <Link to="/menu" className="text-xs font-bold text-amber-600 hover:underline">
                + Tambah Item
              </Link>
            </div>

            <div className="divide-y divide-stone-100 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                    />
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs sm:text-sm text-stone-900">
                        {item.productName} ({item.variantLabel})
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Bagian: <span className="font-medium text-stone-700">{item.chickenPartNote}</span>
                      </p>
                      {(item.extraSausCount > 0 || item.extraNasiCount > 0) && (
                        <p className="text-[10px] text-amber-700 font-semibold">
                          {item.extraSausCount > 0 && `+${item.extraSausCount} Extra Saus${item.extraSausName ? ` (${item.extraSausName})` : ''} `}
                          {item.extraNasiCount > 0 && `+${item.extraNasiCount} Extra Nasi`}
                        </p>
                      )}
                      <p className="text-xs font-extrabold text-stone-900 pt-0.5">
                        {formatRupiah(item.itemSubtotal)}
                      </p>
                    </div>
                  </div>

                  {/* Quantity adjustment */}
                  <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded-lg bg-white text-stone-800 shadow-xs hover:bg-stone-200"
                      aria-label="Kurangi jumlah"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-lg bg-white text-stone-800 shadow-xs hover:bg-stone-200"
                      aria-label="Tambah jumlah"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 ml-1 text-stone-400 hover:text-rose-600 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Destination & Recipient */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-4 shadow-sm">
            <h2 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Informasi Pengantaran (Delivery)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Nama Penerima *</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Nomor WhatsApp Aktif *</label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Contoh: 082379474173"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Shipping Area Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Pilih Wilayah Ongkos Kirim *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label
                  className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    shippingArea === 'indramayu_kota'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="shippingArea"
                      checked={shippingArea === 'indramayu_kota'}
                      onChange={() => setShippingArea('indramayu_kota')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">Indramayu Kota</span>
                      <span className="text-[11px] text-stone-500">Kecamatan Indramayu</span>
                    </div>
                  </div>
                  <strong className="text-xs font-black text-amber-700">Rp9.000</strong>
                </label>

                <label
                  className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    shippingArea === 'luar_indramayu_kota'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="shippingArea"
                      checked={shippingArea === 'luar_indramayu_kota'}
                      onChange={() => setShippingArea('luar_indramayu_kota')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">Luar Indramayu Kota</span>
                      <span className="text-[11px] text-stone-500">Sindang, Balongan, Lohbener, dll</span>
                    </div>
                  </div>
                  <strong className="text-xs font-black text-amber-700">Rp15.000</strong>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Alamat Lengkap Pengantaran *</label>
              <textarea
                required
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, atau blok..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Patokan Alamat (Opsional)</label>
              <input
                type="text"
                value={addressNote}
                onChange={(e) => setAddressNote(e.target.value)}
                placeholder="Contoh: Depan masjid hijau / pagar hitam rumah cat biru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Catatan Pesanan Tambahan (Opsional)</label>
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Contoh: Saus dipisah / paha atas jika ada"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Loyalty Point Redemption */}
          {profile && (
            <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <h3 className="font-extrabold text-sm text-stone-900">Gunakan Poin Member</h3>
                </div>
                <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Saldo: {userBalance} Poin ({formatRupiah(userBalance * POINT_VALUE_IN_RUPIAH)})
                </span>
              </div>

              {userBalance < MIN_POINT_REDEEM ? (
                <p className="text-xs text-stone-500">
                  Minimal redeem adalah <strong>10 Poin (= Rp1.000)</strong>. Kumpulkan terus poin dari pesanan Anda untuk mendapatkan diskon belanja!
                </p>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[0, 10, 20, 30, 50, 100].map((pts) => {
                      if (pts > maxPossiblePointsToRedeem && pts !== 0) return null;
                      return (
                        <button
                          key={pts}
                          type="button"
                          onClick={() => handlePointChange(pts, pts === 0 ? '' : String(pts))}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                            pointsToUse === pts
                              ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {pts === 0 ? 'Tanpa Poin' : `${pts} Poin (-${formatRupiah(pts * POINT_VALUE_IN_RUPIAH)})`}
                        </button>
                      );
                    })}
                  </div>
                  <label className="block space-y-1 text-xs text-stone-600">
                    <span>Jumlah poin yang ditukar (boleh kelipatan 0,5)</span>
                    <input type="number" min={10} max={maxPossiblePointsToRedeem} step={0.5} value={pointsInput} onChange={(e) => handlePointChange(e.target.value === '' ? 0 : Number(e.target.value), e.target.value)} placeholder="Masukkan poin" className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" />
                  </label>
                  {effectivePointsToUse >= MIN_POINT_REDEEM && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                      <span>Diskon poin diterapkan ({effectivePointsToUse} poin):</span>
                      <strong className="font-extrabold">-{formatRupiah(discountFromPoints)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: QRIS Payment Box & Cloudinary Upload */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border-2 border-amber-500/80 p-5 sm:p-6 space-y-5 shadow-lg sticky top-20">
            {/* Price Summary */}
            <div className="space-y-2 pb-4 border-b border-stone-200">
              <h3 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider">
                Ringkasan Biaya
              </h3>

              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal Menu</span>
                  <span className="font-semibold text-stone-800">{formatRupiah(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkir ({shippingArea === 'indramayu_kota' ? 'Indramayu Kota' : 'Luar Kota'})</span>
                  <span className="font-semibold text-stone-800">{formatRupiah(shippingFee)}</span>
                </div>
                {discountFromPoints > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Diskon Poin ({pointsToUse} Poin)</span>
                    <span>-{formatRupiah(discountFromPoints)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                  <span className="text-sm font-extrabold text-stone-900">Total Pembayaran</span>
                  <span className="text-xl font-black text-amber-600">{formatRupiah(finalTotal)}</span>
                </div>
              </div>
            </div>

            {/* QRIS Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-600" />
                  <h4 className="font-black text-sm text-stone-900">Bayar via QRIS Resmi</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-stone-900 text-amber-400 text-[10px] font-bold">
                  Bebas Biaya Admin
                </span>
              </div>

              <p className="text-[11px] text-stone-500 leading-snug">
                Pindai kode QRIS di bawah menggunakan BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay, atau m-Banking Anda:
              </p>

              {/* QRIS Image Container */}
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 flex flex-col items-center">
                <img
                  src={qrisImageUrl}
                  alt="QRIS MY CDC GATSU"
                  className="w-full max-w-[220px] rounded-xl shadow-sm border border-stone-200"
                />
                <a
                  href={qrisImageUrl}
                  download="QRIS_MY_CDC_GATSU.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / Buka Gambar QRIS</span>
                </a>
              </div>

              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold">Langkah Pembayaran:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-stone-700">
                  <li>Scan QRIS dengan nominal pas: <strong>{formatRupiah(finalTotal)}</strong></li>
                  <li>Simpan screenshot bukti transfer berhasil</li>
                  <li>Unggah screenshot pada form di bawah</li>
                </ol>
              </div>
            </div>

            {/* Cloudinary Upload Section */}
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                <span>Upload Bukti Transfer QRIS *</span>
                <span className="text-[10px] font-semibold text-rose-600">Wajib Dilampirkan</span>
              </label>

              <div className="border-2 border-dashed border-stone-300 rounded-2xl p-4 text-center hover:border-amber-500 transition-colors bg-stone-50/60">
                {proofPreview ? (
                  <div className="space-y-2">
                    <img
                      src={proofPreview}
                      alt="Preview Bukti Transfer"
                      className="max-h-40 mx-auto rounded-xl object-contain shadow-sm border border-stone-200"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Foto bukti siap dikirim</span>
                      </span>
                      <label
                        htmlFor="proof-upload"
                        className="text-xs font-bold text-amber-600 underline cursor-pointer hover:text-amber-700"
                      >
                        Ganti Foto
                      </label>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="proof-upload"
                    className="flex flex-col items-center justify-center cursor-pointer py-3 space-y-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">Pilih screenshot bukti</span>
                      <span className="text-[10px] text-stone-500">Format JPG, PNG, atau WEBP</span>
                    </div>
                  </label>
                )}
                <input
                  id="proof-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-stone-300 disabled:cursor-not-allowed text-stone-950 font-black text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>{uploadStatusText || 'Memproses Pesanan...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-stone-950" />
                  <span>Kirim Pesanan & Bukti QRIS ({formatRupiah(finalTotal)})</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-stone-500">
              *Pesanan akan langsung diverifikasi kasir outlet CDC GATSU sesaat setelah bukti dikirim.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
