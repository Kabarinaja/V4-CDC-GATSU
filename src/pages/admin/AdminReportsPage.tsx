import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { formatRupiah, formatDateIndo, getJakartaDateKey } from '../../lib/utils';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Truck, Award, Calendar } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportDate, setReportDate] = useState(() => getJakartaDateKey(new Date()));

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Order[];
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Reports orders note:', err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const selectedDateOrders = orders.filter((o) => getJakartaDateKey(o.createdAt) === reportDate);
  const completedOrders = selectedDateOrders.filter((o) => o.orderStatus === 'completed' && !o.archivedAt);
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalMenuSubtotal = completedOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const totalShippingFee = completedOrders.reduce((sum, o) => sum + (o.shippingFee || 0), 0);
  const totalPointsDiscountGiven = completedOrders.reduce((sum, o) => sum + (o.discountFromPoints || 0), 0);

  const averageOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

  // Breakdown by product popularity
  const productCountMap: Record<string, { name: string; count: number; revenue: number }> = {};
  completedOrders.forEach((o) => {
    o.items?.forEach((it) => {
      const key = it.productId || it.productName;
      if (!productCountMap[key]) {
        productCountMap[key] = { name: it.productName, count: 0, revenue: 0 };
      }
      productCountMap[key].count += it.quantity;
      productCountMap[key].revenue += it.itemSubtotal;
    });
  });

  const popularProducts = Object.values(productCountMap).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Laporan Rekap Penjualan</h1>
          <p className="text-xs text-stone-400">Rekap harian Asia/Jakarta; pilih tanggal untuk melihat riwayat</p>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400"><span>Rekap tanggal kalender Asia/Jakarta · {selectedDateOrders.length} pesanan</span><label className="flex items-center gap-2">Pilih tanggal <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="rounded-lg border border-stone-700 bg-stone-900 px-2 py-1 text-stone-100" /></label></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-stone-950 border border-stone-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-stone-400">Total Omset Bersih</span>
          <h3 className="text-2xl font-black text-emerald-400">{formatRupiah(totalRevenue)}</h3>
          <p className="text-[11px] text-stone-500">{completedOrders.length} Pesanan Selesai</p>
        </div>

        <div className="p-4 rounded-3xl bg-stone-950 border border-stone-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-stone-400">Rata-rata Nilai Order (AOV)</span>
          <h3 className="text-2xl font-black text-amber-400">{formatRupiah(averageOrderValue)}</h3>
          <p className="text-[11px] text-stone-500">Per keranjang pesanan</p>
        </div>

        <div className="p-4 rounded-3xl bg-stone-950 border border-stone-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-stone-400">Total Pendapatan Ongkir</span>
          <h3 className="text-2xl font-black text-cyan-400">{formatRupiah(totalShippingFee)}</h3>
          <p className="text-[11px] text-stone-500">Kurir outlet delivery</p>
        </div>

        <div className="p-4 rounded-3xl bg-stone-950 border border-stone-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-stone-400">Diskon Poin Dinikmati Member</span>
          <h3 className="text-2xl font-black text-rose-400">{formatRupiah(totalPointsDiscountGiven)}</h3>
          <p className="text-[11px] text-stone-500">Hemat loyalitas member</p>
        </div>
      </div>

      {/* Menu Performance Table */}
      <div className="bg-stone-950 border border-stone-800 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-stone-850">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Peringkat Menu Ayam Terlaris</span>
          </h2>
        </div>

        {popularProducts.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500">
            Belum ada penjualan selesai untuk rekap menu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="text-[10px] uppercase text-stone-400 border-b border-stone-800 font-bold">
                <tr>
                  <th className="py-3 px-3">Peringkat</th>
                  <th className="py-3 px-3">Nama Menu</th>
                  <th className="py-3 px-3 text-center">Porsi Terjual</th>
                  <th className="py-3 px-3 text-right">Kontribusi Omset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850">
                {popularProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-stone-900 transition-colors">
                    <td className="py-3 px-3 font-bold text-amber-400">#{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-3 text-center font-bold text-stone-300">{p.count} porsi</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-400">
                      {formatRupiah(p.revenue)}
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
