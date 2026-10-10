import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/common/OrderBadge';
import { formatRupiah, formatDateIndo } from '../lib/utils';
import { uploadToCloudinary } from '../lib/cloudinary';
import {
  ArrowLeft,
  Clock,
  Truck,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Upload,
  ChefHat,
  Package,
  Check,
  Receipt,
  Eye,
} from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { currentUser } = useAuth();
  const { showToast } = useNotification();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Re-upload state if rejected
  const [reuploadFile, setReuploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const docRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setOrder({ id: snapshot.id, ...snapshot.data() } as Order);
        } else {
          setOrder(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Order detail snapshot note:', err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  const handleReuploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !reuploadFile) return;

    setIsUploading(true);
    try {
      const newUrl = await uploadToCloudinary(reuploadFile, 'payment-proofs');

      await updateDoc(doc(db, 'orders', order.id), {
        paymentProofUrl: newUrl,
        paymentStatus: 'pending_verification',
        paymentRejectionReason: '',
        orderStatus: 'payment_verification',
        updatedAt: serverTimestamp(),
      });

      showToast('Bukti pembayaran baru berhasil dikirim ulang ke kasir!', 'success', 'Terkirim');
      setReuploadFile(null);
    } catch (err) {
      showToast('Gagal mengunggah bukti pembayaran baru.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-stone-600">Memuat detail pesanan #{orderId}...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-stone-900">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-stone-600">Pesanan dengan ID tersebut tidak tersedia atau sudah dihapus.</p>
        <Link
          to="/pesanan"
          className="inline-block py-2.5 px-5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
        >
          Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  // Stepper timeline definition
  const steps: { key: OrderStatus; label: string; icon: any }[] = [
    { key: 'payment_verification', label: 'Verifikasi Kasir', icon: Clock },
    { key: 'accepted', label: 'Diterima Outlet', icon: CheckCircle2 },
    { key: 'cooking', label: 'Sedang Dimasak', icon: ChefHat },
    { key: 'packing', label: 'Sedang Dikemas', icon: Package },
    { key: 'shipping', label: 'Diantar Kurir', icon: Truck },
    { key: 'completed', label: 'Selesai', icon: Check },
  ];

  const orderStatusIndex = steps.findIndex((s) => s.key === order.orderStatus);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      {/* Top Bar with back link */}
      <div className="flex items-center justify-between">
        <Link
          to="/pesanan"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Riwayat</span>
        </Link>
        <Link
          to={`/chat?orderId=${order.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors shadow-xs"
        >
          <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Chat Outlet Soal Pesanan Ini</span>
        </Link>
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-sm">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Nomor Pesanan</span>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">
              {order.orderNumber || order.id}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Dipesan pada: {formatDateIndo(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.orderStatus} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>

        {/* Real-time Order Tracking Stepper */}
        {order.orderStatus !== 'cancelled' && (
          <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-stone-600 mb-4">
              Lacak Proses Pesanan
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {steps.map((st, idx) => {
                const Icon = st.icon;
                const isPassed = orderStatusIndex >= idx;
                const isCurrent = order.orderStatus === st.key;

                return (
                  <div
                    key={st.key}
                    className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                        : isPassed
                        ? 'text-emerald-700 font-semibold'
                        : 'text-stone-400 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                        isCurrent
                          ? 'bg-stone-950 text-amber-400'
                          : isPassed
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] leading-tight">{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Rejected Alert & Re-upload Form */}
        {order.paymentStatus === 'rejected' && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-rose-900">Pembayaran Ditolak Kasir</h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  Alasan: <strong>{order.paymentRejectionReason || 'Nominal tidak sesuai atau bukti transfer tidak terbaca.'}</strong>
                </p>
                <p className="text-xs text-stone-700 mt-1">
                  Silakan unggah screenshot bukti transfer yang valid di bawah agar pesanan dapat segera diproses.
                </p>
              </div>
            </div>

            <form onSubmit={handleReuploadProof} className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setReuploadFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-stone-900 file:text-white hover:file:bg-stone-800"
              />
              <button
                type="submit"
                disabled={isUploading || !reuploadFile}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors shrink-0 shadow-sm"
              >
                {isUploading ? 'Mengunggah...' : 'Kirim Bukti Baru'}
              </button>
            </form>
          </div>
        )}

        {/* Items List Breakdown */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-stone-700">
            Rincian Menu Dipesan
          </h3>

          <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 p-4 space-y-3">
            {order.items?.map((it, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <img
                    src={it.productImage}
                    alt={it.productName}
                    className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                  />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-stone-900">
                      {it.quantity}x {it.productName} ({it.variantLabel})
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Bagian: <span className="font-semibold text-stone-700">{it.chickenPartNote || 'Bebas'}</span>
                    </p>
                    {(it.extraSausCount > 0 || it.extraNasiCount > 0) && (
                      <p className="text-[10px] text-amber-700 font-semibold">
                        {it.extraSausCount > 0 && `+${it.extraSausCount} Extra Saus${it.extraSausName ? ` (${it.extraSausName})` : ''} `}
                        {it.extraNasiCount > 0 && `+${it.extraNasiCount} Extra Nasi`}
                      </p>
                    )}
                  </div>
                </div>

                <span className="font-black text-xs text-stone-900">
                  {formatRupiah(it.itemSubtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2 text-xs text-stone-700">
          <div className="flex justify-between">
            <span>Subtotal Menu</span>
            <span className="font-semibold">{formatRupiah(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Ongkos Kirim ({order.shippingArea === 'indramayu_kota' ? 'Indramayu Kota' : 'Luar Kota'})</span>
            <span className="font-semibold">{formatRupiah(order.shippingFee)}</span>
          </div>
          {order.discountFromPoints > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Diskon Poin ({order.pointsRedeemed} Poin)</span>
              <span>-{formatRupiah(order.discountFromPoints)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline font-black text-sm text-stone-900">
            <span>Total Pembayaran (QRIS)</span>
            <span className="text-base text-amber-600">{formatRupiah(order.total)}</span>
          </div>
        </div>

        {/* Delivery Destination & Proof Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Destination */}
          <div className="p-4 rounded-2xl border border-stone-200 space-y-2">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-stone-500">
              Alamat Pengantaran
            </h4>
            <p className="text-xs font-bold text-stone-900">{order.customerName} ({order.customerWhatsapp})</p>
            <p className="text-xs text-stone-600 leading-relaxed">{order.deliveryAddress}</p>
            {order.addressNote && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                <strong>Catatan / Patokan:</strong> {order.addressNote}
              </p>
            )}
          </div>

          {/* Payment Proof Image */}
          <div className="p-4 rounded-2xl border border-stone-200 space-y-2">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-stone-500">
              Bukti Transfer QRIS
            </h4>
            {order.paymentProofUrl ? (
              <div className="space-y-1.5">
                <a
                  href={order.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative aspect-video w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-100 group"
                >
                  <img
                    src={order.paymentProofUrl}
                    alt="Bukti Transfer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                    <Eye className="w-4 h-4" />
                    <span>Lihat Ukuran Penuh</span>
                  </div>
                </a>
                <span className="text-[10px] text-stone-500 block text-center">Klik gambar untuk memperbesar</span>
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">Belum ada bukti pembayaran diunggah.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
