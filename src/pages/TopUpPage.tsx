import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { Award, ArrowLeft, CheckCircle2, Clock3, UploadCloud } from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { uploadToCloudinary } from '../lib/cloudinary';
import { formatRupiah } from '../lib/utils';

const QRIS_IMAGE_URL = 'https://cdn.phototourl.com/member/2026-10-04-fbcdab0a-d217-4805-a1f1-1f77b618f546.jpg';
const PACKAGES = [
  { id: '200', points: 200, nominal: 20000, price: 18999 },
  { id: '500', points: 500, nominal: 50000, price: 48999 },
] as const;

export const TopUpPage: React.FC = () => {
  const { currentUser, profile } = useAuth();
  const { showToast } = useNotification();
  const [kind, setKind] = useState<'200' | '500' | 'custom'>('200');
  const [customNominal, setCustomNominal] = useState('20000');
  const [proof, setProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [qrisImageUrl, setQrisImageUrl] = useState(QRIS_IMAGE_URL);

  useEffect(() => {
    const unsubscribeQris = onSnapshot(doc(db, 'appSettings', 'payment'), snap => {
      const url = snap.exists() ? snap.data().qrisImageUrl : '';
      if (typeof url === 'string' && url.startsWith('https://')) setQrisImageUrl(url);
    }, err => console.warn('QRIS setting:', err));
    if (!currentUser) return () => unsubscribeQris();
    const q = query(collection(db, 'topUpRequests'), where('userId', '==', currentUser.uid));
    const unsubscribeRequests = onSnapshot(q, snap => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))), err => console.warn('Top up history:', err));
    return () => { unsubscribeQris(); unsubscribeRequests(); };
  }, [currentUser]);

  const quote = useMemo(() => {
    if (kind !== 'custom') {
      const pack = PACKAGES.find(p => p.id === kind)!;
      return { points: pack.points, nominal: pack.nominal, price: pack.price, discount: pack.nominal - pack.price, packageId: pack.id };
    }
    const nominal = Number(customNominal);
    if (!Number.isSafeInteger(nominal) || nominal < 100 || nominal % 100 !== 0) return null;
    const points = nominal / 100;
    // Transparan: nominal custom <= Rp35.000 memakai rasio promo paket 200 poin;
    // nominal di atasnya memakai rasio paket 500 poin. Harga dibulatkan ke rupiah terdekat.
    const promoRatio = nominal <= 35000 ? 18999 / 20000 : 48999 / 50000;
    const price = Math.max(1, Math.round(nominal * promoRatio));
    return { points, nominal, price, discount: nominal - price, packageId: 'custom' };
  }, [kind, customNominal]);

  if (!currentUser || !profile) return <div className="mx-auto max-w-xl p-8 text-center">Silakan <Link className="font-bold text-amber-700 underline" to="/login?redirect=/isi-poin">login</Link> untuk isi poin.</div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote || quote.points <= 0 || !Number.isSafeInteger(quote.price) || quote.price <= 0) {
      showToast('Nominal custom harus minimal Rp100 dan kelipatan Rp100.', 'error'); return;
    }
    if (!proof) { showToast('Unggah bukti pembayaran setelah membayar melalui QRIS.', 'error'); return; }
    if (proof.size > 8 * 1024 * 1024) { showToast('Ukuran bukti maksimal 8 MB.', 'error'); return; }
    setSubmitting(true);
    try {
      const proofUrl = await uploadToCloudinary(proof, 'payment-proofs');
      await addDoc(collection(db, 'topUpRequests'), {
        userId: currentUser.uid, memberId: profile.memberId, memberName: profile.name, memberEmail: profile.email,
        points: quote.points, packageId: quote.packageId, nominalValue: quote.nominal, discount: quote.discount,
        amountPaid: quote.price, paymentProofUrl: proofUrl, status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      setProof(null); showToast('Permintaan top up dikirim. Poin akan masuk setelah admin memverifikasi pembayaran.', 'success');
    } catch (error) { console.error(error); showToast('Gagal mengirim permintaan. Periksa koneksi dan coba lagi.', 'error'); }
    finally { setSubmitting(false); }
  };

  return <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 pb-24">
    <Link to="/poin" className="inline-flex items-center gap-2 text-xs font-bold text-stone-600"><ArrowLeft className="h-4 w-4"/> Kembali ke Poin</Link>
    <header><h1 className="text-2xl font-black text-stone-950">Isi Poin Member</h1><p className="mt-1 text-sm text-stone-500">Saldo saat ini <b className="text-amber-700">{profile.points} poin</b> · 1 poin bernilai Rp100.</p></header>
    <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
        <h2 className="font-extrabold">1. Pilih paket</h2>
        {PACKAGES.map(p => <button key={p.id} type="button" onClick={() => setKind(p.id)} className={`w-full rounded-xl border p-3 text-left ${kind === p.id ? 'border-amber-500 bg-amber-50' : 'border-stone-200'}`}><span className="flex justify-between font-black"><span>{p.points} poin</span><span>{formatRupiah(p.price)}</span></span><span className="mt-1 block text-xs text-stone-500">Nilai {formatRupiah(p.nominal)} · hemat {formatRupiah(p.nominal-p.price)}</span></button>)}
        <button type="button" onClick={() => setKind('custom')} className={`w-full rounded-xl border p-3 text-left ${kind === 'custom' ? 'border-amber-500 bg-amber-50' : 'border-stone-200'}`}><b>Nominal custom</b><span className="mt-1 block text-xs text-stone-500">Pilih nominal rupiah; poin dihitung otomatis.</span></button>
        {kind === 'custom' && <label className="block space-y-1 text-sm"><span>Nominal poin (Rp, kelipatan 100)</span><input value={customNominal} onChange={e => setCustomNominal(e.target.value)} inputMode="numeric" className="w-full rounded-xl border border-stone-300 px-3 py-2.5" placeholder="Contoh: 25000"/><span className="text-xs text-stone-500">{quote ? `${quote.points} poin` : 'Minimal Rp100, kelipatan Rp100.'}</span></label>}
        {quote && <div className="space-y-2 rounded-xl bg-stone-50 p-3 text-sm"><div className="flex justify-between"><span>Poin diterima</span><b>{quote.points} poin</b></div><div className="flex justify-between"><span>Nilai normal</span><span>{formatRupiah(quote.nominal)}</span></div><div className="flex justify-between text-emerald-700"><span>Diskon promo</span><b>-{formatRupiah(quote.discount)}</b></div><div className="flex justify-between border-t pt-2 font-black"><span>Total dibayar</span><span>{formatRupiah(quote.price)}</span></div></div>}
        <p className="text-[11px] leading-5 text-stone-500">Harga custom menggunakan rasio promo paket 200 poin untuk nominal sampai Rp35.000 dan rasio paket 500 poin di atasnya; pembulatan ke rupiah terdekat.</p>
      </section>
      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
        <h2 className="font-extrabold">2. Bayar dan unggah bukti</h2>
        <p className="text-xs leading-5 text-stone-600">Bayar tepat sesuai total. QRIS yang ditampilkan merupakan aset eksternal yang sudah dirujuk checkout; validitas dan status aktif merchant tetap perlu dipastikan pemilik outlet sebelum digunakan.</p>
        <a href={qrisImageUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-stone-200 p-3 text-center"><img src={qrisImageUrl} alt="QRIS pembayaran MY CDC GATSU" className="mx-auto max-h-64 w-full object-contain"/><span className="mt-2 block text-xs font-bold text-amber-700">Buka gambar QRIS</span></a>
        <label className="block space-y-2 text-sm"><span className="font-bold">Screenshot bukti pembayaran *</span><span className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 p-3 text-xs text-stone-600"><UploadCloud className="h-5 w-5"/><input type="file" accept="image/*" onChange={e => setProof(e.target.files?.[0] || null)} required/> </span><span className="block text-xs text-stone-500">Format gambar, maksimal 8 MB.</span></label>
        <button disabled={submitting || !quote} className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-stone-950 disabled:opacity-50">{submitting ? 'Mengirim permintaan…' : 'Kirim untuk verifikasi'}</button>
        <p className="flex items-start gap-2 text-xs text-stone-500"><Clock3 className="h-4 w-4 shrink-0"/> Status tetap menunggu dan poin belum ditambahkan sampai admin menyetujui bukti pembayaran.</p>
      </section>
    </form>
    <section className="rounded-2xl border border-stone-200 bg-white p-4"><h2 className="mb-3 font-extrabold">Riwayat permintaan top up</h2>{requests.length === 0 ? <p className="text-xs text-stone-500">Belum ada permintaan top up.</p> : <div className="space-y-3">{requests.map(r => <div key={r.id} className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3 last:border-0"><div><p className="font-bold">{r.points} poin · {formatRupiah(r.amountPaid || 0)}</p><p className="text-xs text-stone-500">{r.status === 'verified' ? 'Berhasil diverifikasi' : r.status === 'rejected' ? `Ditolak: ${r.rejectionReason || '-'}` : 'Menunggu verifikasi'}</p></div><span className="text-xs font-bold">{r.status === 'verified' ? <CheckCircle2 className="h-5 w-5 text-emerald-600"/> : r.status === 'pending' ? <Clock3 className="h-5 w-5 text-amber-600"/> : 'Ditolak'}</span></div>)}</div>}</section>
  </div>;
};
