import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { User, Phone, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
}) => {
  const { currentUser, profile, completeProfile } = useAuth();
  const { showToast } = useNotification();

  const [name, setName] = useState(currentUser?.displayName || profile?.name || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Silakan masukkan nama lengkap Anda.', 'error');
      return;
    }

    const cleanWa = whatsapp.replace(/[\s-]/g, '');
    if (!cleanWa || cleanWa.length < 9) {
      showToast('Nomor WhatsApp tidak valid (minimal 10 digit).', 'error');
      return;
    }

    if (!cleanWa.startsWith('08') && !cleanWa.startsWith('628') && !cleanWa.startsWith('+62')) {
      showToast('Format WhatsApp Indonesia harus dimulai dengan 08 atau 628.', 'error');
      return;
    }

    // Normalize to standard 08xxx format
    const normalizedWa = cleanWa.startsWith('+62')
      ? '0' + cleanWa.slice(3)
      : cleanWa.startsWith('62')
      ? '0' + cleanWa.slice(2)
      : cleanWa;

    setLoading(true);
    try {
      await completeProfile(name.trim(), normalizedWa);
      showToast('Profil Anda berhasil diperbarui!', 'success', 'Selamat Datang');
      onSuccess();
    } catch (err: any) {
      console.error('Error completing profile:', err);
      showToast('Gagal menyimpan profil: ' + (err.message || 'Terjadi kesalahan sistem'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="text-center space-y-1.5">
          <div className="inline-flex p-3 rounded-2xl bg-amber-100 text-amber-600 mb-1">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight">
            Lengkapi Profil Member
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Satu langkah lagi! Mohon lengkapi nama dan nomor WhatsApp aktif Anda untuk keperluan konfirmasi pesanan & kartu loyalitas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Readonly Google Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-500">Email Akun Google (Terkunci)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                disabled
                value={currentUser.email || ''}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-xs font-semibold text-stone-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700">Nama Lengkap *</label>
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
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* WhatsApp Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700">
              Nomor WhatsApp Aktif *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Contoh: 0821xxxxxxx"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-stone-400">
              Digunakan kurir untuk update status pesanan delivery outlet & kasir.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 text-xs font-black transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
