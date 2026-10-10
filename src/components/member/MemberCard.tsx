import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UserProfile } from '../../types';
import { formatRupiah, pointsToRupiah } from '../../lib/utils';

interface MemberCardProps {
  profile: UserProfile;
  compact?: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({ profile, compact = false }) => {
  if (compact) {
    return (
      <div className="overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)]">
        <div className="flex items-center gap-3 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-600">Member aktif</p>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            </div>
            <p className="mt-1 truncate text-base font-black text-zinc-950">{profile.name}</p>
            <p className="mt-1 text-[10px] text-zinc-500">{profile.points} Poin · {formatRupiah(pointsToRupiah(profile.points))}</p>
          </div>
          <div className="shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 p-1.5">
            <QRCodeSVG value={profile.memberId} size={56} level="M" includeMargin={false} />
          </div>
          <span className="shrink-0 text-sm font-black text-zinc-300" aria-hidden="true">›</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950 text-white shadow-[0_18px_45px_rgba(24,24,27,0.18)]">
      <div className="relative p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black tracking-tight">MY CDC GATSU</p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-amber-400">Official Member</p>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-extrabold text-emerald-300">Aktif</span>
        </div>

        <div className="relative mt-7 grid grid-cols-[1fr_auto] items-center gap-4 sm:gap-8">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-500">Pemilik kartu</p>
            <h3 className="mt-1 truncate text-xl font-black tracking-tight sm:text-2xl">{profile.name}</h3>
            <p className="mt-3 text-[10px] font-mono font-bold tracking-widest text-zinc-300">{profile.memberId}</p>
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
              <div><p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Poin tersedia</p><div className="flex items-baseline gap-1.5"><strong className="text-xl font-black text-amber-300">{profile.points}</strong><span className="text-[9px] text-zinc-500">≈ {formatRupiah(pointsToRupiah(profile.points))}</span></div></div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-2.5 shadow-xl">
            <QRCodeSVG value={profile.memberId} size={102} level="H" includeMargin={false} />
            <p className="mt-2 text-center text-[8px] font-black uppercase tracking-wider text-zinc-500">Scan di kasir</p>
          </div>
        </div>
        <div className="mt-5 border-t border-white/10 pt-4 text-[9px] leading-relaxed text-zinc-500">Gunakan QR member saat transaksi di outlet atau gunakan poin sesuai ketentuan program.</div>
      </div>
    </div>
  );
};
