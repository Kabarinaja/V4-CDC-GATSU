import React, { useEffect, useRef, useState } from 'react';
import { Camera, Keyboard, QrCode, X, AlertCircle } from 'lucide-react';

interface MemberQrScannerProps {
  onMemberCode: (code: string) => void;
}

export const MemberQrScanner: React.FC<MemberQrScannerProps> = ({ onMemberCode }) => {
  const [open, setOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [status, setStatus] = useState('Siap memindai QR member.');
  const [cameraSupported, setCameraSupported] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);

  const stopCamera = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const close = () => {
    stopCamera();
    setOpen(false);
  };

  const handleDetected = (value: string) => {
    const code = value.trim();
    if (!code) return;
    stopCamera();
    setManualCode(code);
    onMemberCode(code);
    setStatus(`QR terbaca: ${code}`);
    setOpen(false);
  };

  const startCamera = async () => {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
      setCameraSupported(false);
      setStatus('Browser ini belum mendukung scanner QR kamera. Gunakan input Member ID di bawah.');
      return;
    }

    try {
      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      const formats = await BarcodeDetectorCtor.getSupportedFormats?.();
      if (Array.isArray(formats) && !formats.includes('qr_code')) {
        setCameraSupported(false);
        setStatus('Scanner QR tidak tersedia di browser ini. Gunakan input Member ID.');
        return;
      }

      detectorRef.current = new BarcodeDetectorCtor({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStatus('Arahkan kamera ke QR member.');

      const scan = async () => {
        if (!videoRef.current || !detectorRef.current || videoRef.current.readyState < 2) {
          animationRef.current = requestAnimationFrame(scan);
          return;
        }
        try {
          const results = await detectorRef.current.detect(videoRef.current);
          if (results?.length) {
            const value = results[0]?.rawValue || '';
            if (value) {
              handleDetected(value);
              return;
            }
          }
        } catch {
          // Keep scanning; transient camera frames can fail detection.
        }
        animationRef.current = requestAnimationFrame(scan);
      };

      animationRef.current = requestAnimationFrame(scan);
    } catch (error: any) {
      stopCamera();
      setStatus(error?.name === 'NotAllowedError'
        ? 'Izin kamera ditolak. Izinkan kamera atau gunakan input Member ID.'
        : 'Kamera tidak dapat dibuka. Gunakan input Member ID.');
    }
  };

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (open) {
      setCameraSupported(true);
      setStatus('Membuka kamera...');
      void startCamera();
    } else {
      stopCamera();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-colors shadow-sm flex items-center gap-2"
      >
        <QrCode className="w-4 h-4" />
        <span>Scan QR Member</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden text-white">
            <div className="p-5 border-b border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base flex items-center gap-2"><QrCode className="w-5 h-5 text-amber-400" /> Scan QR Member</h3>
                <p className="text-[11px] text-stone-400 mt-1">Scan QR dari kartu member pelanggan.</p>
              </div>
              <button type="button" onClick={close} className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white" aria-label="Tutup scanner">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-stone-800">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <div className="absolute inset-8 border-2 border-amber-400/90 rounded-3xl pointer-events-none" />
                <div className="absolute left-0 right-0 bottom-3 text-center text-[10px] text-white/80">Posisikan QR di dalam kotak</div>
              </div>

              <div className={`rounded-xl p-3 text-[11px] flex items-start gap-2 ${cameraSupported ? 'bg-stone-950 border border-stone-800 text-stone-300' : 'bg-amber-950/50 border border-amber-800/60 text-amber-200'}`}>
                {cameraSupported ? <Camera className="w-4 h-4 text-amber-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
                <span>{status}</span>
              </div>

              <div className="border-t border-stone-800 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-300"><Keyboard className="w-4 h-4 text-amber-400" /> Input manual jika kamera tidak tersedia</div>
                <div className="flex gap-2">
                  <input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Contoh: CDC-8F29A1"
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => manualCode.trim() && handleDetected(manualCode)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-black text-xs"
                  >Cari
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
