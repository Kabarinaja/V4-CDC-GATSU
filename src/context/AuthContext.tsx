import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, PRIMARY_ADMIN_UID } from '../lib/firebase';
import { UserProfile } from '../types';
import { generateMemberId } from '../lib/utils';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, whatsapp: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived admin verification
  const isAdmin = Boolean(
    currentUser && (currentUser.uid === PRIMARY_ADMIN_UID || profile?.role === 'admin')
  );

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const userRef = doc(db, 'users', user.uid);

        // Listen for real-time changes to profile (e.g. points update by admin, etc.)
        unsubscribeDoc = onSnapshot(
          userRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              // Auto-grant admin role in memory if UID matches primary admin
              const effectiveRole = user.uid === PRIMARY_ADMIN_UID ? 'admin' : (data.role || 'customer');
              setProfile({
                id: user.uid,
                name: data.name || user.displayName || 'Member CDC',
                email: user.email || data.email || '',
                whatsapp: data.whatsapp || '',
                memberId: data.memberId || 'CDC-000000',
                role: effectiveRole,
                points: Number(data.points) || 0,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
              });
            } else {
              // Document doesn't exist yet (e.g. primary admin logging in first time or special flow)
              const isPrimary = user.uid === PRIMARY_ADMIN_UID;
              const newProfile: UserProfile = {
                id: user.uid,
                name: user.displayName || (isPrimary ? 'Admin CDC Gatsu' : 'Pelanggan CDC'),
                email: user.email || '',
                whatsapp: isPrimary ? '082379474173' : '',
                memberId: generateMemberId(),
                role: isPrimary ? 'admin' : 'customer',
                points: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              try {
                await setDoc(userRef, {
                  ...newProfile,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
                setProfile(newProfile);
              } catch (err) {
                console.warn('Could not auto-create profile doc:', err);
                setProfile(newProfile);
              }
            }
            setLoading(false);
          },
          (err) => {
            console.warn('Profile snapshot listener note:', err.message);
            setLoading(false);
          }
        );
      } else {
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string, whatsapp: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const uid = cred.user.uid;
      const isPrimary = uid === PRIMARY_ADMIN_UID;
      const memberId = generateMemberId();

      const newUserData: UserProfile = {
        id: uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        memberId,
        role: isPrimary ? 'admin' : 'customer',
        points: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...newUserData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setProfile(newUserData);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setCurrentUser(null);
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          id: currentUser.uid,
          name: data.name,
          email: data.email,
          whatsapp: data.whatsapp,
          memberId: data.memberId,
          role: currentUser.uid === PRIMARY_ADMIN_UID ? 'admin' : data.role,
          points: Number(data.points) || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        });
      }
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        loading,
        isAdmin,
        login,
        register,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
