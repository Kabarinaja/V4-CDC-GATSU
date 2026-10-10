import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MemberCard } from '../components/member/MemberCard';
import { Link } from 'react-router-dom';
import { Award, QrCode, ShoppingBag, Receipt, Sparkles, Store, Phone, CircleDollarSign } from 'lucide-react';

export const MemberPage: React.FC = () => {
  const { profile, currentUser } = useAuth();

  if (!currentUser || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto">
          <QrCode className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-stone-900">Kartu Member Digital</h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          Dapatkan kartu member resmi MY CDC GATSU dengan mendaftar atau masuk ke akun Anda.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Link
            to="/login?redirect=/member"
            className="py-2.5 px-6 rounded-xl bg-stone-900 text-white font-bold text-xs"
          >
            Masuk Akun
          </Link>
          <Link
            to="/register"
            className="py-2.5 px-6 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
          >
            Daftar Member Baru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Kartu Member & QR</h1>
          <p className="text-xs text-stone-500">Tunjukkan barcode saat bertransaksi di outlet kasir</p>
        </div>
        <Link
          to="/poin"
          className="px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-xs font-bold hover:bg-amber-100"
        >
          {profile.points} Poin
        </Link>
      </div>

      {/* VIP Card */}
      <MemberCard profile={profile} />

      {/* Offline Shopping Instructions */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-stone-900">Cara Pakai di Outlet Kasir</h3>
            <p className="text-[11px] text-stone-500">Bisa belanja langsung di outlet MY CDC GATSU</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center mb-1">
              1
            </span>
            <h4 className="font-bold text-stone-900">Tunjukkan QR</h4>
            <p className="text-stone-600 text-[11px]">
              Tunjukkan kode QR pada kartu member ini ke kasir saat memesan di kasir outlet.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center mb-1">
              2
            </span>
            <h4 className="font-bold text-stone-900">Sebutkan No. WhatsApp</h4>
            <p className="text-stone-600 text-[11px]">
              Kasir juga bisa mencari akun member Anda melalui nomor WhatsApp: <strong>{profile.whatsapp}</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center mb-1">
              3
            </span>
            <h4 className="font-bold text-stone-900">Dapatkan Poin / Diskon</h4>
            <p className="text-stone-600 text-[11px]">
              Tukar poin saldo untuk potongan langsung atau dapatkan poin reward tambahan.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/isi-poin" className="p-4 rounded-2xl bg-amber-50 border border-amber-200 hover:border-amber-400 transition-all flex items-center justify-between shadow-xs"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-white text-amber-700"><CircleDollarSign className="w-5 h-5" /></div><div><span className="text-xs font-bold text-stone-900 block">Isi Poin</span><span className="text-[11px] text-stone-500">Pilih paket atau nominal custom</span></div></div><span className="text-xs font-bold text-amber-600">&gt;</span></Link>
        <Link
          to="/poin"
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-300 transition-all flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-900 block">Riwayat Poin</span>
              <span className="text-[11px] text-stone-500">Buku besar poin member</span>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-600">&gt;</span>
        </Link>

        <Link
          to="/pesanan"
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-300 transition-all flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-900 block">Riwayat Transaksi</span>
              <span className="text-[11px] text-stone-500">Semua pesanan online delivery</span>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-600">&gt;</span>
        </Link>
      </div>
    </div>
  );
};
