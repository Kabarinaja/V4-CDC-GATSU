import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  Clock,
  ExternalLink,
  FileEdit,
  FileText,
  FolderKanban,
  LogOut,
  Megaphone,
  Menu,
  PenSquare,
  Settings,
  Users,
  X,
} from 'lucide-react';
import logoHeaderImg from '../../assets/logo-header.png';
import { useGatsuAuth } from '../../context/GatsuAuthContext';

const NAV_ITEMS = [
  { to: '/gatsuwewarah/admin', label: 'Statistik', icon: BarChart3, end: true },
  { to: '/gatsuwewarah/admin/tulis', label: 'Tulis Berita', icon: PenSquare },
  { to: '/gatsuwewarah/admin/berita', label: 'Semua Berita', icon: FileText },
  { to: '/gatsuwewarah/admin/draft', label: 'Draft', icon: FileEdit },
  { to: '/gatsuwewarah/admin/terjadwal', label: 'Berita Terjadwal', icon: Clock },
  { to: '/gatsuwewarah/admin/kategori', label: 'Kategori', icon: FolderKanban },
  { to: '/gatsuwewarah/admin/penulis', label: 'Manajemen Penulis', icon: Users },
  { to: '/gatsuwewarah/admin/iklan', label: 'Manajemen Iklan', icon: Megaphone },
  { to: '/gatsuwewarah/admin/pengaturan', label: 'Pengaturan Portal', icon: Settings },
];

export const AdminLayout: React.FC = () => {
  const { user, logoutAdmin } = useGatsuAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderSidebarLinks = () => (
    <nav aria-label="Menu Dashboard Redaksi" className="p-3 space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-neutral-950 text-white'
                  : 'text-neutral-700 hover:bg-stone-100 hover:text-neutral-950'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F8F8F7] text-neutral-900 flex flex-col">
      {/* Top Newsroom Bar */}
      <header className="bg-[#0A0A0A] text-white border-b border-neutral-800 sticky top-0 z-30">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka sidebar admin"
              className="lg:hidden p-2 -ml-1 text-neutral-300 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/gatsuwewarah/admin" className="shrink-0">
              <img
                src={logoHeaderImg}
                alt="GATSU WEWARAH"
                className="h-7 sm:h-8 w-auto object-contain"
              />
            </Link>
            <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-widest text-neutral-400 border-l border-neutral-700 pl-3 whitespace-nowrap">
              Meja Redaksi
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <Link
              to="/gatsuwewarah"
              target="_blank"
              className="text-xs font-medium text-neutral-300 hover:text-white inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lihat Portal</span>
            </Link>
            <span className="hidden md:inline-block text-xs text-neutral-400 truncate max-w-[180px]">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => void logoutAdmin()}
              className="px-3 py-1.5 text-xs font-semibold border border-neutral-700 text-neutral-200 hover:bg-neutral-800 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-60 bg-white border-r border-stone-200 shrink-0">
          {renderSidebarLinks()}
        </aside>

        {/* Mobile Drawer Sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden bg-black/50 flex"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi Admin"
          >
            <div className="w-64 bg-white h-full overflow-y-auto">
              <div className="bg-[#0A0A0A] px-4 h-14 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  Menu Redaksi
                </span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Tutup menu admin"
                  className="p-2 text-neutral-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderSidebarLinks()}
            </div>
            <button
              type="button"
              aria-label="Tutup latar menu"
              onClick={() => setSidebarOpen(false)}
              className="flex-1 cursor-default"
            />
          </div>
        )}

        {/* Main Workspace */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1120px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
