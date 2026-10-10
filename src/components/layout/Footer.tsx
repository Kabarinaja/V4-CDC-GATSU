import React from 'react';
import { MapPin, MessageSquare } from 'lucide-react';

export const Footer: React.FC = () => {
  const MAPS_URL = "https://maps.app.goo.gl/pPDPnQA9NaJwpdbn9?g_st=ac&utm_source=chatgpt.com";
  const WA_URL = "https://wa.me/6282379474173";

  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-24 md:pb-12 border-t border-stone-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-stone-800">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.phototourl.com/member/2026-10-04-0358363c-e2cc-469e-8e79-0f841bfb3c3c.png"
                alt="Logo MY CDC GATSU"
                className="h-10 w-auto object-contain brightness-110"
              />
              <div>
                <h3 className="text-white font-extrabold text-lg tracking-tight">DICELUP AYAM CRISPY</h3>
                <p className="text-xs text-amber-500 font-semibold tracking-wider uppercase">Dicelup Ayam Crispy</p>
              </div>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              Pemesanan online, program member, dan layanan delivery resmi DICELUP AYAM CRISPY.
            </p>
          </div>

          {/* Quick Contacts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Kontak Outlet</h4>
            <div className="space-y-2 text-xs">
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Admin"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#16a34a] transition hover:bg-[#25D366]/20"
              >
                <svg viewBox="0 0 32 32" aria-hidden="true" className="h-6 w-6" fill="currentColor">
                  <path d="M16 3.2a12.7 12.7 0 0 0-10.9 19l-1.3 4.8 4.9-1.3A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.4 10.4 0 0 1-5.3-1.4l-.4-.2-2.9.8.8-2.8-.3-.5A10.4 10.4 0 1 1 16 26.4Zm5.7-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.9-1-3.1-1.7-4.3-3.8-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5 0-.2-.7-1.7-1-2.2-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.4 4.8 2 .9 2.8 1 3.8.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.3-.3-.4-.5-.5Z"/>
                </svg>
              </a>
              <div className="flex items-center gap-2.5 text-stone-400">
                <div className="p-1.5 rounded-lg bg-stone-800 text-amber-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span>Tersedia fitur Chat Outlet langsung di aplikasi</span>
              </div>
            </div>
          </div>

          {/* Location Button */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Kunjungi Outlet Kami</h4>
            <p className="text-xs text-stone-400">
              Nikmati ayam crispy renyah hangat langsung di tempat atau pesan delivery melalui website.
            </p>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-md group"
            >
              <MapPin className="w-4 h-4 text-stone-950 group-hover:scale-110 transition-transform" />
              <span>Lokasi Kami (Buka Google Maps)</span>
            </a>
          </div>
        </div>

        {/* Copyright notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <p>© 2026 MY CDC GATSU. Hak Cipta Dilindungi.</p>
          <p className="text-[11px] text-stone-500">
            Domain Resmi: <span className="text-stone-400 font-mono">dicelupayamcrispy.store</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
