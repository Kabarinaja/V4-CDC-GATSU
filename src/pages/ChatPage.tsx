import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ChatMessage } from '../types';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDateIndo } from '../lib/utils';
import { uploadToCloudinary } from '../lib/cloudinary';
import {
  Send,
  MapPin,
  Image as ImageIcon,
  MessageCircle,
  Receipt,
  User,
  CheckCheck,
  Store,
  ExternalLink,
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { profile, currentUser } = useAuth();
  const { showToast } = useNotification();
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get('orderId');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatId = currentUser?.uid;

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ChatMessage[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ChatMessage[];
        setMessages(list);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (err) => {
        console.warn('Chat snapshot note:', err.message);
      }
    );

    return () => unsubscribe();
  }, [chatId]);

  if (!currentUser || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <MessageCircle className="w-14 h-14 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-stone-900">Perlu Masuk Akun</h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          Silakan masuk ke akun member Anda untuk memulai obrolan langsung dengan kru outlet MY CDC GATSU.
        </p>
        <Link
          to="/login?redirect=/chat"
          className="inline-block py-2.5 px-6 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
        >
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  const handleSendMessage = async (
    customText?: string,
    locationData?: ChatMessage['location'],
    imageUrl?: string
  ) => {
    if (!chatId || !currentUser || !profile) return;
    const content = customText !== undefined ? customText : text;
    if (!content.trim() && !locationData && !imageUrl) return;

    setSending(true);
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const chatDocRef = doc(db, 'chats', chatId);

      const newMsg = {
        chatId,
        senderId: currentUser.uid,
        senderRole: 'customer',
        text: content.trim(),
        imageUrl: imageUrl || '',
        location: locationData || null,
        orderId: orderIdParam || '',
        createdAt: new Date().toISOString(),
      };

      await addDoc(messagesRef, {
        ...newMsg,
        createdAt: serverTimestamp(),
      });

      // Update parent chat thread
      await setDoc(
        chatDocRef,
        {
          id: chatId,
          userId: currentUser.uid,
          customerName: profile.name,
          customerWhatsapp: profile.whatsapp,
          lastMessage: content.trim() || (locationData ? '📍 Lokasi terkirim' : '📷 Gambar terkirim'),
          lastMessageAt: serverTimestamp(),
          unreadByAdmin: 1, // flag for crew
          unreadByCustomer: 0,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setText('');
    } catch (err) {
      showToast('Gagal mengirim pesan.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      showToast('Perangkat tidak mendukung deteksi lokasi GPS.', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        await handleSendMessage(
          `📍 Lokasi Saya untuk Pengantaran: ${mapsUrl}`,
          {
            lat: latitude,
            lng: longitude,
            mapsUrl,
            address: `Koordinat: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          }
        );

        setIsLocating(false);
        showToast('Titik lokasi berhasil dibagikan ke kasir outlet.', 'success', 'Lokasi Terkirim');
      },
      (err) => {
        setIsLocating(false);
        showToast('Izin akses lokasi ditolak atau tidak tersedia.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        showToast('Sedang mengunggah gambar...', 'info');
        const url = await uploadToCloudinary(file, 'payment-proofs');
        await handleSendMessage('📷 Lampiran foto', undefined, url);
        showToast('Foto terkirim.', 'success');
      } catch (err) {
        showToast('Gagal mengunggah gambar lampiran.', 'error');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-24 h-[calc(100vh-6rem)] flex flex-col">
      {/* Chat Header */}
      <div className="bg-white rounded-t-3xl border border-stone-200 p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-stone-900 leading-tight">
              Kru Kasir & Pengantaran MY CDC GATSU
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <p className="text-[11px] text-stone-500">Respon Cepat Saat Jam Operasional Outlet</p>
            </div>
          </div>
        </div>

        {orderIdParam && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-800 font-bold">
            <Receipt className="w-3.5 h-3.5" />
            <span>Terkait Pesanan: {orderIdParam.substring(0, 10)}...</span>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-stone-100 border-x border-stone-200 p-4 overflow-y-auto space-y-3">
        {orderIdParam && (
          <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span>Sedang membahas pesanan <strong>#{orderIdParam}</strong></span>
            <Link to={`/pesanan/${orderIdParam}`} className="font-bold underline text-amber-700">
              Lihat Detail
            </Link>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-stone-400">
            <MessageCircle className="w-12 h-12 text-stone-300" />
            <div>
              <p className="text-xs font-bold text-stone-700">Mulai Percakapan dengan Kasir</p>
              <p className="text-[11px] text-stone-500 max-w-xs mt-1">
                Tanyakan ketersediaan bagian ayam, konfirmasi alamat pengantaran, atau bagikan titik koordinat lokasi rumah Anda.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole === 'customer';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-md rounded-2xl p-3 text-xs shadow-xs space-y-1.5 ${
                    isMe
                      ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-none'
                      : 'bg-white text-stone-900 border border-stone-200 rounded-tl-none'
                  }`}
                >
                  {/* Image attachment */}
                  {msg.imageUrl && (
                    <a
                      href={msg.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl border border-black/10"
                    >
                      <img src={msg.imageUrl} alt="Lampiran" className="max-h-48 w-full object-cover" />
                    </a>
                  )}

                  {/* Location card */}
                  {msg.location?.mapsUrl && (
                    <a
                      href={msg.location.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-black/10 hover:bg-black/15 flex items-center gap-2 font-bold text-xs"
                    >
                      <MapPin className="w-4 h-4 shrink-0 text-rose-600" />
                      <div className="flex-1 truncate">
                        <span className="block text-[11px]">Buka Titik Lokasi di Maps</span>
                        <span className="text-[10px] opacity-80 truncate block">{msg.location.address}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Text */}
                  {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}

                  <div className="flex items-center justify-end gap-1 text-[10px] opacity-70 pt-0.5">
                    <span>{formatDateIndo(msg.createdAt)}</span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-stone-900" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <div className="bg-white rounded-b-3xl border border-stone-200 p-3 space-y-2 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Share location button */}
          <button
            type="button"
            onClick={handleSendLocation}
            disabled={isLocating || sending}
            className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors disabled:opacity-50"
            title="Kirim Titik Lokasi GPS Saya"
          >
            <MapPin className={`w-4 h-4 ${isLocating ? 'animate-bounce text-rose-500' : ''}`} />
          </button>

          {/* Photo attach button */}
          <label
            htmlFor="chat-img-input"
            className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            title="Kirim Foto"
          >
            <ImageIcon className="w-4 h-4" />
          </label>
          <input
            id="chat-img-input"
            type="file"
            accept="image/*"
            onChange={handleUploadImage}
            className="hidden"
          />

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ketik pesan untuk kasir..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={sending || (!text.trim())}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-stone-200 disabled:text-stone-400 text-stone-950 transition-colors shadow-xs"
            aria-label="Kirim Pesan"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
