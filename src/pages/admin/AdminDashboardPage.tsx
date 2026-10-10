import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, UserProfile } from '../../types';
import { formatRupiah, formatDateIndo, toDateSafe } from '../../lib/utils';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/OrderBadge';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  Users,
  Award,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ChefHat,
  Package,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [totalPointsInCirculation, setTotalPointsInCirculation] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener on orders
    const ordersQuery = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const list: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        list.sort((a, b) =>
          (toDateSafe(b.createdAt)?.getTime() ?? 0) -
          (toDateSafe(a.createdAt)?.getTime() ?? 0)
        );
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Orders dashboard note:', err.message);
        setLoading(false);
      }
    );

    // Fetch members count & total points
    const fetchMembers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        setMembersCount(usersSnap.docs.length);
        let pts = 0;
        usersSnap.docs.forEach((d) => {
          pts += Number(d.data().points) || 0;
        });
        setTotalPointsInCirculation(pts);
      } catch (e) {
        console.warn('Members fetch note:', e);
      }
    };

    fetchMembers();

    return () => unsubscribeOrders();
  }, []);

  const pendingVerificationOrders = orders.filter((o) => o.paymentStatus === 'pending_verification');
  const inProgressOrders = orders.filter((o) => ['accepted', 'cooking', 'packing'].includes(o.orderStatus));
  const shippingOrders = orders.filter((o) => o.orderStatus === 'shipping');
  const completedOrders = orders.filter((o) => o.orderStatus === 'completed' && !o.archivedAt);

  const totalSalesRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Ringkasan Operasional Outlet</h1>
          <p className="text-xs text-stone-400">Pantau pesanan masuk, verifikasi QRIS, dan kinerja pesanan MY CDC GATSU</p>
        </div>

      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Verification */}
        <Link
          to="/admin/orders?status=pending_verification"
          className="bg-stone-950 border border-stone-800 hover:border-amber-500/60 p-4 rounded-2xl transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
            <span>Perlu Verifikasi</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white">{pendingVerificationOrders.length}</span>
            {pendingVerificationOrders.length > 0 && (
              <span className="text-[10px] font-bold text-amber-400 animate-pulse">Perlu Tindakan Segera</span>
            )}
          </div>
        </Link>

        {/* Cooking & Packing */}
        <Link
          to="/admin/orders?status=processing"
          className="bg-stone-950 border border-stone-800 hover:border-amber-500/60 p-4 rounded-2xl transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
            <span>Sedang Diproses Dapur</span>
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 group-hover:scale-110 transition-transform">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white">{inProgressOrders.length}</span>
        </Link>

        {/* Shipping */}
        <Link
          to="/admin/orders?status=shipping"
          className="bg-stone-950 border border-stone-800 hover:border-amber-500/60 p-4 rounded-2xl transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
            <span>Sedang Diantar Kurir</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white">{shippingOrders.length}</span>
        </Link>

        {/* Total Sales */}
        <div className="bg-stone-950 border border-stone-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
            <span>Penjualan Selesai</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{formatRupiah(totalSalesRevenue)}</span>
            <span className="text-[10px] text-stone-400">{completedOrders.length} Order</span>
          </div>
        </div>
      </div>

      {/* Member & Point Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-stone-950 border border-stone-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-stone-900 rounded-xl text-amber-400 border border-stone-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-400">Total Member Terdaftar</p>
              <h4 className="text-xl font-black text-white">{membersCount} Pengguna</h4>
            </div>
          </div>
          <Link to="/admin/members" className="text-xs text-amber-400 font-bold hover:underline">
            Kelola &gt;
          </Link>
        </div>

        <div className="bg-stone-950 border border-stone-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-stone-900 rounded-xl text-amber-400 border border-stone-800">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-400">Total Poin Beredar</p>
              <h4 className="text-xl font-black text-amber-400">{totalPointsInCirculation} Poin</h4>
            </div>
          </div>
          <Link to="/admin/points" className="text-xs text-amber-400 font-bold hover:underline">
            Buku Besar &gt;
          </Link>
        </div>
      </div>

      {/* Urgent Pending Verification Alert Table */}
      {pendingVerificationOrders.length > 0 && (
        <div className="bg-stone-950 rounded-3xl border-2 border-amber-500/70 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 animate-pulse" />
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Bukti Transfer Menunggu Verifikasi ({pendingVerificationOrders.length})
              </h2>
            </div>
            <Link to="/admin/orders" className="text-xs font-bold text-amber-400 hover:underline">
              Buka Semua Pesanan &gt;
            </Link>
          </div>

          <div className="divide-y divide-stone-800 space-y-3">
            {pendingVerificationOrders.slice(0, 5).map((o) => (
              <div key={o.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">{o.orderNumber || o.id}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                      {o.shippingArea === 'indramayu_kota' ? 'Indramayu Kota' : 'Luar Kota'}
                    </span>
                  </div>
                  <p className="text-stone-300 font-medium">
                    {o.customerName} ({o.customerWhatsapp})
                  </p>
                  <p className="text-stone-400 text-[11px] truncate max-w-md">
                    {o.items?.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="font-black text-amber-400 text-sm block">{formatRupiah(o.total)}</span>
                    <span className="text-[10px] text-stone-400">{formatDateIndo(o.createdAt)}</span>
                  </div>
                  <Link
                    to={`/admin/orders/${o.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs"
                  >
                    Verifikasi
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="bg-stone-950 rounded-3xl border border-stone-800 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Pesanan Masuk Terbaru
          </h2>
          <Link to="/admin/orders" className="text-xs font-bold text-amber-400 hover:underline">
            Lihat Semua Pesanan &gt;
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500">Belum ada transaksi pesanan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="text-[10px] uppercase text-stone-400 border-b border-stone-800 font-bold">
                <tr>
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Pelanggan</th>
                  <th className="py-3 px-3">Status Pesanan</th>
                  <th className="py-3 px-3">Pembayaran QRIS</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850">
                {orders.slice(0, 8).map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-900 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {ord.orderNumber || ord.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold block text-stone-200">{ord.customerName}</span>
                      <span className="text-[10px] text-stone-400">{ord.customerWhatsapp}</span>
                    </td>
                    <td className="py-3 px-3">
                      <OrderStatusBadge status={ord.orderStatus} />
                    </td>
                    <td className="py-3 px-3">
                      <PaymentStatusBadge status={ord.paymentStatus} />
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-amber-400">
                      {formatRupiah(ord.total)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/admin/orders/${ord.id}`}
                        className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold"
                      >
                        Buka
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
