import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp, runTransaction, addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, OrderStatus, PaymentStatus, PointTransaction } from '../../types';
import { formatRupiah, formatDateIndo, rupiahToPoints } from '../../lib/utils';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/OrderBadge';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ChefHat,
  Package,
  Truck,
  Check,
  Award,
  Eye,
  MessageCircle,
  FileText,
  AlertTriangle,
  Archive,
} from 'lucide-react';

export const AdminOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { showToast } = useNotification();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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
        console.warn('Admin order detail note:', err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  if (loading) {
    return <div className="py-16 text-center text-stone-400 text-xs">Memuat detail pesanan...</div>;
  }

  if (!order) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-white font-bold">Pesanan tidak ditemukan.</p>
        <Link to="/admin/orders" className="text-xs text-amber-400 hover:underline">
          &lt; Kembali ke Semua Pesanan
        </Link>
      </div>
    );
  }

  // 1. Verify Payment Action
  const handleVerifyPayment = async () => {
    if (!order) return;
    setUpdating(true);

    try {
      const orderRef = doc(db, 'orders', order.id);

      await runTransaction(db, async (transaction) => {
        const liveOrderSnap = await transaction.get(orderRef);
        if (!liveOrderSnap.exists()) throw new Error('Pesanan tidak ditemukan.');
        const liveOrder = liveOrderSnap.data();
        if (liveOrder.paymentStatus !== 'pending_verification' || liveOrder.orderStatus === 'completed') {
          throw new Error('Pesanan sudah diproses atau tidak lagi menunggu verifikasi.');
        }
        const redeemed = Number(liveOrder.pointsRedeemed) || 0;
        if (redeemed > 0) {
          const userRef = doc(db, 'users', liveOrder.userId);
          const userSnap = await transaction.get(userRef);
          if (!userSnap.exists()) throw new Error('Profil member untuk penukaran poin tidak ditemukan.');
          const currentPts = Number(userSnap.data().points) || 0;
          if (currentPts < redeemed) throw new Error('Saldo poin member tidak cukup lagi. Poin tidak dipotong; tinjau pesanan ini sebelum verifikasi.');
          transaction.update(userRef, { points: currentPts - redeemed, updatedAt: serverTimestamp() });
          const ptRef = doc(collection(db, 'pointTransactions'));
          transaction.set(ptRef, {
            id: ptRef.id, userId: liveOrder.userId, memberId: liveOrder.memberId,
            amount: -redeemed, type: 'redeem',
            description: `Redeem diskon pesanan #${liveOrder.orderNumber || order.id}`,
            orderId: order.id, adminUid: currentUser?.uid, createdAt: serverTimestamp(),
          });
        }

        // Payment status and points debit commit together exactly once.
        transaction.update(orderRef, {
          paymentStatus: 'verified', orderStatus: 'accepted', updatedAt: serverTimestamp(),
        });

        // Add admin log
        const logRef = doc(collection(db, 'adminLogs'));
        transaction.set(logRef, {
          adminUid: currentUser?.uid,
          action: 'VERIFY_PAYMENT',
          targetType: 'order',
          targetId: order.id,
          details: `Pembayaran QRIS diverifikasi valid oleh admin`,
          createdAt: serverTimestamp(),
        });
      });

      showToast('Pembayaran QRIS berhasil diverifikasi. Pesanan diterima!', 'success', 'Diverifikasi');
    } catch (err) {
      console.error(err);
      showToast('Gagal memverifikasi pembayaran.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // 2. Reject Payment Action
  const handleRejectPayment = async () => {
    if (!order || !rejectionReason.trim()) {
      showToast('Alasan penolakan wajib ditulis.', 'error');
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        paymentStatus: 'rejected',
        paymentRejectionReason: rejectionReason.trim(),
        updatedAt: serverTimestamp(),
      });

      // Admin log
      await addDoc(collection(db, 'adminLogs'), {
        adminUid: currentUser?.uid,
        action: 'REJECT_PAYMENT',
        targetType: 'order',
        targetId: order.id,
        details: `Pembayaran ditolak: ${rejectionReason.trim()}`,
        createdAt: serverTimestamp(),
      });

      showToast('Status pembayaran diubah menjadi Ditolak.', 'info', 'Pembayaran Ditolak');
      setRejectModalOpen(false);
    } catch (err) {
      showToast('Gagal menolak pembayaran.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleArchiveCompletedOrder = async () => {
    if (!order || order.orderStatus !== 'completed' || order.archivedAt) return;
    const confirmed = window.confirm(`Arsipkan transaksi ${order.orderNumber || order.id}? Data transaksi dan riwayat poin tidak dihapus; transaksi hanya disembunyikan dari rekap aktif.`);
    if (!confirmed) return;
    setUpdating(true);
    try {
      await runTransaction(db, async transaction => {
        const ref = doc(db, 'orders', order.id);
        const snap = await transaction.get(ref);
        if (!snap.exists() || snap.data().orderStatus !== 'completed') throw new Error('Hanya transaksi selesai yang dapat diarsipkan.');
        if (snap.data().archivedAt) throw new Error('Transaksi sudah diarsipkan.');
        transaction.update(ref, { archivedAt: serverTimestamp(), archivedBy: currentUser?.uid || '', updatedAt: serverTimestamp() });
        const log = doc(collection(db, 'adminLogs'));
        transaction.set(log, { adminUid: currentUser?.uid, action: 'ORDER_ARCHIVED', targetType: 'order', targetId: order.id, details: `Transaksi selesai diarsipkan; poin dan ledger tidak diubah`, createdAt: serverTimestamp() });
      });
      showToast('Transaksi diarsipkan. Profil dan saldo poin tetap utuh.', 'success');
    } catch (error: any) { showToast(error?.message || 'Gagal mengarsipkan transaksi.', 'error'); }
    finally { setUpdating(false); }
  };

  // 3. Update Order Status Step
  const handleSetOrderStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);

    try {
      const orderRef = doc(db, 'orders', order.id);

      // If completing order, award reward points to customer
      if (newStatus === 'completed' && order.orderStatus !== 'completed') {
        const rewardPoints = rupiahToPoints(order.subtotal);

        await runTransaction(db, async (transaction) => {
          const liveOrderSnap = await transaction.get(orderRef);
          if (!liveOrderSnap.exists()) throw new Error('Pesanan tidak ditemukan.');
          if (liveOrderSnap.data().orderStatus === 'completed') return;
          const userRef = doc(db, 'users', order.userId);
          const userSnap = await transaction.get(userRef);

          if (userSnap.exists()) {
            const currentPts = Number(userSnap.data().points) || 0;
            transaction.update(userRef, {
              points: currentPts + rewardPoints,
              updatedAt: serverTimestamp(),
            });

            // Ledger record
            const ptRef = doc(collection(db, 'pointTransactions'));
            transaction.set(ptRef, {
              id: ptRef.id,
              userId: order.userId,
              memberId: order.memberId,
              amount: rewardPoints,
              type: 'reward',
              description: `Poin reward pesanan selesai #${order.orderNumber || order.id}`,
              orderId: order.id,
              adminUid: currentUser?.uid,
              createdAt: serverTimestamp(),
            });
          }

          transaction.update(orderRef, {
            orderStatus: 'completed',
            updatedAt: serverTimestamp(),
          });

          const logRef = doc(collection(db, 'adminLogs'));
          transaction.set(logRef, {
            adminUid: currentUser?.uid,
            action: 'ORDER_COMPLETED',
            targetType: 'order',
            targetId: order.id,
            details: `Pesanan selesai, reward ${rewardPoints} poin diberikan ke member`,
            createdAt: serverTimestamp(),
          });
        });

        showToast(`Pesanan selesai! Member mendapat reward +${rewardPoints} poin.`, 'success', 'Pesanan Selesai');
      } else {
        await updateDoc(orderRef, {
          orderStatus: newStatus,
          updatedAt: serverTimestamp(),
        });
        showToast(`Status pesanan diperbarui menjadi: ${newStatus}`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal mengubah status pesanan.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-800">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pesanan</span>
        </Link>
        <Link
          to={`/admin/chat?userId=${order.userId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 text-stone-200 text-xs font-bold hover:bg-stone-750 transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-amber-400" />
          <span>Buka Chat Pelanggan</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="bg-stone-950 border border-stone-800 rounded-3xl p-6 space-y-6 shadow-xl text-stone-200">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-850 gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Kelola Pesanan</span>
            <h1 className="text-xl font-black text-white font-mono">{order.orderNumber || order.id}</h1>
            <p className="text-xs text-stone-400 mt-0.5">{formatDateIndo(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.orderStatus} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>

        {/* Action Panel: Payment Verification */}
        {order.paymentStatus === 'pending_verification' && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                <h3 className="font-extrabold text-sm text-white">Verifikasi Pembayaran QRIS</h3>
              </div>
              <span className="text-xs font-black text-amber-400">{formatRupiah(order.total)}</span>
            </div>
            <p className="text-xs text-stone-300">
              Periksa screenshot bukti transfer pelanggan di bawah. Jika nominal dan nama rekening valid, setujui pembayaran agar dapur dapat mulai memasak.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={updating}
                onClick={handleVerifyPayment}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-colors flex items-center gap-1.5 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terima & Verifikasi Pembayaran</span>
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => setRejectModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 font-extrabold text-xs transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Tolak Pembayaran</span>
              </button>
            </div>
          </div>
        )}

        {/* Status Workflow Controls */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-850 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Kendalikan Status Pemrosesan Pesanan
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <button
              type="button"
              disabled={updating || order.orderStatus === 'accepted'}
              onClick={() => handleSetOrderStatus('accepted')}
              className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                order.orderStatus === 'accepted'
                  ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                  : 'bg-stone-850 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              1. Diterima
            </button>
            <button
              type="button"
              disabled={updating || order.orderStatus === 'cooking'}
              onClick={() => handleSetOrderStatus('cooking')}
              className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                order.orderStatus === 'cooking'
                  ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                  : 'bg-stone-850 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              2. Dimasak
            </button>
            <button
              type="button"
              disabled={updating || order.orderStatus === 'packing'}
              onClick={() => handleSetOrderStatus('packing')}
              className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                order.orderStatus === 'packing'
                  ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                  : 'bg-stone-850 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              3. Dikemas
            </button>
            <button
              type="button"
              disabled={updating || order.orderStatus === 'shipping'}
              onClick={() => handleSetOrderStatus('shipping')}
              className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                order.orderStatus === 'shipping'
                  ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                  : 'bg-stone-850 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              4. Diantar Kurir
            </button>
            <button
              type="button"
              disabled={updating || order.orderStatus === 'completed'}
              onClick={() => handleSetOrderStatus('completed')}
              className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                order.orderStatus === 'completed'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-stone-850 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              5. Selesai (+Reward)
            </button>
          </div>
          {order.orderStatus === 'completed' && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-800 bg-stone-900 p-3">
              <p className="text-xs text-stone-400">Arsip hanya mengeluarkan transaksi dari rekap aktif. Riwayat poin tidak dihapus atau dikoreksi.</p>
              {order.archivedAt ? <span className="text-xs font-bold text-stone-400">Sudah diarsipkan</span> : <button type="button" disabled={updating} onClick={handleArchiveCompletedOrder} className="inline-flex items-center gap-2 rounded-xl border border-amber-700 px-3 py-2 text-xs font-bold text-amber-300 disabled:opacity-50"><Archive className="h-4 w-4"/> {updating ? 'Memproses…' : 'Arsipkan transaksi selesai'}</button>}
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer & Address */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-850 space-y-2 text-xs">
              <h4 className="font-extrabold text-stone-400 uppercase tracking-wider text-[10px]">
                Informasi Pelanggan
              </h4>
              <p className="font-bold text-white text-sm">{order.customerName}</p>
              <p className="text-stone-300">
                WhatsApp: <a href={`https://wa.me/62${order.customerWhatsapp.replace(/^0/, '')}`} target="_blank" rel="noreferrer" className="text-amber-400 underline font-mono">{order.customerWhatsapp}</a>
              </p>
              <p className="text-stone-400">
                Member ID: <strong className="text-amber-400 font-mono">{order.memberId}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-850 space-y-2 text-xs">
              <h4 className="font-extrabold text-stone-400 uppercase tracking-wider text-[10px]">
                Alamat Pengantaran ({order.shippingArea === 'indramayu_kota' ? 'Indramayu Kota - 9rb' : 'Luar Kota - 15rb'})
              </h4>
              <p className="text-stone-200 leading-relaxed">{order.deliveryAddress}</p>
              {order.addressNote && (
                <p className="text-amber-300/90 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40 text-[11px]">
                  <strong>Patokan/Catatan:</strong> {order.addressNote}
                </p>
              )}
            </div>
          </div>

          {/* Payment Proof Preview Box */}
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-850 space-y-2 text-xs">
            <h4 className="font-extrabold text-stone-400 uppercase tracking-wider text-[10px]">
              Bukti Transfer QRIS Terlampir
            </h4>
            {order.paymentProofUrl ? (
              <div className="space-y-2">
                <a
                  href={order.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative aspect-video w-full rounded-xl overflow-hidden border border-stone-800 bg-black group"
                >
                  <img
                    src={order.paymentProofUrl}
                    alt="Bukti Transfer"
                    className="w-full h-full object-contain group-hover:scale-102 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-1">
                    <Eye className="w-4 h-4" />
                    <span>Perbesar Gambar</span>
                  </div>
                </a>
                <p className="text-[10px] text-stone-500 text-center">
                  Bukti di-upload via Cloudinary (mycdcgatsu)
                </p>
              </div>
            ) : (
              <div className="py-8 text-center text-stone-500 italic">Belum ada file bukti.</div>
            )}
          </div>
        </div>

        {/* Ordered Items Breakdown */}
        <div className="space-y-3 pt-2">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-stone-400">
            Daftar Hidangan
          </h4>

          <div className="divide-y divide-stone-850 rounded-2xl bg-stone-900 border border-stone-850 p-4 space-y-3 text-xs">
            {order.items?.map((it, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex items-start justify-between">
                <div>
                  <h5 className="font-bold text-white text-sm">
                    {it.quantity}x {it.productName} ({it.variantLabel})
                  </h5>
                  <p className="text-stone-400 text-[11px]">
                    Bagian: <strong className="text-amber-400">{it.chickenPartNote || 'Bebas'}</strong>
                  </p>
                  {(it.extraSausCount > 0 || it.extraNasiCount > 0) && (
                    <p className="text-amber-400/90 text-[11px]">
                      {it.extraSausCount > 0 && `+${it.extraSausCount} Extra Saus${it.extraSausName ? ` (${it.extraSausName})` : ''} `}
                      {it.extraNasiCount > 0 && `+${it.extraNasiCount} Extra Nasi`}
                    </p>
                  )}
                </div>
                <span className="font-bold text-amber-400 text-sm">{formatRupiah(it.itemSubtotal)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-850 space-y-1.5 text-xs text-stone-300">
            <div className="flex justify-between">
              <span>Subtotal Menu</span>
              <span className="font-semibold text-white">{formatRupiah(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ongkir</span>
              <span className="font-semibold text-white">{formatRupiah(order.shippingFee)}</span>
            </div>
            {order.discountFromPoints > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Diskon Poin ({order.pointsRedeemed} Poin)</span>
                <span>-{formatRupiah(order.discountFromPoints)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-800 flex justify-between items-baseline font-black text-white text-sm">
              <span>Total Tagihan Bersih</span>
              <span className="text-base text-amber-400">{formatRupiah(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-stone-100">
            <h3 className="font-bold text-base text-white">Tolak Pembayaran QRIS</h3>
            <p className="text-xs text-stone-400">
              Pelanggan akan melihat alasan ini dan dapat mengunggah bukti pembayaran baru.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Nominal transfer kurang Rp5.000 / Nama rekening penerima tidak sesuai..."
              className="w-full p-3 rounded-xl border border-stone-700 bg-stone-850 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={updating || !rejectionReason.trim()}
                onClick={handleRejectPayment}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold"
              >
                {updating ? 'Menyimpan...' : 'Kirim Penolakan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
