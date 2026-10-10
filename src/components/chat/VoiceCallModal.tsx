import React, { useState, useEffect, useRef } from 'react';
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  collection,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CallSession, CallStatus } from '../../types';
import { rtcConfiguration, audioConstraints, formatCallDuration } from '../../lib/webrtc';
import { useNotification } from '../../context/NotificationContext';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  Mic,
  MicOff,
  Volume2,
  AlertCircle,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface VoiceCallModalProps {
  chatId: string;
  orderId?: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'admin' | 'customer';
  targetUserId: string;
  targetUserName: string;
  activeCallId?: string | null;
  isIncomingCall?: boolean;
  onClose: () => void;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  chatId,
  orderId,
  currentUserId,
  currentUserName,
  currentUserRole,
  targetUserId,
  targetUserName,
  activeCallId,
  isIncomingCall = false,
  onClose,
}) => {
  const { showToast } = useNotification();

  const [callStatus, setCallStatus] = useState<CallStatus>(isIncomingCall ? 'ringing' : 'calling');
  const [callId, setCallId] = useState<string>(
    activeCallId || `call_${chatId}_${Date.now()}`
  );
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneTimeoutRef = useRef<any>(null);
  const durationIntervalRef = useRef<any>(null);

  // 1. Initialize Peer Connection
  const createPeerConnection = () => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(rtcConfiguration);
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch((e) => console.warn('Audio play note:', e));
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setCallStatus('failed');
        setErrorMessage('Koneksi suara terputus. Jaringan mungkin memerlukan server TURN.');
      }
    };

    return pc;
  };

  // 2. Request Local Microphone (Audio Only)
  const getLocalAudioStream = async (): Promise<MediaStream> => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      localStreamRef.current = stream;
      return stream;
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      let msg = 'Gagal mengakses mikrofon.';
      if (err.name === 'NotAllowedError') {
        msg = 'Izin mikrofon ditolak oleh browser. Silakan izinkan akses mikrofon.';
      } else if (err.name === 'NotFoundError') {
        msg = 'Perangkat mikrofon tidak ditemukan di sistem Anda.';
      }
      setErrorMessage(msg);
      setCallStatus('failed');
      throw err;
    }
  };

  // 3. Outgoing Call Setup (Caller)
  const startCall = async () => {
    try {
      const stream = await getLocalAudioStream();
      const pc = createPeerConnection();

      // Add local audio tracks to peer connection
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate && callId) {
          const callDoc = doc(db, 'calls', callId);
          await updateDoc(callDoc, {
            callerCandidates: arrayUnion(event.candidate.toJSON()),
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        }
      };

      // Create Offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);

      // Create Call Document in Firestore
      const callDoc = doc(db, 'calls', callId);
      await setDoc(callDoc, {
        id: callId,
        chatId,
        callerId: currentUserId,
        callerName: currentUserName,
        callerRole: currentUserRole,
        calleeId: targetUserId,
        calleeName: targetUserName,
        orderId: orderId || null,
        status: 'calling',
        offer: { type: offer.type, sdp: offer.sdp },
        callerCandidates: [],
        calleeCandidates: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Unanswered timeout (45 seconds)
      ringtoneTimeoutRef.current = setTimeout(async () => {
        if (callStatus === 'calling' || callStatus === 'ringing') {
          await updateDoc(doc(db, 'calls', callId), {
            status: 'unanswered',
            updatedAt: serverTimestamp(),
          }).catch(() => {});
          setCallStatus('unanswered');
        }
      }, 45000);
    } catch (err) {
      console.error('Error starting call:', err);
    }
  };

  // 4. Accept Incoming Call (Callee)
  const acceptCall = async () => {
    try {
      const stream = await getLocalAudioStream();
      const pc = createPeerConnection();

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = async (event) => {
        if (event.candidate && callId) {
          const callDoc = doc(db, 'calls', callId);
          await updateDoc(callDoc, {
            calleeCandidates: arrayUnion(event.candidate.toJSON()),
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        }
      };

      // Set status in Firestore to connected
      const callDoc = doc(db, 'calls', callId);
      await updateDoc(callDoc, {
        status: 'connected',
        connectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCallStatus('connected');
    } catch (err) {
      console.error('Error accepting call:', err);
    }
  };

  // 5. Reject Incoming Call
  const rejectCall = async () => {
    try {
      if (callId) {
        await updateDoc(doc(db, 'calls', callId), {
          status: 'rejected',
          endedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
      setCallStatus('rejected');
      setTimeout(cleanupAndClose, 1000);
    } catch (e) {
      cleanupAndClose();
    }
  };

  // 6. End Active Call
  const endCall = async () => {
    try {
      if (callId) {
        await updateDoc(doc(db, 'calls', callId), {
          status: 'ended',
          endedAt: serverTimestamp(),
          durationSeconds: duration,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
      setCallStatus('ended');
      setTimeout(cleanupAndClose, 1000);
    } catch (e) {
      cleanupAndClose();
    }
  };

  // 7. Cleanup Resources
  const cleanupAndClose = () => {
    if (ringtoneTimeoutRef.current) clearTimeout(ringtoneTimeoutRef.current);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    onClose();
  };

  // 8. Duration timer during connected call
  useEffect(() => {
    if (callStatus === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [callStatus]);

  // 9. Firestore Call Signaling Listener
  useEffect(() => {
    if (!callId) return;

    if (!isIncomingCall) {
      startCall();
    }

    const callDocRef = doc(db, 'calls', callId);
    const unsubscribe = onSnapshot(callDocRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();

      // Remote status updates
      if (data.status && data.status !== callStatus) {
        setCallStatus(data.status);
        if (data.status === 'ended' || data.status === 'rejected' || data.status === 'unanswered') {
          setTimeout(cleanupAndClose, 1500);
        }
      }

      const pc = pcRef.current;
      if (!pc) return;

      // Handle Answer received by Caller
      if (!isIncomingCall && data.answer && !pc.currentRemoteDescription) {
        const answerDesc = new RTCSessionDescription(data.answer);
        await pc.setRemoteDescription(answerDesc);
      }

      // Handle Offer received by Callee
      if (isIncomingCall && data.offer && !pc.currentRemoteDescription) {
        const offerDesc = new RTCSessionDescription(data.offer);
        await pc.setRemoteDescription(offerDesc);

        // If callee has accepted, create answer
        if (callStatus === 'connected' && !data.answer) {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await updateDoc(callDocRef, {
            answer: { type: answer.type, sdp: answer.sdp },
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Handle remote ICE candidates
      const remoteCandidates = isIncomingCall ? data.callerCandidates : data.calleeCandidates;
      if (remoteCandidates && Array.isArray(remoteCandidates)) {
        for (const candidateData of remoteCandidates) {
          if (candidateData) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidateData));
            } catch (e) {
              // Ignore duplicate candidates
            }
          }
        }
      }
    });

    return () => {
      unsubscribe();
      if (ringtoneTimeoutRef.current) clearTimeout(ringtoneTimeoutRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [callId]);

  // Toggle Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      {/* Hidden Audio element for remote audio stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-800 p-6 text-white text-center space-y-6 shadow-2xl relative">
        <button
          onClick={cleanupAndClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Avatar & Call Status Pulse */}
        <div className="space-y-3 pt-2">
          <div className="relative inline-block">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-2xl font-black ${
                callStatus === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-400 ring-4 ring-emerald-500/30'
                  : callStatus === 'ringing' || callStatus === 'calling'
                  ? 'bg-amber-500/20 text-amber-400 ring-4 ring-amber-500/30 animate-pulse'
                  : 'bg-stone-800 text-stone-400'
              }`}
            >
              {targetUserName.charAt(0).toUpperCase()}
            </div>
            {callStatus === 'connected' && (
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-stone-900" />
            )}
          </div>

          <div>
            <h3 className="text-base font-black tracking-tight text-white">{targetUserName}</h3>
            <p className="text-xs text-amber-400 font-semibold mt-0.5">
              {currentUserRole === 'admin' ? 'Pelanggan Delivery' : 'Kru Outlet CDC Gatsu'}
            </p>
          </div>
        </div>

        {/* Dynamic Status Display */}
        <div className="py-2 px-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
          {callStatus === 'calling' && (
            <p className="text-xs text-stone-300 font-bold flex items-center justify-center gap-2">
              <PhoneCall className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>Memanggil... Menunggu jawaban</span>
            </p>
          )}

          {callStatus === 'ringing' && (
            <p className="text-xs text-amber-400 font-bold flex items-center justify-center gap-2 animate-pulse">
              <PhoneIncoming className="w-4 h-4" />
              <span>Panggilan Suara Masuk...</span>
            </p>
          )}

          {callStatus === 'connected' && (
            <div className="space-y-1">
              <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Tersambung (Audio WebRTC)</span>
              </p>
              <p className="font-mono text-sm font-black text-white">
                {formatCallDuration(duration)}
              </p>
            </div>
          )}

          {callStatus === 'ended' && (
            <p className="text-xs text-stone-400 font-bold">Panggilan Berakhir ({formatCallDuration(duration)})</p>
          )}

          {callStatus === 'rejected' && (
            <p className="text-xs text-rose-400 font-bold">Panggilan Ditolak</p>
          )}

          {callStatus === 'unanswered' && (
            <p className="text-xs text-stone-400 font-bold">Tidak Dijawab</p>
          )}

          {callStatus === 'failed' && (
            <p className="text-xs text-rose-400 font-bold flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMessage || 'Koneksi Panggilan Gagal'}</span>
            </p>
          )}
        </div>

        {/* Microphone Active Indicator */}
        {callStatus === 'connected' && (
          <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400">
            <span className={`w-2 h-2 rounded-full ${isMuted ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span>{isMuted ? 'Mikrofon Dibisukan (Muted)' : 'Mikrofon Sedang Aktif'}</span>
          </div>
        )}

        {/* Action Buttons based on Status */}
        <div className="pt-2 flex items-center justify-center gap-4">
          {/* Incoming Call: Accept / Reject */}
          {callStatus === 'ringing' && isIncomingCall && (
            <>
              <button
                type="button"
                onClick={rejectCall}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                title="Tolak Panggilan"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={acceptCall}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-stone-950 flex items-center justify-center shadow-lg transition-transform active:scale-95 animate-bounce"
                title="Terima Panggilan"
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Outgoing Call in Progress: Mute & End */}
          {(callStatus === 'calling' || callStatus === 'connected') && (
            <>
              {callStatus === 'connected' && (
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                    isMuted
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
                  }`}
                  title={isMuted ? 'Nyalakan Mic' : 'Bisukan Mic'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}

              <button
                type="button"
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                title="Akhiri Panggilan"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Ended / Rejected / Failed: Close */}
          {(callStatus === 'ended' ||
            callStatus === 'rejected' ||
            callStatus === 'failed' ||
            callStatus === 'unanswered') && (
            <button
              type="button"
              onClick={cleanupAndClose}
              className="px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-bold"
            >
              Tutup Jendela
            </button>
          )}
        </div>

        {/* Security / Privacy notice */}
        <p className="text-[10px] text-stone-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Enkripsi P2P WebRTC audio-only. Tidak direkam.</span>
        </p>
      </div>
    </div>
  );
};
