import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, ArrowUpRight } from 'lucide-react';

const WA_URL = 'https://wa.me/6282379474173';

const WhatsAppMark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
    <path d="M16 3.2a12.7 12.7 0 0 0-10.9 19l-1.3 4.8 4.9-1.3A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.4 10.4 0 0 1-5.3-1.4l-.4-.2-2.9.8.8-2.8-.3-.5A10.4 10.4 0 1 1 16 26.4Zm5.7-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.9-1-3.1-1.7-4.3-3.8-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5 0-.2-.7-1.7-1-2.2-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.4 4.8 2 .9 2.8 1 3.8.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.3-.3-.4-.5-.5Z"/>
  </svg>
);

export const FloatingChat: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:right-6 md:bottom-6 z-[70]">
      {open && (
        <div className="mb-3 w-[min(330px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_18px_55px_rgba(24,24,27,0.18)]">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#25D366]/10 text-[#16a34a]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-zinc-950">Chat Admin</p>
                <p className="text-[11px] text-zinc-500">Respon saat jam operasional</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100" aria-label="Tutup chat">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3">
            <Link to="/chat" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 hover:bg-zinc-100">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700"><MessageCircle className="h-4 w-4" /></div>
                <div>
                  <p className="text-xs font-extrabold text-zinc-900">Chat di aplikasi</p>
                  <p className="text-[10px] text-zinc-500">Kirim pesan, lokasi, atau bukti</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400" />
            </Link>

            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="mt-2.5 flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-4 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-[#20bd5a]">
              <WhatsAppMark className="h-5 w-5" />
              <span>Hubungi via WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Tutup chat admin' : 'Buka chat admin'}
        className={`ml-auto grid place-items-center rounded-full shadow-[0_10px_30px_rgba(24,24,27,0.2)] transition-all duration-200 ${open ? 'h-11 w-11 bg-zinc-900 text-white' : 'h-14 w-14 bg-[#25D366] text-white hover:scale-105'}`}
      >
        {open ? <X className="h-5 w-5" /> : <WhatsAppMark className="h-7 w-7" />}
      </button>
    </div>
  );
};
