import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

export const AdminEntryPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { currentUser, isAdmin, login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // If already logged in and verified admin, forward straight to /admin
  useEffect(() => {
    if (currentUser && isAdmin) {
      navigate('/admin');
    }
  }, [currentUser, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Kredensial crew wajib diisi lengkap.', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      showToast('Otentikasi kru berhasil.', 'success', 'Akses Diberikan');
      // Navigation handled by effect or timeout
      setTimeout(() => {
        navigate('/admin');
      }, 300);
    } catch (err: any) {
      console.error(err);
      showToast('Akses ditolak. Email atau kata sandi kru tidak valid.', 'error', 'Gagal Masuk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-stone-100">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Portal Khusus Kru Outlet</h1>
          <p className="text-xs text-stone-400 leading-relaxed">
            Pintu masuk operasional kasir & manajemen pesanan MY CDC GATSU.
          </p>
        </div>

        {currentUser && !isAdmin && (
          <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Akses Admin Ditolak</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Akun yang sedang masuk ({currentUser.email}) tidak memiliki hak akses administrator.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300">Email Kru / Kasir</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="crew@dicelupayamcrispy.store"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-850 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-stone-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300">Kata Sandi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-850 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-stone-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black text-xs transition-colors shadow-md flex items-center justify-center gap-2"
          >
            {loading ? 'Memverifikasi Akses...' : 'Masuk ke Dashboard Kru'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-[11px] text-stone-500 border-t border-stone-800/80 pt-4">
          Sistem Keamanan Terenkripsi Firebase Auth & Firestore Rules (mycdc-7035a)
        </div>
      </div>
    </div>
  );
};
