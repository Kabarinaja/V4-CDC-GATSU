import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Award, MessageCircle, Menu as MenuIcon, X, Home, Utensils, ReceiptText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const logoUrl = 'https://cdn.phototourl.com/member/2026-10-04-0358363c-e2cc-469e-8e79-0f841bfb3c3c.png';

export const Navbar: React.FC = () => {
  const { profile } = useAuth();
  const { totalItemsCount } = useCart();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  const navLinks = [
    { label: 'Beranda', to: '/', icon: Home },
    { label: 'Menu', to: '/menu', icon: Utensils },
    { label: 'Pesanan', to: '/pesanan', icon: ReceiptText },
    { label: 'Member & Poin', to: '/member', icon: Award },
    { label: 'Chat Admin', to: '/chat', icon: MessageCircle },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Beranda MY CDC GATSU">
            <img src={logoUrl} alt="MY CDC GATSU" className="h-9 w-auto max-w-[52px] object-contain" />
            <div className="min-w-0 leading-none">
              <p className="truncate text-[12px] font-black tracking-tight text-zinc-950">DICELUP AYAM CRISPY</p>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em] text-amber-600">Indramayu · MY CDC GATSU</p>
            </div>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={`rounded-xl px-3 py-2 text-[11px] font-bold transition ${isActive(link.to) ? 'bg-amber-100 text-amber-900' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'}`}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            {profile && <Link to="/poin" className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-extrabold text-amber-800 sm:flex sm:items-center sm:gap-1.5"><Award className="h-3.5 w-3.5" />{profile.points} poin</Link>}
            <Link to="/checkout" className="relative grid h-10 w-10 place-items-center rounded-xl text-zinc-700 hover:bg-zinc-100" aria-label="Keranjang">
              <ShoppingBag className="h-[19px] w-[19px]" />
              {totalItemsCount > 0 && <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">{totalItemsCount}</span>}
            </Link>
            {profile ? (
              <Link to="/profil" className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-xs font-black text-zinc-900 hover:bg-zinc-200" aria-label="Profil">{profile.name.charAt(0).toUpperCase()}</Link>
            ) : (
              <Link to="/login" className="hidden rounded-xl bg-zinc-950 px-3.5 py-2.5 text-[11px] font-extrabold text-white sm:block">Masuk</Link>
            )}
            <button onClick={() => setMobileMenuOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-xl text-zinc-700 hover:bg-zinc-100 md:hidden" aria-label="Menu lainnya">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-zinc-100 bg-white px-4 pb-4 pt-2 shadow-lg md:hidden">
            {profile && <div className="mb-2 flex items-center justify-between rounded-2xl bg-amber-50 p-3"><div><p className="text-xs font-extrabold text-zinc-950">{profile.name}</p><p className="mt-0.5 text-[10px] text-zinc-500">{profile.memberId}</p></div><span className="text-xs font-black text-amber-800">{profile.points} poin</span></div>}
            <div className="grid grid-cols-2 gap-2">
              {navLinks.slice(3).map((link) => { const Icon = link.icon; return <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 text-xs font-bold text-zinc-700"><Icon className="h-4 w-4 text-amber-600" />{link.label}</Link>; })}
              {!profile && <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-zinc-950 px-3 py-2.5 text-center text-xs font-extrabold text-white">Masuk / Daftar</Link>}
              {profile && <Link to="/profil" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-zinc-950 px-3 py-2.5 text-center text-xs font-extrabold text-white">Profil Saya</Link>}
            </div>
          </div>
        )}
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/90 bg-white/96 px-2 pb-[max(7px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_rgba(24,24,27,0.08)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {[
            { label: 'Beranda', to: '/', icon: Home },
            { label: 'Menu', to: '/menu', icon: Utensils },
            { label: 'Troli', to: '/checkout', icon: ShoppingBag },
            { label: 'Pesanan', to: '/pesanan', icon: ReceiptText },
            { label: 'Profil', to: profile ? '/profil' : '/login', icon: User },
          ].map((item) => { const Icon = item.icon; const active = isActive(item.to); return (
            <Link key={item.label} to={item.to} className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[9px] font-bold ${active ? 'text-amber-700' : 'text-zinc-400'}`}>
              <span className={`relative grid h-7 w-9 place-items-center rounded-xl ${active ? 'bg-amber-100' : ''}`}>
                <Icon className="h-[17px] w-[17px]" />
                {item.label === 'Troli' && totalItemsCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[8px] font-black text-white">{totalItemsCount}</span>}
              </span>
              {item.label}
            </Link>
          ); })}
        </div>
      </nav>
    </>
  );
};
