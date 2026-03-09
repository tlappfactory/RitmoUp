import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from './types';
import { auth, db } from './lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithCredential,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  completeGoogleLogin: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Set Auth Persistence to Local (survives browser restarts)
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('[Auth] ✓ Persistence set to browserLocalPersistence');
      })
      .catch((error) => {
        console.error('[Auth] ✗ Could not set persistence:', error);
      });
  }, []);

  // Handle Google Redirect Result with detailed logging
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log('[Auth] Checking for redirect result...');
        const result = await getRedirectResult(auth);

        if (result?.user) {
          console.log('[Auth] ✓ Redirect successful for user:', result.user.uid);
          console.log('[Auth] User email:', result.user.email);
        } else {
          console.log('[Auth] No redirect result found (normal on initial load)');
        }
      } catch (error: any) {
        console.error('[Auth] ✗ Redirect error:', error);
        console.error('[Auth] Error code:', error.code);
        console.error('[Auth] Error message:', error.message);
      }
    };
    handleRedirect();
  }, []);

  // onAuthStateChanged will detect the user, and if no profile exists, 'user' state will remain null while 'firebaseUser' is set.

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setFirebaseUser(authUser);

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = undefined;
      }

      if (authUser) {
        setLoading(true); // Ensure loading is true while we fetch the profile
        const userDocRef = doc(db, 'users', authUser.uid);
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as Omit<User, 'id'>;
            setUser({
              id: authUser.uid,
              ...userData
            });
          } else {
            // User authenticated but no profile yet (New Google User)
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error fetching user profile:', error);
          setUser(null);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    // Ensure persistence is set before creating session
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fUser = userCredential.user;

    const newUser: User = {
      id: fUser.uid,
      name,
      email,
      role,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      createdAt: new Date()
    };

    const { id, ...userData } = newUser;
    await setDoc(doc(db, 'users', fUser.uid), {
      ...userData,
      createdAt: new Date()
    });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const loginWithGoogle = async () => {
    console.log('[Auth] Google login initiated (Web Only)');

    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error('[Auth] ✗ Login error:', error);
      console.error('[Auth] Error code:', error.code);
      console.error('[Auth] Error message:', error.message);
      throw error;
    }
  };

  const completeGoogleLogin = async (role: UserRole) => {
    if (!firebaseUser) throw new Error("No authenticated user found");

    const newUser: User = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Usuário Google',
      email: firebaseUser.email || '',
      role: role,
      avatarUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'U')}&background=random`,
      createdAt: new Date()
    };

    const { id, ...userData } = newUser;
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...userData,
      createdAt: new Date()
    });
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, register, logout, resetPassword, loginWithGoogle, completeGoogleLogin }}>
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