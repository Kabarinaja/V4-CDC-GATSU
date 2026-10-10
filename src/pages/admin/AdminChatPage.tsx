import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, onSnapshot, doc, addDoc, setDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ChatThread, ChatMessage } from '../../types';
import { formatDateIndo } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  MessageCircle,
  Send,
  User,
  MapPin,
  ExternalLink,
  Store,
  CheckCheck,
} from 'lucide-react';

export const AdminChatPage: React.FC = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const [searchParams] = useSearchParams();
  const targetUserParam = searchParams.get('userId');

  const { currentUser } = useAuth();
  const { showToast } = useNotification();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to all chat threads
  useEffect(() => {
    const q = query(collection(db, 'chats'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ChatThread[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ChatThread[];
        list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        setThreads(list);

        // Auto select thread if specified in query or if none selected yet
        if (targetUserParam) {
          setSelectedThreadId(targetUserParam);
        } else if (!selectedThreadId && list.length > 0) {
          setSelectedThreadId(list[0].id);
        }
      },
      (err) => {
        console.warn('Chat threads listener note:', err.message);
      }
    );

    return () => unsubscribe();
  }, [targetUserParam]);

  // Listen to messages of selected thread
  useEffect(() => {
    if (!selectedThreadId) return;

    const messagesRef = collection(db, 'chats', selectedThreadId, 'messages');
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
        console.warn('Chat messages note:', err.message);
      }
    );

    return () => unsubscribe();
  }, [selectedThreadId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadId || !replyText.trim()) return;

    setSending(true);
    try {
      const messagesRef = collection(db, 'chats', selectedThreadId, 'messages');
      const chatDocRef = doc(db, 'chats', selectedThreadId);

      await addDoc(messagesRef, {
        chatId: selectedThreadId,
        senderId: currentUser?.uid || 'admin',
        senderRole: 'admin',
        text: replyText.trim(),
        createdAt: serverTimestamp(),
      });

      await setDoc(
        chatDocRef,
        {
          lastMessage: replyText.trim(),
          lastMessageAt: serverTimestamp(),
          unreadByAdmin: 0,
          unreadByCustomer: 1,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setReplyText('');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim balasan.', 'error');
    } finally {
      setSending(false);
    }
  };

  const activeThread = threads.find((t) => t.id === selectedThreadId);

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Pusat Pesan Pelanggan</h1>
          <p className="text-xs text-stone-400">Balas pertanyaan pelanggan dan tinjau titik lokasi pengantaran</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden">
        {/* Left Side: Threads List */}
        <div className="md:col-span-4 bg-stone-950 border border-stone-800 rounded-3xl p-3 overflow-y-auto space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 px-2 py-1">
            Percakapan Masuk ({threads.length})
          </h3>

          {threads.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500">
              Belum ada percakapan dari pelanggan.
            </div>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedThreadId(t.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all border ${
                  selectedThreadId === t.id
                    ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-xs'
                    : 'bg-stone-900/60 border-stone-850 hover:bg-stone-900 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-white truncate">{t.customerName || 'Pelanggan CDC'}</h4>
                  {t.unreadByAdmin > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400 truncate mt-0.5">
                  WA: {t.customerWhatsapp || '-'}
                </p>
                <p className="text-[11px] text-stone-300 line-clamp-1 mt-1 font-medium">
                  {t.lastMessage || 'Memulai percakapan...'}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Right Side: Chat Room */}
        <div className="md:col-span-8 bg-stone-950 border border-stone-800 rounded-3xl flex flex-col overflow-hidden">
          {activeThread ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-4 border-b border-stone-850 bg-stone-900/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{activeThread.customerName}</h3>
                    <p className="text-[11px] text-stone-400 font-mono">
                      WhatsApp: <a href={`https://wa.me/62${activeThread.customerWhatsapp.replace(/^0/, '')}`} target="_blank" rel="noreferrer" className="text-amber-400 underline">{activeThread.customerWhatsapp}</a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-900/30">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-stone-500">Belum ada pesan.</div>
                ) : (
                  messages.map((m) => {
                    const isAdminMsg = m.senderRole === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-xs space-y-1.5 ${
                            isAdminMsg
                              ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-none'
                              : 'bg-stone-850 text-stone-100 border border-stone-750 rounded-tl-none'
                          }`}
                        >
                          {m.imageUrl && (
                            <a
                              href={m.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block overflow-hidden rounded-xl border border-black/10"
                            >
                              <img src={m.imageUrl} alt="Lampiran" className="max-h-48 w-full object-cover" />
                            </a>
                          )}

                          {m.location?.mapsUrl && (
                            <a
                              href={m.location.mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 rounded-xl bg-black/15 hover:bg-black/25 flex items-center gap-2 font-bold text-xs"
                            >
                              <MapPin className="w-4 h-4 shrink-0 text-rose-500" />
                              <div className="flex-1 truncate">
                                <span>Buka Titik Lokasi Pelanggan (Google Maps)</span>
                                <span className="text-[10px] opacity-80 block truncate">{m.location.address}</span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {m.text && <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>}

                          <div className="text-[10px] opacity-70 text-right">
                            {formatDateIndo(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendReply}
                className="p-3 border-t border-stone-850 bg-stone-900/60 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Ketik balasan untuk pelanggan..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-700 bg-stone-850 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 transition-colors shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-stone-500">
              Pilih percakapan di sebelah kiri untuk melihat pesan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
