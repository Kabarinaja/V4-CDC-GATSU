import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Utensils,
  Award,
  CircleDollarSign,
  MessageCircle,
  Megaphone,
  BarChart3,
  LogOut,
  Bell,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const AdminLayout: React.FC = () => {
  const { currentUser, profile, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  // Real-time listener for pending verification orders
  useEffect(() => {
    if (!isAdmin) return;

    try {
      const q = query(
        collection(db, 'orders'),
        where('paymentStatus', '==', 'pending_verification')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setNewOrdersCount(snapshot.docs.length);
        },
        (err) => {
          console.warn('Orders count snapshot note:', err.message);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.error('Error listening to new orders count:', e);
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center text-white p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-stone-300">Memverifikasi otorisasi admin crew...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
            <X className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Akses Terbatas Crew Outlet</h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            Halaman ini khusus untuk manajemen operasional MY CDC GATSU. Silakan login menggunakan akun crew berwenang melalui pintu masuk resmi.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/admingatsu"
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-colors"
            >
              Masuk ke Pintu Crew (/admingatsu)
            </Link>
            <Link
              to="/"
              className="w-full py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Kembali ke Beranda Publik
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Pesanan', to: '/admin/orders', icon: ShoppingBag, badge: newOrdersCount },
    { label: 'Member', to: '/admin/members', icon: Users },
    { label: 'Produk', to: '/admin/products', icon: Utensils },
    { label: 'Poin', to: '/admin/points', icon: Award },
    { label: 'Top Up Member', to: '/admin/topups', icon: CircleDollarSign },
    { label: 'Chat CS', to: '/admin/chat', icon: MessageCircle },
    { label: 'Promosi', to: '/admin/promotions', icon: Megaphone },
    { label: 'Laporan', to: '/admin/reports', icon: BarChart3 },
  ];

  const isActive = (item: { to: string; exact?: boolean }) => {
    if (item.exact) {
      return location.pathname === item.to;
    }
    return location.pathname.startsWith(item.to);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admingatsu');
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col md:flex-row">
      {/* Top Header Mobile */}
      <header className="md:hidden bg-stone-950 border-b border-stone-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <img
            src="https://cdn.phototourl.com/member/2026-10-04-0358363c-e2cc-469e-8e79-0f841bfb3c3c.png"
            alt="MY CDC Logo"
            className="h-8 w-auto"
          />
          <div>
            <h1 className="text-sm font-extrabold text-white">CDC GATSU</h1>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Crew Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {newOrdersCount > 0 && (
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 bg-rose-600/90 text-white px-2.5 py-1 rounded-full text-xs font-bold"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{newOrdersCount} Baru</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-stone-800 text-stone-300"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar for Desktop & Mobile drawer */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-stone-950 border-r border-stone-800 flex flex-col justify-between z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Admin identity */}
          <div className="p-5 border-b border-stone-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.phototourl.com/member/2026-10-04-0358363c-e2cc-469e-8e79-0f841bfb3c3c.png"
                alt="Logo"
                className="h-9 w-auto"
              />
              <div>
                <h2 className="text-sm font-extrabold text-white tracking-tight">MY CDC GATSU</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[11px] font-bold text-amber-500">Crew Dashboard</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-stone-400 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Orders Alert Banner */}
          {newOrdersCount > 0 && (
            <div className="m-3 p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl flex items-center justify-between text-xs text-rose-200">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-400 animate-bounce" />
                <span className="font-bold">Pesanan Baru ({newOrdersCount})</span>
              </div>
              <Link
                to="/admin/orders"
                onClick={() => setSidebarOpen(false)}
                className="underline font-bold text-white hover:text-amber-400 text-[11px]"
              >
                Periksa
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                      : 'text-stone-400 hover:text-white hover:bg-stone-850'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-stone-950' : 'text-stone-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        active ? 'bg-stone-950 text-white' : 'bg-rose-600 text-white animate-pulse'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-stone-850 space-y-3">
          <div className="bg-stone-900 rounded-xl p-2.5 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-bold text-white truncate">{profile?.name || 'Admin Crew'}</p>
              <p className="text-[10px] text-amber-400 font-mono truncate">{profile?.email || currentUser?.email}</p>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">Admin</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lihat Web</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-semibold transition-colors"
              title="Logout Crew"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content View */}
      <main className="flex-1 bg-stone-900 min-h-screen p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
