'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

type UserRole = 'user' | 'admin' | 'superadmin';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setUserRole(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Separate effect to listen to user role changes in Firestore
  useEffect(() => {
    if (!user) return;

    // Real-time listener for user role
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const role = (userData.role as UserRole) || 'user';
          setUserRole(role);
          console.log('🔄 User role updated:', role);
        } else {
          setUserRole('user');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to user role:', error);
        setUserRole('user');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);


