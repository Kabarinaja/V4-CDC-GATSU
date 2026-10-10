import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { Check, CircleDollarSign, ExternalLink, Plus, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatRupiah, parseNonNegativeAmount } from '../../lib/utils';
import { MemberQrScanner } from '../../components/admin/MemberQrScanner';
import { UserProfile } from '../../types';
import { uploadToCloudinary } from '../../lib/cloudinary';

const BALANCE_REF = doc(db, 'adminBalances', 'main');
export const AdminTopUpsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();
  const [requests, setRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [directPoints, setDirectPoints] = useState('');
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Setoran saldo internal admin');
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [qrisUrl, setQrisUrl] = useState('');
  const [savingQris, setSavingQris] = useState(false);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, 'topUpRequests')), snap => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))), err => console.warn('Top up requests:', err)),
      onSnapshot(BALANCE_REF, snap => setBalance(snap.exists() ? Number(snap.data().balance) || 0 : 0), err => console.warn('Admin balance:', err)),
      onSnapshot(doc(db, 'appSettings', 'payment'), snap => setQrisUrl(snap.exists() && typeof snap.data().qrisImageUrl === 'string' ? snap.data().qrisImageUrl : ''), err => console.warn('QRIS setting:', err)),
      onSnapshot(collection(db, 'users'), snap => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() }) as UserProfile)), err => console.warn('Members:', err)),
      onSnapshot(collection(db, 'adminBalanceLedger'), snap => setLedger(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))), err => console.warn('Admin balance ledger:', err)),
    ];
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const saveQris = async (e: React.FormEvent) => {
    e.preventDefault(); if (!qrisFile) { showToast('Pilih gambar QRIS resmi yang diterbitkan merchant.', 'error'); return; }
    if (qrisFile.size > 8 * 1024 * 1024) { showToast('Ukuran gambar QRIS maksimal 8 MB.', 'error'); return; }
    setSavingQris(true);
    try {
      const url = await uploadToCloudinary(qrisFile, 'qris');
      await setDoc(doc(db, 'appSettings', 'payment'), { qrisImageUrl: url, updatedAt: serverTimestamp(), updatedBy: currentUser?.uid || '' }, { merge: true });
      setQrisFile(null); showToast('QRIS pembayaran diperbarui. Pastikan uji pembayaran dengan nominal kecil sebelum dipakai.', 'success');
    } catch (err) { console.error(err); showToast('Gagal menyimpan QRIS. Periksa koneksi/Cloudinary.', 'error'); }
    finally { setSavingQris(false); }
  };

  const addBalance = async (e: React.FormEvent) => {
    e.preventDefault(); const value = parseNonNegativeAmount(amount);
    if (value === null || !Number.isSafeInteger(value) || value <= 0 || !reason.trim() || !currentUser) { showToast('Nominal harus positif dan alasan wajib diisi.', 'error'); return; }
    setLoading(true);
    try {
      await runTransaction(db, async tx => {
        const snap = await tx.get(BALANCE_REF); const before = snap.exists() ? Number(snap.data().balance) || 0 : 0; const after = before + value;
        tx.set(BALANCE_REF, { balance: after, updatedAt: serverTimestamp(), updatedBy: currentUser.uid }, { merge: true });
        const ledger = doc(collection(db, 'adminBalanceLedger'));
        tx.set(ledger, { id: ledger.id, change: value, before, after, reason: reason.trim(), adminUid: currentUser.uid, referenceId: 'manual-funding', createdAt: serverTimestamp() });
        const log = doc(collection(db, 'adminLogs')); tx.set(log, { adminUid: currentUser.uid, action: 'ADMIN_BALANCE_FUND', targetType: 'adminBalance', targetId: 'main', details: `Saldo internal +${value}; ${reason.trim()}`, createdAt: serverTimestamp() });
      });
      setAmount(''); showToast('Saldo internal berhasil ditambah dan dicatat di ledger.', 'success');
    } catch (err) { console.error(err); showToast('Gagal menambah saldo. Pastikan akun admin berwenang.', 'error'); }
    finally { setLoading(false); }
  };

  const selectMemberByQr = (code: string) => {
    const normalized = code.trim().toLowerCase();
    const found = members.find(member => member.memberId?.trim().toLowerCase() === normalized || member.id === code.trim());
    if (!found) { setSelectedMember(null); showToast('QR tidak valid atau member tidak ditemukan. Top up dibatalkan.', 'error'); return; }
    setSelectedMember(found); showToast(`Member cocok: ${found.name} (${found.memberId})`, 'success');
  };

  const createAdminTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const points = parseNonNegativeAmount(directPoints, { allowFraction: true });
    if (!selectedMember || points === null || points <= 0 || Math.round(points * 2) !== points * 2 || !currentUser) { showToast('Pilih member dari QR valid dan masukkan poin positif kelipatan 0,5.', 'error'); return; }
    const debit = Math.round(points * 100); setLoading(true);
    try {
      await runTransaction(db, async tx => {
        const userRef = doc(db, 'users', selectedMember.id); const userSnap = await tx.get(userRef);
        const balSnap = await tx.get(BALANCE_REF);
        if (!userSnap.exists()) throw new Error('Profil member tidak ditemukan.');
        const before = balSnap.exists() ? Number(balSnap.data().balance) || 0 : 0;
        if (before < debit) throw new Error(`Saldo internal kurang ${formatRupiah(debit - before)}.`);
        const after = before - debit; const oldPoints = Number(userSnap.data().points) || 0;
        tx.update(BALANCE_REF, { balance: after, updatedAt: serverTimestamp(), updatedBy: currentUser.uid });
        tx.update(userRef, { points: oldPoints + points, updatedAt: serverTimestamp() });
        const pointRef = doc(collection(db, 'pointTransactions')); tx.set(pointRef, { id: pointRef.id, userId: selectedMember.id, memberId: selectedMember.memberId, amount: points, type: 'topup', description: `Top up langsung oleh admin; debit ${formatRupiah(debit)}`, adminUid: currentUser.uid, adminCreated: true, createdAt: serverTimestamp() });
        const ledger = doc(collection(db, 'adminBalanceLedger')); tx.set(ledger, { id: ledger.id, change: -debit, before, after, reason: `Top up langsung member ${selectedMember.memberId}`, adminUid: currentUser.uid, referenceId: pointRef.id, createdAt: serverTimestamp() });
        const log = doc(collection(db, 'adminLogs')); tx.set(log, { adminUid: currentUser.uid, action: 'ADMIN_DIRECT_TOPUP', targetType: 'user', targetId: selectedMember.id, details: `Tambah ${points} poin; debit ${debit}`, createdAt: serverTimestamp() });
      });
      setDirectPoints(''); showToast('Top up langsung berhasil; saldo admin dan poin diperbarui atomik.', 'success');
    } catch (err: any) { console.error(err); showToast(err?.message || 'Top up langsung gagal.', 'error'); }
    finally { setLoading(false); }
  };

  const verify = async (requestId: string) => {
    if (!currentUser) return; setBusyId(requestId);
    try {
      await runTransaction(db, async tx => {
        const reqRef = doc(db, 'topUpRequests', requestId); const reqSnap = await tx.get(reqRef);
        if (!reqSnap.exists()) throw new Error('Permintaan tidak ditemukan.');
        const req = reqSnap.data();
        if (req.status !== 'pending') throw new Error('Permintaan sudah diproses.');
        if (typeof req.paymentProofUrl !== 'string' || !req.paymentProofUrl.startsWith('https://')) throw new Error('Bukti pembayaran belum tersedia.');
        const userRef = doc(db, 'users', req.userId); const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) throw new Error('Profil member tidak ditemukan.');
        const balSnap = await tx.get(BALANCE_REF); const before = balSnap.exists() ? Number(balSnap.data().balance) || 0 : 0;
        const debit = Number(req.amountPaid); const points = Number(req.points); const nominal = Number(req.nominalValue);
        if (!Number.isSafeInteger(debit) || debit <= 0 || !Number.isSafeInteger(nominal) || nominal <= 0 || !Number.isSafeInteger(points) || points <= 0 || nominal < 100 || nominal !== points * 100) throw new Error('Nominal permintaan tidak valid.');
        let expectedPrice: number;
        if (req.packageId === '200') expectedPrice = points === 200 && nominal === 20000 ? 18999 : -1;
        else if (req.packageId === '500') expectedPrice = points === 500 && nominal === 50000 ? 48999 : -1;
        else if (req.packageId === 'custom') expectedPrice = Math.round(nominal * (nominal <= 35000 ? 18999 / 20000 : 48999 / 50000));
        else expectedPrice = -1;
        if (expectedPrice !== debit) throw new Error('Harga atau poin permintaan tidak sesuai paket/formula resmi.');
        if (before < debit) throw new Error(`Saldo internal kurang ${formatRupiah(debit - before)}.`);
        const after = before - debit; const oldPoints = Number(userSnap.data().points) || 0;
        tx.update(BALANCE_REF, { balance: after, updatedAt: serverTimestamp(), updatedBy: currentUser.uid });
        tx.update(userRef, { points: oldPoints + points, updatedAt: serverTimestamp() });
        tx.update(reqRef, { status: 'verified', verifiedBy: currentUser.uid, verifiedAt: serverTimestamp(), updatedAt: serverTimestamp(), adminDebit: debit });
        const pt = doc(collection(db, 'pointTransactions')); tx.set(pt, { id: pt.id, userId: req.userId, memberId: req.memberId, amount: points, type: 'topup', description: `Top up ${points} poin (${requestId})`, topUpRequestId: requestId, adminUid: currentUser.uid, createdAt: serverTimestamp() });
        const ledger = doc(collection(db, 'adminBalanceLedger')); tx.set(ledger, { id: ledger.id, change: -debit, before, after, reason: `Top up member ${req.memberId}`, adminUid: currentUser.uid, referenceId: requestId, createdAt: serverTimestamp() });
        const log = doc(collection(db, 'adminLogs')); tx.set(log, { adminUid: currentUser.uid, action: 'TOPUP_VERIFIED', targetType: 'topUpRequest', targetId: requestId, details: `${points} poin; debit ${debit}`, createdAt: serverTimestamp() });
      });
      showToast('Top up diverifikasi; debit saldo dan kredit poin diproses satu kali.', 'success');
    } catch (err: any) { console.error(err); showToast(err?.message || 'Verifikasi gagal.', 'error'); }
    finally { setBusyId(''); }
  };

  const reject = async (requestId: string) => {
    const why = rejectReason[requestId]?.trim(); if (!why) { showToast('Alasan penolakan wajib diisi.', 'error'); return; }
    if (!currentUser) return; setBusyId(requestId);
    try {
      await runTransaction(db, async tx => {
        const ref = doc(db, 'topUpRequests', requestId); const snap = await tx.get(ref);
        if (!snap.exists() || snap.data().status !== 'pending') throw new Error('Permintaan sudah diproses.');
        tx.update(ref, { status: 'rejected', rejectionReason: why, rejectedBy: currentUser.uid, rejectedAt: serverTimestamp(), updatedAt: serverTimestamp() });
        const log = doc(collection(db, 'adminLogs')); tx.set(log, { adminUid: currentUser.uid, action: 'TOPUP_REJECTED', targetType: 'topUpRequest', targetId: requestId, details: why, createdAt: serverTimestamp() });
      });
      showToast('Permintaan ditolak tanpa mengubah saldo atau poin.', 'success');
    } catch (err: any) { showToast(err?.message || 'Gagal menolak permintaan.', 'error'); }
    finally { setBusyId(''); }
  };

  const pending = requests.filter(r => r.status === 'pending');
  return <div className="space-y-5">
    <header><h1 className="text-2xl font-black text-white">Top Up Member & Saldo Internal</h1><p className="mt-1 text-xs text-stone-400">Saldo internal bukan saldo bank; top up QRIS tidak otomatis menambah saldo ini.</p></header>
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-stone-800 bg-stone-950 p-5"><div className="flex items-center gap-3"><CircleDollarSign className="h-8 w-8 text-amber-400"/><div><p className="text-xs text-stone-400">Saldo tersedia</p><p className="text-2xl font-black text-white">{formatRupiah(balance)}</p></div></div></div>
      <form onSubmit={addBalance} className="space-y-3 rounded-2xl border border-stone-800 bg-stone-950 p-5"><h2 className="font-extrabold text-white">Tambah saldo internal</h2><input value={amount} onChange={e => setAmount(e.target.value)} inputMode="numeric" placeholder="Nominal rupiah" className="w-full rounded-xl border border-stone-700 bg-stone-900 px-3 py-2.5 text-white" required/><input value={reason} onChange={e => setReason(e.target.value)} placeholder="Alasan setoran" className="w-full rounded-xl border border-stone-700 bg-stone-900 px-3 py-2.5 text-white" required/><button disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-stone-950 disabled:opacity-50"><Plus className="h-4 w-4"/>{loading ? 'Menyimpan…' : 'Tambah & catat ledger'}</button></form>
    </section>
    <form onSubmit={saveQris} className="space-y-3 rounded-2xl border border-stone-800 bg-stone-950 p-4"><h2 className="font-extrabold text-white">Pengaturan QRIS pembayaran</h2><p className="text-xs text-stone-400">Ganti hanya dengan gambar QRIS resmi merchant. QRIS tidak diverifikasi oleh aplikasi; uji pembayaran dan cocokkan nama merchant sebelum digunakan.</p>{qrisUrl && <a href={qrisUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-amber-400 underline">Lihat QRIS yang sedang aktif</a>}<input type="file" accept="image/*" onChange={e => setQrisFile(e.target.files?.[0] || null)} className="block w-full text-xs text-stone-300"/><button disabled={savingQris || !qrisFile} className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-stone-950 disabled:opacity-50">{savingQris ? 'Mengunggah…' : 'Simpan QRIS resmi ke Cloudinary'}</button></form>
    <section className="rounded-2xl border border-stone-800 bg-stone-950 p-4"><h2 className="mb-3 font-extrabold text-white">Ledger saldo internal admin</h2>{ledger.length === 0 ? <p className="text-xs text-stone-400">Belum ada pergerakan saldo tercatat.</p> : <div className="max-h-72 space-y-2 overflow-y-auto">{ledger.slice(0, 100).map(entry => <div key={entry.id} className="flex flex-wrap justify-between gap-2 border-b border-stone-800 py-2 text-xs"><div><p className="font-bold text-stone-200">{entry.reason || 'Perubahan saldo'}</p><p className="text-stone-500">Ref: {entry.referenceId || '-'} · Admin: {entry.adminUid || '-'}</p></div><div className="text-right"><p className={entry.change >= 0 ? 'font-black text-emerald-400' : 'font-black text-rose-400'}>{entry.change >= 0 ? '+' : ''}{formatRupiah(entry.change || 0)}</p><p className="text-stone-500">{formatRupiah(entry.before || 0)} → {formatRupiah(entry.after || 0)}</p></div></div>)}</div>}</section>
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-stone-800 bg-stone-950 p-5"><h2 className="font-extrabold text-white">Scan QR member</h2><p className="text-xs text-stone-400">QR harus berisi Member ID unik atau UID member yang valid.</p><MemberQrScanner onMemberCode={selectMemberByQr}/>{selectedMember && <div className="rounded-xl border border-emerald-900 bg-emerald-950/40 p-3 text-sm"><b className="text-white">{selectedMember.name}</b><p className="text-xs text-stone-300">{selectedMember.memberId} · {selectedMember.email}</p><p className="mt-1 text-xs text-amber-300">Saldo: {selectedMember.points} poin</p></div>}</div>
      <form onSubmit={createAdminTopUp} className="space-y-3 rounded-2xl border border-stone-800 bg-stone-950 p-5"><h2 className="font-extrabold text-white">Top up langsung oleh admin</h2><p className="text-xs text-stone-400">Setelah member diverifikasi melalui QR, poin yang diberikan akan mendebit saldo internal sebesar Rp100 per poin.</p><input value={directPoints} onChange={e => setDirectPoints(e.target.value)} inputMode="decimal" placeholder="Jumlah poin (boleh 0,5)" className="w-full rounded-xl border border-stone-700 bg-stone-900 px-3 py-2.5 text-white" required/><p className="text-xs text-stone-400">Debit: {formatRupiah((parseNonNegativeAmount(directPoints, {allowFraction:true}) || 0) * 100)}</p><button disabled={loading || !selectedMember} className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-stone-950 disabled:opacity-50">{loading ? 'Memproses…' : 'Debit saldo & tambah poin'}</button></form>
    </section>
    <section className="space-y-4"><h2 className="font-extrabold text-white">Permintaan menunggu ({pending.length})</h2>{pending.length === 0 ? <p className="rounded-2xl border border-stone-800 p-6 text-center text-sm text-stone-400">Tidak ada permintaan pending.</p> : pending.map(r => <article key={r.id} className="space-y-3 rounded-2xl border border-stone-800 bg-stone-950 p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black text-white">{r.memberName || 'Member'} · {r.memberId}</h3><p className="text-xs text-stone-400">{r.memberEmail} · {r.points} poin</p><p className="mt-1 text-sm font-extrabold text-amber-400">Dibayar: {formatRupiah(r.amountPaid || 0)} · Nilai poin {formatRupiah(r.nominalValue || 0)}</p></div><a href={r.paymentProofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 underline">Lihat bukti <ExternalLink className="h-3 w-3"/></a></div><div className="grid gap-2 sm:grid-cols-2"><button disabled={busyId === r.id} onClick={() => verify(r.id)} className="inline-flex justify-center items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white disabled:opacity-50"><Check className="h-4 w-4"/> {busyId === r.id ? 'Memproses…' : 'Konfirmasi bukti & kredit poin'}</button><div className="flex gap-2"><input value={rejectReason[r.id] || ''} onChange={e => setRejectReason(old => ({ ...old, [r.id]: e.target.value }))} placeholder="Alasan penolakan" className="min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-900 px-3 text-xs text-white"/><button disabled={busyId === r.id} onClick={() => reject(r.id)} className="rounded-xl border border-rose-900 px-3 py-2 text-xs font-bold text-rose-300"><X className="inline h-4 w-4"/> Tolak</button></div></div></article>)}</section>
    <section className="rounded-2xl border border-stone-800 bg-stone-950 p-4"><h2 className="mb-2 font-extrabold text-white">Riwayat permintaan</h2><div className="space-y-2">{requests.filter(r => r.status !== 'pending').map(r => <div key={r.id} className="flex justify-between gap-3 border-b border-stone-800 py-2 text-xs"><span className="text-stone-300">{r.memberName} · {r.points} poin · {formatRupiah(r.amountPaid || 0)}</span><span className={r.status === 'verified' ? 'font-bold text-emerald-400' : 'font-bold text-rose-400'}>{r.status === 'verified' ? 'Terverifikasi' : `Ditolak: ${r.rejectionReason || ''}`}</span></div>)}</div></section>
  </div>;
};
