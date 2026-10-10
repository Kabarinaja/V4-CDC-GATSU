import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MemberCard } from '../components/member/MemberCard';
import { Link } from 'react-router-dom';
import { User, Phone, Mail, Award, Receipt, LogOut, CheckCircle2, Shield } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { profile, currentUser, logout, refreshProfile } = useAuth();
  const { showToast } = useNotification();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '');
  const [saving, setSaving] = useState(false);

  if (!currentUser || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">Perlu Masuk Akun</h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          Silakan masuk ke akun member MY CDC GATSU Anda untuk melihat dan mengubah profil.
        </p>
        <Link
          to="/login?redirect=/profil"
          className="inline-block py-2.5 px-6 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs shadow-md"
        >
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim()) {
      showToast('Nama dan nomor WhatsApp wajib diisi.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      showToast('Profil Anda berhasil diperbarui.', 'success', 'Tersimpan');
      setIsEditing(false);
    } catch (err) {
      showToast('Gagal memperbarui profil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Profil Member</h1>
          <p className="text-xs text-stone-500">Kelola identitas dan akses akun Anda</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>

      {/* Digital Member Card */}
      <MemberCard profile={profile} />

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/pesanan"
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-300 transition-all flex items-center gap-3 shadow-xs"
        >
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-900 block">Riwayat Pesanan</span>
            <span className="text-[10px] text-stone-500">Lacak pengantaran aktif</span>
          </div>
        </Link>

        <Link
          to="/poin"
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-300 transition-all flex items-center gap-3 shadow-xs"
        >
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-900 block">Riwayat Poin</span>
            <span className="text-[10px] text-stone-500">{profile.points} Poin tersimpan</span>
          </div>
        </Link>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h3 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider">
            Informasi Pribadi
          </h3>
          {!isEditing ? (
            <button
              onClick={() => {
                setName(profile.name);
                setWhatsapp(profile.whatsapp);
                setIsEditing(true);
              }}
              className="text-xs font-bold text-amber-600 hover:underline"
            >
              Ubah Profil
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs font-semibold text-stone-500 hover:underline"
            >
              Batal
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Nama Lengkap</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Nomor WhatsApp Aktif</label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="text-[11px] text-stone-500 block">
                Digunakan untuk pencarian akun member saat transaksi di outlet fisik.
              </span>
            </div>

            <div className="space-y-1.5 opacity-60">
              <label className="text-xs font-bold text-stone-700">Email Akun (Tidak dapat diubah)</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors shadow-sm"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-stone-50">
              <span className="text-stone-500">Nama Lengkap</span>
              <strong className="text-stone-900">{profile.name}</strong>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-50">
              <span className="text-stone-500">Nomor WhatsApp</span>
              <strong className="text-stone-900">{profile.whatsapp || '-'}</strong>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-50">
              <span className="text-stone-500">Email Akun</span>
              <strong className="text-stone-900">{profile.email}</strong>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-50">
              <span className="text-stone-500">Member ID</span>
              <strong className="text-amber-700 font-mono">{profile.memberId}</strong>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-stone-500">Status Keanggotaan</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                {profile.role === 'admin' ? 'Crew Admin' : 'Member Aktif'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
