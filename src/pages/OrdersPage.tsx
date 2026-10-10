import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/common/OrderBadge';
import { formatRupiah, formatDateIndo } from '../lib/utils';
import { Receipt, ArrowRight, Clock, ShoppingBag } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: Order[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Order[];
          // Sort by createdAt descending
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(list);
          setLoading(false);
        },
        (err) => {
          console.warn('Orders snapshot note:', err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error fetching orders:', err);
      setLoading(false);
    }
  }, [currentUser]);

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-stone-600">Memuat riwayat pesanan Anda...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto">
          <Receipt className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">Perlu Masuk Akun</h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          Silakan masuk ke akun Anda untuk melihat daftar pesanan aktif dan histori transaksi.
        </p>
        <Link
          to="/login?redirect=/pesanan"
          className="inline-block py-2.5 px-6 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs shadow-md"
        >
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Pesanan Saya</h1>
          <p className="text-xs text-stone-500">Lacak status pesanan online dan histori belanja Anda</p>
        </div>
        <Link
          to="/menu"
          className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
          <span>Pesan Lagi</span>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-3">
          <Receipt className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="font-extrabold text-base text-stone-900">Belum Ada Pesanan</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Anda belum pernah membuat pesanan di MY CDC GATSU. Yuk cobain kenikmatan ayam krispi pilihan kami!
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
          >
            <span>Buka Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/pesanan/${order.id}`}
              className="block bg-white rounded-3xl border border-stone-200 p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-700">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-stone-900 group-hover:text-amber-600 transition-colors">
                      {order.orderNumber || order.id}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-stone-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateIndo(order.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={order.orderStatus} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
              </div>

              {/* Items summary */}
              <div className="py-3 text-xs text-stone-700 space-y-1">
                {order.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[260px] sm:max-w-md">
                      {it.quantity}x {it.productName} ({it.variantLabel})
                    </span>
                    <span className="font-semibold">{formatRupiah(it.itemSubtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-500 text-[11px] block">Total Pembayaran</span>
                  <span className="font-black text-sm text-amber-600">{formatRupiah(order.total)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                  <span>Lihat Detail & Lacak</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
