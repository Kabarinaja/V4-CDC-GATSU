import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Promotion } from '../../types';
import { Sparkles } from 'lucide-react';

const AUTO_SLIDE_MS = 5000;

export const PromoBanner: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const q = query(collection(db, 'promotions'), where('isActive', '==', true), orderBy('sortOrder', 'asc'));
        const snap = await getDocs(q);
        setPromotions(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Promotion[]);
      } catch (err) {
        console.warn('Note on promotions fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, []);

  useEffect(() => {
    if (promotions.length < 2) return;
    const timer = window.setInterval(() => {
      if (!pausedRef.current) setCurrentIndex((c) => (c + 1) % promotions.length);
    }, AUTO_SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [promotions.length]);

  if (loading || promotions.length === 0) return null;

  const move = (direction: 1 | -1) => {
    setCurrentIndex((c) => (c + direction + promotions.length) % promotions.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
    pausedRef.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    const end = e.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start == null || end == null) {
      pausedRef.current = false;
      return;
    }
    const delta = end - start;
    if (Math.abs(delta) > 45 && promotions.length > 1) move(delta < 0 ? 1 : -1);
    window.setTimeout(() => { pausedRef.current = false; }, 250);
  };

  const current = promotions[currentIndex];

  return (
    <section className="mb-5">
      <div className="mb-2.5 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <h2 className="text-xs font-black tracking-tight text-zinc-900">Promo & Pengumuman Spesial</h2>
        </div>
        {promotions.length > 1 && <span className="text-[9px] font-bold text-zinc-400">Geser · {currentIndex + 1}/{promotions.length}</span>}
      </div>

      <div
        className="relative overflow-hidden rounded-[22px] border border-zinc-200 bg-zinc-100 shadow-sm select-none touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={() => { pausedRef.current = true; }}
        onPointerUp={() => { window.setTimeout(() => { pausedRef.current = false; }, 250); }}
      >
        <div className="relative aspect-[210/297] w-full overflow-hidden bg-white">
          <img
            key={current.id}
            src={current.imageUrl}
            alt={current.title}
            className="h-full w-full object-contain object-center transition-opacity duration-300"
            draggable={false}
          />
        </div>

        {promotions.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1.5 backdrop-blur-sm">
            {promotions.map((_, idx) => (
              <button key={idx} type="button" onClick={() => setCurrentIndex(idx)} className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/70'}`} aria-label={`Promo ${idx + 1}`} />
            ))}
          </div>
        )}
      </div>
      <p className="mt-1.5 px-1 text-[9px] text-zinc-400">Poster ditampilkan utuh mengikuti rasio A4, tanpa crop.</p>
    </section>
  );
};
