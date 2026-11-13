import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { GATSU_ADMIN_UID, gatsuAuth } from '../lib/firebase';

interface GatsuAuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
  clearAuthError: () => void;
}

const GatsuAuthContext = createContext<GatsuAuthContextValue | null>(null);

export const GatsuAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(gatsuAuth, async (currentUser) => {
      if (currentUser && currentUser.uid !== GATSU_ADMIN_UID) {
        await signOut(gatsuAuth).catch(() => {});
        setUser(null);
        setAuthError(
          'Akun ini tidak memiliki hak akses redaksi GATSU WEWARAH.'
        );
        setLoading(false);
        return;
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAdmin = async (email: string, password: string) => {
    setAuthError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      const msg = 'Email dan kata sandi wajib diisi.';
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
      const credential = await signInWithEmailAndPassword(
        gatsuAuth,
        trimmedEmail,
        password
      );
      if (credential.user.uid !== GATSU_ADMIN_UID) {
        await signOut(gatsuAuth);
        const msg =
          'Akses ditolak. Hanya UID administrator resmi yang diizinkan masuk.';
        setAuthError(msg);
        throw new Error(msg);
      }
      setUser(credential.user);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.includes('auth/invalid-credential') ||
            error.message.includes('auth/wrong-password') ||
            error.message.includes('auth/user-not-found')
            ? 'Email atau kata sandi admin tidak valid.'
            : error.message
          : 'Gagal masuk ke dashboard redaksi.';
      setAuthError(message);
      throw new Error(message);
    }
  };

  const logoutAdmin = async () => {
    await signOut(gatsuAuth);
    setUser(null);
  };

  const isAdmin = Boolean(user && user.uid === GATSU_ADMIN_UID);

  return (
    <GatsuAuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        authError,
        loginAdmin,
        logoutAdmin,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </GatsuAuthContext.Provider>
  );
};

export function useGatsuAuth(): GatsuAuthContextValue {
  const ctx = useContext(GatsuAuthContext);
  if (!ctx) {
    throw new Error('useGatsuAuth must be used within GatsuAuthProvider');
  }
  return ctx;
}
