import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Mail, ArrowRight, X, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
}) => {
  const { resetPassword } = useAuth();
  const { showToast } = useNotification();

  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isOpen) return null;

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Masukkan alamat email terdaftar.', 'error');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSentSuccess(true);
      setCountdown(60);
      showToast('Link reset kata sandi telah dikirim ke email Anda!', 'success', 'Cek Email');
    } catch (err: any) {
      console.error(err);
      let msg = 'Gagal mengirim email reset kata sandi.';
      if (err.code === 'auth/user-not-found') {
        msg = 'Email tersebut belum terdaftar di sistem MY CDC GATSU.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Format email tidak valid.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Terlalu banyak permintaan reset. Silakan tunggu beberapa saat.';
      }
      showToast(msg, 'error', 'Reset Gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex p-3 rounded-2xl bg-amber-100 text-amber-600 mb-1">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight">
            Reset Kata Sandi
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Masukkan email akun member Anda. Kami akan mengirimkan tautan resmi dari Firebase Authentication untuk mengatur ulang kata sandi Anda secara aman.
          </p>
        </div>

        {sentSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Email Berhasil Dikirim ke {email}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-700">
              Silakan periksa kotak masuk (Inbox) atau folder <strong>Spam</strong> Anda. Klik tautan verifikasi di email untuk membuat kata sandi baru.
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-emerald-200">
              {countdown > 0 ? (
                <span className="text-[11px] text-stone-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" /> Kirim ulang dalam {countdown}d
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={loading}
                  className="text-xs font-bold text-amber-600 hover:underline"
                >
                  Kirim Ulang Email
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700">Alamat Email Terdaftar *</label>
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-2 text-[11px] text-stone-600">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Demi keamanan akun, sistem Firebase tidak akan menampilkan data kata sandi lama Anda. Link reset hanya berlaku selama 60 menit.
              </span>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 text-xs font-black transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
