import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PointTransaction } from '../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatRupiah, pointsToRupiah, formatDateIndo } from '../lib/utils';
import { Award, ArrowUpRight, ArrowDownLeft, Info, Receipt, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PointsPage: React.FC = () => {
  const { profile, currentUser } = useAuth();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'pointTransactions'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: PointTransaction[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as PointTransaction[];
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTransactions(list);
          setLoading(false);
        },
        (err) => {
          console.warn('Point transactions note:', err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [currentUser]);

  if (!currentUser || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <Award className="w-14 h-14 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-stone-900">Perlu Masuk Akun</h2>
        <p className="text-xs text-stone-600">
          Silakan masuk akun terlebih dahulu untuk melihat saldo poin dan buku besar riwayat loyalitas Anda.
        </p>
        <Link
          to="/login?redirect=/poin"
          className="inline-block py-2.5 px-6 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
        >
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  const pointValueInRp = pointsToRupiah(profile.points);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Poin Loyalitas Member</h1>
        <p className="text-xs text-stone-500">Saldo poin dan buku besar riwayat perolehan/penukaran poin</p>
      </div>

      {/* Point Balance Header Box */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-stone-950 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span className="text-xs font-black uppercase tracking-wider text-stone-950/80">Saldo Poin Aktif</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight">{profile.points}</span>
              <span className="text-sm font-extrabold uppercase">Poin</span>
            </div>
            <p className="text-xs font-semibold text-stone-900/90 mt-1">
              Senilai <strong>{formatRupiah(pointValueInRp)}</strong> potongan belanja
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <Link to="/isi-poin" className="px-5 py-2.5 rounded-xl bg-stone-950 text-amber-400 font-extrabold text-xs hover:bg-stone-900 transition-colors shadow-md text-center">Isi Poin</Link>
            <Link
              to="/menu"
              className="px-5 py-2.5 rounded-xl border border-stone-950/20 text-stone-950 font-extrabold text-xs hover:bg-stone-950/5 transition-colors shadow-md text-center"
            >
              Gunakan Saat Pesan Menu
            </Link>
            <span className="text-[11px] text-stone-950/80 font-medium">1 Poin = Rp100 (Min. redeem 10 Poin)</span>
          </div>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2 text-xs text-stone-700">
        <div className="flex items-center gap-2 font-extrabold text-stone-900">
          <Info className="w-4 h-4 text-amber-600" />
          <span>Aturan Program Loyalitas MY CDC GATSU:</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-stone-600">
          <li><strong>Nilai Poin:</strong> 1 poin setara dengan Rp100.</li>
          <li><strong>Batas Minimum Penukaran:</strong> Minimal 10 poin (Rp1.000). Penukaran 1–9 poin tidak berlaku.</li>
          <li><strong>Poin Reward:</strong> Didapatkan secara otomatis setelah transaksi pesanan diselesaikan oleh kasir atau saat pembelian offline di outlet.</li>
          <li><strong>Keamanan Poin:</strong> Poin yang digunakan saat checkout akan dicadangkan dan baru dipotong final saat pesanan selesai diproses.</li>
        </ul>
      </div>

      {/* Point History Ledger */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h2 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-600" />
            <span>Riwayat Transaksi Poin (Ledger)</span>
          </h2>
          <span className="text-xs text-stone-500 font-semibold">{transactions.length} Catatan</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-stone-500">Memuat catatan poin...</div>
        ) : transactions.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs font-semibold text-stone-700">Belum ada riwayat transaksi poin</p>
            <p className="text-[11px] text-stone-400">Poin dari pesanan delivery atau pembelian di outlet akan tercatat di sini.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 space-y-3">
            {transactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">{tx.description}</p>
                      <span className="text-[11px] text-stone-400">{formatDateIndo(tx.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-black text-sm block ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isPositive ? `+${tx.amount}` : tx.amount} Poin
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {isPositive ? `(+${formatRupiah(tx.amount * 100)})` : `(${formatRupiah(tx.amount * 100)})`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
