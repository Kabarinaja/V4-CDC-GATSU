import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import logoHeaderImg from '../../assets/logo-header.png';
import { useGatsuAuth } from '../../context/GatsuAuthContext';
import { useDocumentHead } from '../../lib/useDocumentHead';

export const AdminLoginPage: React.FC = () => {
  const { loginAdmin, authError, clearAuthError } = useGatsuAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useDocumentHead({
    title: 'Masuk Meja Redaksi — GATSU WEWARAH',
    description: 'Portal administrasi redaksi GATSU WEWARAH.',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();
    setSubmitting(true);
    try {
      await loginAdmin(email, password);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Gagal masuk ke meja redaksi.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-[#F8F8F7] flex flex-col justify-between">
      <div className="bg-[#0A0A0A] py-4 px-6 border-b border-neutral-800">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <Link to="/gatsuwewarah" aria-label="Kembali ke portal GATSU WEWARAH">
            <img
              src={logoHeaderImg}
              alt="GATSU WEWARAH"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link
            to="/gatsuwewarah"
            className="text-xs font-medium text-neutral-300 hover:text-white transition-colors"
          >
            Kembali ke Portal
          </Link>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-stone-300 p-7 sm:p-9">
          <div className="flex items-center gap-2.5 text-red-700 mb-3">
            <Lock className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest">
              Akses Terbatas Redaksi
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950 mb-2">
            Meja Redaksi GATSU WEWARAH
          </h1>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            Masuk menggunakan akun administrator resmi untuk mengelola berita, penulis, kategori, dan penayangan iklan.
          </p>

          {displayError && (
            <div
              role="alert"
              className="mb-5 p-3.5 bg-red-50 border border-red-200 text-xs text-red-800 font-medium leading-relaxed"
            >
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="gatsu-admin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5"
              >
                Email Redaksi
              </label>
              <input
                id="gatsu-admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-white focus:outline-none focus:border-neutral-950"
                placeholder="nama@redaksi.id"
              />
            </div>

            <div>
              <label
                htmlFor="gatsu-admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5"
              >
                Kata Sandi
              </label>
              <input
                id="gatsu-admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-white focus:outline-none focus:border-neutral-950"
                placeholder="Masukkan kata sandi"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-xs font-bold uppercase tracking-wider bg-neutral-950 text-white hover:bg-neutral-800 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Memverifikasi...' : 'Masuk Dashboard Redaksi'}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-5 text-center text-xs text-stone-500 border-t border-stone-200 bg-white">
        GATSU WEWARAH &middot; Sistem Manajemen Redaksi
      </footer>
    </div>
  );
};
