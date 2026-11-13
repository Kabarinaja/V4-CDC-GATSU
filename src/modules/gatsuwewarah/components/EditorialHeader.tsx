import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, X } from 'lucide-react';
import logoHeaderImg from '../assets/logo-header.png';
import type { Category } from '../types';

interface EditorialHeaderProps {
  categories: Category[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  demoSuffix?: string;
}

export const EditorialHeader: React.FC<EditorialHeaderProps> = ({
  categories,
  searchQuery,
  onSearchChange,
  demoSuffix = '',
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date());

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.pathname.endsWith('/gatsuwewarah') && !location.pathname.endsWith('/gatsuwewarah/')) {
      navigate(`/gatsuwewarah${demoSuffix}`);
    }
    setSearchOpen(false);
  };

  const isHome =
    location.pathname === '/gatsuwewarah' ||
    location.pathname === '/gatsuwewarah/';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
      {/* Primary Editorial Black Masthead */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi redaksi"
              className="md:hidden -ml-1 p-2 text-neutral-300 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              to={`/gatsuwewarah${demoSuffix}`}
              className="flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400"
              aria-label="Beranda GATSU WEWARAH"
            >
              <img
                src={logoHeaderImg}
                alt="GATSU WEWARAH"
                className="h-8 sm:h-10 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <span className="hidden lg:inline-block text-xs text-neutral-400 tabular-nums whitespace-nowrap">
              {todayFormatted}
            </span>

            <Link
              to={`/gatsuwewarah/tentang-redaksi${demoSuffix}`}
              className="hidden sm:inline-block text-xs font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Redaksi
            </Link>

            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label={searchOpen ? 'Tutup pencarian berita' : 'Cari berita'}
              aria-expanded={searchOpen}
              className="p-2 text-neutral-300 hover:text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Editorial Search Bar */}
        {searchOpen && (
          <div className="border-t border-neutral-800 bg-[#121212]">
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3"
            >
              <label htmlFor="gatsu-search-input" className="sr-only">
                Cari berita GATSU WEWARAH
              </label>
              <input
                id="gatsu-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari berita, topik, atau penulis..."
                autoFocus
                className="flex-1 bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-400 text-sm px-3.5 py-2 focus:outline-none focus:border-red-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="text-xs text-neutral-400 hover:text-white px-2 py-2 whitespace-nowrap shrink-0"
                >
                  Reset
                </button>
              )}
              <button
                type="submit"
                className="bg-red-700 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 transition-colors whitespace-nowrap shrink-0"
              >
                Cari
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Category Navigation Strip (Single-Row Scrollable on Mobile) */}
      <nav
        aria-label="Kanal berita GATSU WEWARAH"
        className="bg-white border-b border-stone-200"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center gap-6 overflow-x-auto no-scrollbar">
          <Link
            to={`/gatsuwewarah${demoSuffix}`}
            className={`py-2.5 text-[13px] font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors ${
              isHome
                ? 'border-red-700 text-neutral-950'
                : 'border-transparent text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Beranda
          </Link>

          {categories.map((cat) => {
            const isActive = location.pathname.includes(
              `/gatsuwewarah/kategori/${cat.slug}`
            );
            return (
              <Link
                key={cat.id}
                to={`/gatsuwewarah/kategori/${cat.slug}${demoSuffix}`}
                className={`py-2.5 text-[13px] font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                  isActive
                    ? 'border-red-700 text-neutral-950 font-semibold'
                    : 'border-transparent text-neutral-600 hover:text-neutral-950'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/60 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu Redaksi GATSU WEWARAH"
        >
          <div className="w-[82%] max-w-xs bg-white h-full flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="bg-[#0A0A0A] px-4 py-3.5 flex items-center justify-between">
                <img
                  src={logoHeaderImg}
                  alt="GATSU WEWARAH"
                  className="h-8 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Tutup menu navigasi"
                  className="p-2 text-neutral-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 py-3 border-b border-stone-200 text-xs text-stone-500">
                {todayFormatted}
              </div>

              <div className="py-2">
                <p className="px-4 py-2 text-[11px] font-semibold tracking-wider uppercase text-stone-400">
                  Kanal Berita
                </p>
                <Link
                  to={`/gatsuwewarah${demoSuffix}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-stone-50"
                >
                  Beranda Utama
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/gatsuwewarah/kategori/${cat.slug}${demoSuffix}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-stone-50"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              <div className="border-t border-stone-200 py-2">
                <p className="px-4 py-2 text-[11px] font-semibold tracking-wider uppercase text-stone-400">
                  Informasi Redaksi
                </p>
                <Link
                  to={`/gatsuwewarah/tentang-redaksi${demoSuffix}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-stone-50"
                >
                  Tentang Redaksi
                </Link>
                <Link
                  to={`/gatsuwewarah/kontak-redaksi${demoSuffix}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-stone-50"
                >
                  Kontak Redaksi
                </Link>
                <Link
                  to={`/gatsuwewarah/kebijakan-privasi${demoSuffix}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-stone-50"
                >
                  Kebijakan Privasi
                </Link>
                <Link
                  to={`/gatsuwewarah/pedoman-media-siber${demoSuffix}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-stone-50"
                >
                  Pedoman Media Siber
                </Link>
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50">
              <Link
                to="/gatsuwewarah/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 text-xs font-semibold bg-neutral-950 text-white hover:bg-neutral-800 transition-colors"
              >
                Masuk Redaksi
              </Link>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup latar menu"
            onClick={() => setMobileMenuOpen(false)}
            className="flex-1 cursor-default"
          />
        </div>
      )}
    </header>
  );
};
