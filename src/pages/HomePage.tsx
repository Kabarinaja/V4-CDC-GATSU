import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, MapPin, Search, Truck } from 'lucide-react';
import { PromoBanner } from '../components/home/PromoBanner';
import { MemberCard } from '../components/member/MemberCard';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div className="mobile-bottom-space mx-auto max-w-6xl px-3 pb-10 pt-3 sm:px-6 sm:pt-6">
      {/* Member area sengaja ditempatkan paling atas untuk akses cepat pelanggan. */}
      {profile && (
        <section className="mb-5">
          <div className="mb-2.5 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-600">Member area</p>
              <h2 className="mt-0.5 text-base font-black tracking-tight text-zinc-950">Halo, {profile.name}</h2>
            </div>
            <Link to="/member" className="text-[10px] font-extrabold text-zinc-500 hover:text-zinc-950">Lihat member →</Link>
          </div>
          <MemberCard profile={profile} compact />
        </section>
      )}

      {/* Promo tetap berada di atas konten utama, tanpa memotong poster A4. */}
      <PromoBanner />

      <section className="overflow-hidden rounded-[26px] border border-zinc-200 bg-white shadow-[0_10px_35px_rgba(24,24,27,0.06)]">
        <div className="relative isolate overflow-hidden bg-zinc-950 px-5 py-7 text-white sm:px-9 sm:py-10">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">DICELUP AYAM CRISPY · INDRAMAYU</p>
            <h1 className="max-w-xl text-[28px] font-black leading-[1.08] tracking-[-0.03em] sm:text-5xl">Renyahnya ayam, sausnya bikin balik lagi.</h1>
            <p className="mt-4 max-w-xl text-xs leading-6 text-zinc-300 sm:text-sm">Pesan menu favorit, simpan di troli, cek status pesanan, dan kumpulkan poin member dalam satu tempat.</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link to="/menu" className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-xs font-black text-zinc-950 shadow-lg shadow-amber-950/20">Lihat Menu <ArrowRight className="h-4 w-4" /></Link>
              {!profile && <Link to="/register" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-xs font-extrabold text-white hover:bg-white/10">Daftar Member</Link>}
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-100 bg-white p-3 sm:p-4">
          <Link to="/menu" className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-3.5 ring-1 ring-zinc-200/70 transition hover:bg-zinc-100">
            <Search className="h-5 w-5 text-zinc-400" />
            <span className="flex-1 text-xs text-zinc-400 sm:text-sm">Cari ayam, saus, atau menu favoritmu...</span>
            <span className="hidden rounded-xl bg-white px-2.5 py-1.5 text-[9px] font-bold text-zinc-500 shadow-sm sm:block">Buka Menu</span>
          </Link>
        </div>
      </section>

      <section className="mt-5 rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 mt-2" />
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-600">Layanan</p>
            <h2 className="mt-1 text-base font-black text-zinc-950">Delivery & pemesanan online</h2>
            <p className="mt-1.5 text-[11px] leading-5 text-zinc-500">Pesanan diproses selama jam operasional. Detail ongkir dan total mengikuti sistem checkout yang sudah tersedia.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-zinc-50 px-3.5 py-3 text-[10px] font-bold text-zinc-600"><Clock3 className="h-4 w-4 text-amber-600" /> Senin–Sabtu · 07.00–17.00 · Minggu tutup</div>
      </section>

      <section className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-700">Tentang kami</p>
        <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-950">Mitra Master Kuliner Indonesia</h2>
        <p className="mt-1.5 max-w-xl text-[11px] leading-5 text-zinc-600">MY CDC GATSU adalah mitra Master Kuliner Indonesia (MKI) dan telah hadir sejak 2024.</p>
      </section>

      <section className="mt-5 rounded-[24px] bg-zinc-950 p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-400">Outlet</p><h2 className="mt-1 text-lg font-black">Kunjungi MY CDC GATSU</h2><p className="mt-1.5 text-[11px] leading-5 text-zinc-400">Makan di tempat atau take away langsung dari outlet.</p></div>
          <a href="https://maps.app.goo.gl/pPDPnQA9NaJwpdbn9?g_st=ac&utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-[10px] font-black text-zinc-950"><MapPin className="h-4 w-4" /> Google Maps</a>
        </div>
      </section>
    </div>
  );
};
