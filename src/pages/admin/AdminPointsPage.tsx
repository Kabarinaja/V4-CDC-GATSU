import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PointTransaction } from '../../types';
import { formatRupiah, formatDateIndo } from '../../lib/utils';
import { Award, ArrowDownLeft, ArrowUpRight, Search, Filter } from 'lucide-react';

export const AdminPointsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'pointTransactions'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: PointTransaction[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PointTransaction[];
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTransactions(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Point ledger listener note:', err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filtered = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.memberId?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.orderId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalRewardIssued = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRedeemed = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Buku Besar Poin (Ledger)</h1>
          <p className="text-xs text-stone-400">
            Audit histori pencatatan poin masuk, penukaran diskon, dan penyesuaian manual
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-stone-400">Total Poin Masuk (Reward + Top Up)</span>
          <h3 className="text-2xl font-black text-emerald-400">+{totalRewardIssued} Pts</h3>
          <p className="text-[11px] text-stone-500">Nilai ekivalen: {formatRupiah(totalRewardIssued * 100)}</p>
        </div>

        <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-stone-400">Total Poin Ditukarkan (Diskon)</span>
          <h3 className="text-2xl font-black text-rose-400">-{totalRedeemed} Pts</h3>
          <p className="text-[11px] text-stone-500">Nilai potongan: {formatRupiah(totalRedeemed * 100)}</p>
        </div>

        <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-stone-400">Total Transaksi Poin</span>
          <h3 className="text-2xl font-black text-white">{transactions.length} Catatan</h3>
          <p className="text-[11px] text-stone-500">Tercatat aman di Firestore</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-stone-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Member ID, deskripsi, atau nomor order..."
            className="w-full bg-transparent text-xs text-white placeholder-stone-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'reward', label: 'Reward' },
            { key: 'redeem', label: 'Redeem Diskon' },
            { key: 'manual_adjustment', label: 'Penyesuaian Manual' },
            { key: 'topup', label: 'Top Up' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === tab.key
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-stone-950 border border-stone-800 rounded-3xl p-5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-stone-400">Memuat buku besar...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">
            Tidak ditemukan mutasi poin dengan filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="text-[10px] uppercase text-stone-400 border-b border-stone-800 font-bold">
                <tr>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Member ID</th>
                  <th className="py-3 px-3">Tipe</th>
                  <th className="py-3 px-3">Deskripsi Transaksi</th>
                  <th className="py-3 px-3 text-right">Mutasi Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850">
                {filtered.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-stone-900 transition-colors">
                      <td className="py-3 px-3 text-stone-400 whitespace-nowrap font-mono text-[11px]">
                        {formatDateIndo(tx.createdAt)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {tx.memberId}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'reward'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : tx.type === 'redeem'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-stone-200">
                        {tx.description}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-sm whitespace-nowrap">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? `+${tx.amount}` : tx.amount} Pts
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
