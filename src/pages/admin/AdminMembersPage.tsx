import React, { useState, useEffect } from 'react';
import {
collection,
query,
onSnapshot,
doc,
runTransaction,
serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile } from '../../types';
import {
formatRupiah,
pointsToRupiah,
parseNonNegativeAmount,
} from '../../lib/utils';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { MemberQrScanner } from '../../components/admin/MemberQrScanner';
import { Users, Search, X } from 'lucide-react';

export const AdminMembersPage: React.FC = () => {
const [members, setMembers] = useState<UserProfile[]>([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');

const [selectedMember, setSelectedMember] =
useState<UserProfile | null>(null);
const [modalMode, setModalMode] =
useState<'adjust_points' | null>(null);

const [adjustAmount, setAdjustAmount] = useState<string>('10');
const [adjustReason, setAdjustReason] = useState('');
const [adjustType, setAdjustType] =
useState<'add' | 'deduct'>('add');

// FIX: Definisikan jumlah poin sebelum digunakan di handleAdjustPoints.
const parsedAdjustAmount = parseNonNegativeAmount(adjustAmount);

const [submitting, setSubmitting] = useState(false);

const { showToast } = useNotification();
const { currentUser } = useAuth();

useEffect(() => {
const q = query(collection(db, 'users'));

```
const unsubscribe = onSnapshot(
  q,
  (snapshot) => {
    const list: UserProfile[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as UserProfile[];

    setMembers(list);
    setLoading(false);
  },
  (err) => {
    console.error('Gagal memuat data member:', err);
    showToast('Gagal memuat data member.', 'error');
    setLoading(false);
  }
);

return () => unsubscribe();
```

}, []);

const filteredMembers = members.filter((m) => {
const term = searchTerm.toLowerCase().trim();

```
return (
  m.name?.toLowerCase().includes(term) ||
  m.whatsapp?.toLowerCase().includes(term) ||
  m.memberId?.toLowerCase().includes(term) ||
  m.email?.toLowerCase().includes(term)
);
```

});

const closeModal = () => {
if (submitting) return;

```
setModalMode(null);
setSelectedMember(null);
setAdjustReason('');
setAdjustAmount('10');
setAdjustType('add');
```

};

const handleAdjustPoints = async (
e: React.FormEvent<HTMLFormElement>
) => {
e.preventDefault();

```
if (submitting) return;

if (!selectedMember) {
  showToast('Pilih member terlebih dahulu.', 'error');
  return;
}

if (!adjustReason.trim()) {
  showToast('Alasan penyesuaian poin wajib dicatat.', 'error');
  return;
}

// Pastikan jumlah poin valid sebelum mengirim transaksi.
if (
  parsedAdjustAmount === null ||
  !Number.isFinite(parsedAdjustAmount) ||
  parsedAdjustAmount <= 0
) {
  showToast(
    'Jumlah poin harus angka positif; poin mendukung kelipatan 0,5.',
    'error'
  );
  return;
}

const delta =
  adjustType === 'add'
    ? parsedAdjustAmount
    : -parsedAdjustAmount;

setSubmitting(true);

try {
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', selectedMember.id);
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists()) {
      throw new Error('Member tidak ditemukan.');
    }

    const currentPts = Number(userSnap.data().points) || 0;
    const newBalance = currentPts + delta;

    if (newBalance < 0) {
      throw new Error(
        'Saldo poin tidak cukup untuk pengurangan ini.'
      );
    }

    // Perbarui saldo member.
    transaction.update(userRef, {
      points: newBalance,
      updatedAt: serverTimestamp(),
    });

    // Catat perubahan ke ledger poin.
    const ptRef = doc(collection(db, 'pointTransactions'));

    transaction.set(ptRef, {
      id: ptRef.id,
      userId: selectedMember.id,
      memberId: selectedMember.memberId,
      amount: delta,
      type: 'manual_adjustment',
      description: `Penyesuaian kasir: ${adjustReason.trim()}`,
      adminUid: currentUser?.uid || null,
      createdAt: serverTimestamp(),
    });

    // Catat aktivitas admin dalam transaksi yang sama.
    const logRef = doc(collection(db, 'adminLogs'));

    transaction.set(logRef, {
      adminUid: currentUser?.uid || null,
      action: 'MANUAL_POINT_ADJUSTMENT',
      targetType: 'user',
      targetId: selectedMember.id,
      details: `Poin ${delta > 0 ? '+' : ''}${delta} (${adjustReason.trim()})`,
      createdAt: serverTimestamp(),
    });
  });

  showToast(
    `Poin member berhasil disesuaikan (${delta > 0 ? '+' : ''}${delta} poin).`,
    'success'
  );

  setModalMode(null);
  setSelectedMember(null);
  setAdjustReason('');
  setAdjustAmount('10');
  setAdjustType('add');
} catch (err: unknown) {
  console.error('Gagal menyesuaikan poin:', err);

  const message =
    err instanceof Error
      ? err.message
      : 'Terjadi kesalahan yang tidak diketahui.';

  showToast(`Gagal mengubah poin: ${message}`, 'error');
} finally {
  setSubmitting(false);
}
```

};

const handleMemberQrCode = (code: string) => {
const normalized = code.trim().toLowerCase();

```
const found = members.find(
  (member) =>
    member.memberId?.trim().toLowerCase() === normalized
);

if (!found) {
  showToast(
    `Member ID ${code} tidak ditemukan.`,
    'error',
    'QR Member Tidak Dikenal'
  );
  return;
}

setSearchTerm(found.memberId || '');

showToast(
  `${found.name} (${found.memberId}) ditemukan. Silakan pilih aksi kasir.`,
  'success',
  'Member Ditemukan'
);

if ('speechSynthesis' in window) {
  window.speechSynthesis.cancel();

  const points = Number(found.points) || 0;
  const rupiah = new Intl.NumberFormat('id-ID').format(
    points * 100
  );

  const utterance = new SpeechSynthesisUtterance(
    `Member terdeteksi atas nama ${found.name}. Total poin Anda adalah ${points} poin, setara ${rupiah} rupiah.`
  );

  utterance.lang = 'id-ID';
  utterance.rate = 0.92;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const indonesianVoice = voices.find((voice) =>
    voice.lang?.toLowerCase().startsWith('id')
  );

  if (indonesianVoice) {
    utterance.voice = indonesianVoice;
  }

  window.speechSynthesis.speak(utterance);
}
```

};

return ( <div className="space-y-6"> <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-3"> <div> <h1 className="text-2xl font-black text-white tracking-tight">
Manajemen Member </h1> <p className="text-xs text-stone-400">
Cari member berdasarkan Member ID, WhatsApp, atau nama;
saldo poin dan penyesuaian tercatat di ledger </p> </div>

```
    <MemberQrScanner onMemberCode={handleMemberQrCode} />
  </div>

  <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3 flex items-center gap-3">
    <Search className="w-5 h-5 text-stone-500 shrink-0 ml-1" />

    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Cari Member ID, No. WhatsApp, atau Nama..."
      className="w-full bg-transparent text-white text-xs placeholder-stone-500 focus:outline-none"
    />

    {searchTerm && (
      <button
        type="button"
        onClick={() => setSearchTerm('')}
        className="text-stone-400 hover:text-white text-xs font-bold px-2"
      >
        Clear
      </button>
    )}
  </div>

  <div className="bg-stone-950 border border-stone-800 rounded-3xl p-5 space-y-4 shadow-sm">
    <div className="flex items-center justify-between pb-3 border-b border-stone-850">
      <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
        <Users className="w-4 h-4 text-amber-400" />
        <span>
          Daftar Member Terdaftar ({filteredMembers.length})
        </span>
      </h2>
    </div>

    {loading ? (
      <div className="py-12 text-center text-xs text-stone-500">
        Memuat data member...
      </div>
    ) : filteredMembers.length === 0 ? (
      <div className="py-12 text-center text-xs text-stone-500">
        Tidak ditemukan member dengan kata kunci pencarian tersebut.
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-300">
          <thead className="text-[10px] uppercase text-stone-400 border-b border-stone-800 font-bold">
            <tr>
              <th className="py-3 px-3">Member ID</th>
              <th className="py-3 px-3">Nama Lengkap</th>
              <th className="py-3 px-3">No. WhatsApp</th>
              <th className="py-3 px-3">Saldo Poin</th>
              <th className="py-3 px-3">Role</th>
              <th className="py-3 px-3 text-right">
                Aksi Member
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-850">
            {filteredMembers.map((m) => (
              <tr
                key={m.id}
                className="hover:bg-stone-900 transition-colors"
              >
                <td className="py-3 px-3 font-mono font-bold text-amber-400">
                  {m.memberId || '-'}
                </td>

                <td className="py-3 px-3 font-bold text-white">
                  {m.name}
                </td>

                <td className="py-3 px-3 font-mono text-stone-300">
                  {m.whatsapp || '-'}
                </td>

                <td className="py-3 px-3">
                  <span className="font-extrabold text-amber-400 text-sm">
                    {m.points || 0} Poin
                  </span>
                  <span className="text-[10px] text-stone-500 block">
                    (= {formatRupiah(
                      pointsToRupiah(m.points || 0)
                    )})
                  </span>
                </td>

                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.role === 'admin'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {m.role === 'admin'
                      ? 'Admin Crew'
                      : 'Customer'}
                  </span>
                </td>

                <td className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMember(m);
                      setAdjustAmount('10');
                      setAdjustReason('');
                      setAdjustType('add');
                      setModalMode('adjust_points');
                    }}
                    className="px-2 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] transition-colors"
                  >
                    Sesuaikan Poin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>

  {modalMode === 'adjust_points' && selectedMember && (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-stone-100">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <h3 className="font-bold text-base text-white">
            Penyesuaian Poin Manual
          </h3>

          <button
            type="button"
            disabled={submitting}
            onClick={closeModal}
            className="text-stone-400 hover:text-white p-1 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-stone-400">
          Ubah saldo poin member{' '}
          <strong>{selectedMember.name}</strong>{' '}
          ({selectedMember.memberId}). Saldo saat ini:{' '}
          <strong className="text-amber-400">
            {selectedMember.points || 0} Poin
          </strong>.
        </p>

        <form
          onSubmit={handleAdjustPoints}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300">
              Tipe Aksi
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setAdjustType('add')}
                className={`py-2 rounded-xl font-bold text-xs transition-all border ${
                  adjustType === 'add'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-stone-850 text-stone-300 border-stone-700'
                }`}
              >
                + Tambah Poin
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => setAdjustType('deduct')}
                className={`py-2 rounded-xl font-bold text-xs transition-all border ${
                  adjustType === 'deduct'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-stone-850 text-stone-300 border-stone-700'
                }`}
              >
                - Kurangi Poin
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300">
              Jumlah Poin *
            </label>

            <input
              type="text"
              inputMode="decimal"
              required
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              disabled={submitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-850 text-white font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300">
              Alasan Penyesuaian (Wajib Dicatat) *
            </label>

            <textarea
              required
              rows={2}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              disabled={submitting}
              placeholder="Contoh: Kompensasi pesanan / Koreksi transaksi offline / Bonus loyalitas event"
              className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-850 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={closeModal}
              className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-750 disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                !adjustReason.trim() ||
                parsedAdjustAmount === null ||
                !Number.isFinite(parsedAdjustAmount) ||
                parsedAdjustAmount <= 0
              }
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-extrabold text-xs transition-colors shadow-md"
            >
              {submitting
                ? 'Menyimpan...'
                : 'Simpan ke Ledger Poin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>
```

);
};
