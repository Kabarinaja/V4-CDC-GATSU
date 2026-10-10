import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Lock, Mail, ArrowRight, Store } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Mohon masukkan email dan kata sandi.', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      showToast('Selamat datang kembali di MY CDC GATSU!', 'success', 'Login Berhasil');
      navigate(redirect);
    } catch (err: any) {
      console.error(err);
      let msg = 'Email atau kata sandi tidak sesuai. Silakan periksa kembali.';
      if (err.code === 'auth/user-not-found') msg = 'Akun dengan email ini belum terdaftar.';
      if (err.code === 'auth/wrong-password') msg = 'Kata sandi salah. Silakan coba lagi.';
      showToast(msg, 'error', 'Gagal Masuk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-md">
        {/* Header with Logo */}
        <div className="text-center space-y-2">
          <img
            src="https://cdn.phototourl.com/member/2026-10-04-0358363c-e2cc-469e-8e79-0f841bfb3c3c.png"
            alt="Logo MY CDC GATSU"
            className="h-12 w-auto mx-auto object-contain"
          />
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Masuk Akun Member</h1>
          <p className="text-xs text-stone-500">
            Akses saldo poin, pesanan online, dan kartu loyalitas digital Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Email Terdaftar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Kata Sandi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Memproses...' : 'Masuk Akun Sekarang'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-stone-100 text-xs text-stone-600">
          Belum punya akun member?{' '}
          <Link to={`/register?redirect=${redirect}`} className="font-bold text-amber-600 hover:underline">
            Daftar Sekarang (Gratis)
          </Link>
        </div>
      </div>
    </div>
  );
};
