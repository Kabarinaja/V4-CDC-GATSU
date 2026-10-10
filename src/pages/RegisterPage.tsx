import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { User, Mail, Lock, Phone, ArrowRight, Award, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !whatsapp.trim()) {
      showToast('Semua kolom formulir pendaftaran wajib diisi.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Kata sandi minimal 6 karakter demi keamanan akun Anda.', 'error');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, whatsapp);
      showToast(
        'Akun member berhasil dibuat! Selamat bergabung di MY CDC GATSU.',
        'success',
        'Pendaftaran Sukses'
      );
      navigate(redirect);
    } catch (err: any) {
      console.error(err);
      let msg = 'Gagal mendaftarkan akun. Silakan coba lagi.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Email tersebut sudah terdaftar. Silakan login atau gunakan email lain.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Format alamat email tidak valid.';
      } else if (err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
        msg = 'Firebase menolak API key. Pastikan API key Web App untuk project mycdc-7035a benar dan pembatasan API key mengizinkan localhost.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Login Email/Password belum diaktifkan di Firebase Authentication. Aktifkan provider Email/Password di Firebase Console.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Tidak dapat terhubung ke Firebase. Periksa koneksi internet HP/Termux.';
      }
      showToast(msg, 'error', 'Pendaftaran Gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-14">
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-md">
        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src="https://cdn.phototourl.com/member/2026-10-04-0358363c-e2cc-469e-8e79-0f841bfb3c3c.png"
            alt="Logo MY CDC GATSU"
            className="h-12 w-auto mx-auto object-contain"
          />
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Daftar Member Baru</h1>
          <p className="text-xs text-stone-500">
            Dapatkan ID Member digital, kumpulkan poin loyalitas, dan pesan dengan mudah
          </p>
        </div>

        {/* Benefits banner */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900">
          <Award className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Langsung dapatkan <strong>Member ID resmi & QR code</strong> untuk transaksi online dan offline di outlet!
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Nama Lengkap *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Rian Anggara"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Nomor WhatsApp Aktif *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-stone-500">
              *Wajib diisi karena digunakan kasir outlet sebagai identitas pencarian akun member Anda.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Alamat Email *</label>
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
            <label className="text-xs font-bold text-stone-700">Kata Sandi Akun *</label>
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
            {loading ? 'Mendaftarkan Akun...' : 'Daftar Jadi Member Sekarang'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-stone-100 text-xs text-stone-600">
          Sudah punya akun member?{' '}
          <Link to={`/login?redirect=${redirect}`} className="font-bold text-amber-600 hover:underline">
            Masuk di Sini
          </Link>
        </div>
      </div>
    </div>
  );
};
