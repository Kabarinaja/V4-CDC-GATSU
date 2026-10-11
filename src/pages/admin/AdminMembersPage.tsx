
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

  // Simpan input sebagai string agar dapat dikosongkan saat diedit.
  const [adjustAmount, setAdjustAmount] = useState('10');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useNotification();
  const { currentUser } = useAuth();

  useEffect(() => {
    const membersQuery = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        const list = snapshot.docs.map((memberDoc) => ({
          id: memberDoc.id,
          ...memberDoc.data(),
        })) as UserProfile[];

        setMembers(list);
        setLoading(false);
      },
      (error) => {
        console.error('Gagal memuat member:', error);
        setLoading(false);
        showToast('Gagal memuat data member. Periksa koneksi dan akses Firebase.', 'error');
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredMembers = members.filter((member) => {
    const term = searchTerm.trim().toLowerCase();

    return (
      member.name?.toLowerCase().includes(term) ||
      member.whatsapp?.toLowerCase().includes(term) ||
      member.memberId?.toLowerCase().includes(term) ||
      member.email?.toLowerCase().includes(term)
    );
  });

  // Nilai hanya dikonversi untuk validasi dan saat submit.
  const parsedAdjustAmount = parseNonNegativeAmount(adjustAmount);

  const closeModal = () => {
    if (submitting) return;
    setModalMode(null);
    setSelectedMember(null);
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustType('add');
  };

  const handleAdjustPoints = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) return;

    if (!currentUser?.uid) {
      showToast('Sesi admin tidak ditemukan. Silakan login kembali.', 'error');
      return;
    }

    if (!selectedMember) {
      showToast('Pilih member terlebih dahulu.', 'error');
      return;
    }

    if (!adjustAmount.trim()) {
      showToast('Jumlah poin wajib diisi.', 'error');
      return;
    }

    if (
      parsedAdjustAmount === null ||
      !Number.isFinite(parsedAdjustAmount) ||
      parsedAdjustAmount <= 0
    ) {
      showToast('Jumlah poin harus lebih dari 0.', 'error');
      return;
    }

    // Poin hanya menerima kelipatan 0,5.
    if (Math.abs(parsedAdjustAmount * 2 - Math.round(parsedAdjustAmount * 2)) > 1e-8) {
      showToast('Jumlah poin harus dalam kelipatan 0,5.', 'error');
      return;
    }

    if (!adjustReason.trim()) {
      showToast('Alasan penyesuaian poin wajib dicatat.', 'error');
      return;
    }

    const delta = adjustType === 'add'
      ? parsedAdjustAmount
      : -parsedAdjustAmount;

    setSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', selectedMember.id);
        const userSnapshot = await transaction.get(userRef);

        if (!userSnapshot.exists()) {
          throw new Error('Member tidak ditemukan.');
        }

        const currentPoints = Number(userSnapshot.data().points ?? 0);

        if (!Number.isFinite(currentPoints) || currentPoints < 0) {
          throw new Error('Saldo poin member tidak valid. Periksa data member.');
        }

        const newBalance = Math.round((currentPoints + delta) * 100) / 100;

        if (newBalance < 0) {
          throw new Error('Saldo poin tidak cukup untuk pengurangan ini.');
        }

        // Semua penulisan berikut berada dalam satu transaksi.
        transaction.update(userRef, {
          points: newBalance,
          updatedAt: serverTimestamp(),
        });

        const pointLedgerRef = doc(collection(db, 'pointTransactions'));

        transaction.set(pointLedgerRef, {
          id: pointLedgerRef.id,
          userId: selectedMember.id,
          memberId: userSnapshot.data().memberId ?? selectedMember.memberId ?? '',
          amount: delta,
          type: 'manual_adjustment',
          description: `Penyesuaian admin: ${adjustReason.trim()}`,
          adminUid: currentUser.uid,
          balanceBefore: currentPoints,
          balanceAfter: newBalance,
          createdAt: serverTimestamp(),
        });

        const adminLogRef = doc(collection(db, 'adminLogs'));

        transaction.set(adminLogRef, {
          adminUid: currentUser.uid,
          action: 'MANUAL_POINT_ADJUSTMENT',
          targetType: 'user',
          targetId: selectedMember.id,
          details: `Poin ${delta > 0 ? '+' : ''}${delta}; saldo ${currentPoints} menjadi ${newBalance}; alasan: ${adjustReason.trim()}`,
          createdAt: serverTimestamp(),
        });
      });

      showToast(
        `Berhasil menyimpan ${delta > 0 ? '+' : ''}${delta} poin ke ledger.`,
        'success',
        'Poin Berhasil Disimpan'
      );

      setModalMode(null);
      setSelectedMember(null);
      setAdjustAmount('');
      setAdjustReason('');
      setAdjustType('add');
    } catch (error: unknown) {
      console.error('Gagal menyimpan penyesuaian poin:', error);

      const message = error instanceof Error
        ? error.message
        : 'Terjadi kesalahan yang tidak diketahui.';

      if (message.includes('permission-denied')) {
        showToast('Akses ditolak oleh Firebase Rules. Pastikan akun memiliki izin admin.', 'error');
      } else {
        showToast(`Gagal menyimpan poin: ${message}`, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleMemberQrCode = (code: string) => {
    const normalizedCode = code.trim().toLowerCase();

    const foundMember = members.find(
      (member) => member.memberId?.trim().toLowerCase() === normalizedCode
    );

    if (!foundMember) {
      showToast(
        `Member ID ${code} tidak ditemukan.`,
        'error',
        'QR Member Tidak Dikenal'
      );
      return;
    }

    setSearchTerm(foundMember.memberId ?? '');
    showToast(
      `${foundMember.name} (${foundMember.memberId}) ditemukan.`,
      'success',
      'Member Ditemukan'
    );

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const points = Number(foundMember.points) || 0;
      const rupiah = new Intl.NumberFormat('id-ID').format(points * 100);

      const utterance = new SpeechSynthesisUtterance(
        `Member terdeteksi atas nama ${foundMember.name}. Total poin Anda ${points} poin, setara ${rupiah} rupiah.`
      );

      utterance.lang = 'id-ID';
      utterance.rate = 0.92;

      const indonesianVoice = window.speechSynthesis
        .getVoices()
        .find((voice) => voice.lang?.toLowerCase().startsWith('id'));

      if (indonesianVoice) utterance.voice = indonesianVoice;

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Manajemen Member
          </h1>
          <p className="text-xs text-stone-400">
            Cari member, periksa saldo, dan catat penyesuaian poin ke ledger.
          </p>
        </div>

        <MemberQrScanner onMemberCode={handleMemberQrCode} />
      </div>

      <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3 flex items-center gap-3">
        <Search className="w-5 h-5 text-stone-500 shrink-0 ml-1" />

        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Cari Member ID, WhatsApp, email, atau nama..."
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
            Daftar Member Terdaftar ({filteredMembers.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-stone-500">
            Memuat data member...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">
            Tidak ditemukan member dengan kata kunci tersebut.
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
                  <th className="py-3 px-3 text-right">Aksi Member</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-850">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-stone-900 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {member.memberId || '-'}
                    </td>

                    <td className="py-3 px-3 font-bold text-white">
                      {member.name}
                    </td>

                    <td className="py-3 px-3 font-mono text-stone-300">
                      {member.whatsapp || '-'}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-extrabold text-amber-400 text-sm">
                        {Number(member.points) || 0} Poin
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        (= {formatRupiah(pointsToRupiah(Number(member.points) || 0))})
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          member.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {member.role === 'admin' ? 'Admin Crew' : 'Customer'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMember(member);
                          setAdjustAmount('');
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
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
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Member <strong>{selectedMember.name}</strong> ({selectedMember.memberId}).
              Saldo saat ini:{' '}
              <strong className="text-amber-400">
                {Number(selectedMember.points) || 0} poin
              </strong>.
            </p>

            <form onSubmit={handleAdjustPoints} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">
                  Tipe Aksi
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setAdjustType('add')}
                    className={`py-2 rounded-xl font-bold text-xs border ${
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
                    className={`py-2 rounded-xl font-bold text-xs border ${
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
                <label htmlFor="adjust-points-amount" className="text-xs font-bold text-stone-300">
                  Jumlah Poin *
                </label>

                <input
                  id="adjust-points-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  required
                  disabled={submitting}
                  value={adjustAmount}
                  onChange={(event) => {
                    const value = event.target.value;

                    // Izinkan input kosong selama proses pengeditan.
                    // Validasi format dan angka dilakukan saat submit.
                    if (/^[0-9]*([.,][0-9]*)?$/.test(value)) {
                      setAdjustAmount(value);
                    }
                  }}
                  placeholder="Contoh: 10 atau 0,5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-850 text-white font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-50"
                />

                <p className="text-[10px] text-stone-500">
                  Gunakan kelipatan 0,5 poin. Nilai boleh dikosongkan saat diedit.
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="adjust-points-reason" className="text-xs font-bold text-stone-300">
                  Alasan Penyesuaian *
                </label>

                <textarea
                  id="adjust-points-reason"
                  required
                  rows={2}
                  disabled={submitting}
                  value={adjustReason}
                  onChange={(event) => setAdjustReason(event.target.value)}
                  placeholder="Contoh: Bonus loyalitas atau koreksi transaksi"
                  className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-850 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting || !adjustAmount.trim() || !adjustReason.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-extrabold text-xs transition-colors"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan ke Ledger Poin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
