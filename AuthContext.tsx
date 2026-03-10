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

  // Consolidated Auth Initialization
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;
    let isMounted = true;

    const initializeAuth = async () => {
      console.log('[Auth] Initializing on custom domain...');
      
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('[Auth] Redirect sign-in success:', result.user.email);
        }
      } catch (error: any) {
        console.error('[Auth] Redirect error:', error);
        // Special handling for common Google/Email conflict
        if (error.code === 'auth/account-exists-with-different-credential') {
          // This will be caught by the component or we can set a global error state
          console.error('[Auth] Account exists with different credential. User should use email/password.');
        }
      }

      // 2. Set up the main session listener
      const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
        if (!isMounted) return;
        
        console.log('[Auth] onAuthStateChanged:', authUser?.uid || 'null');
        setFirebaseUser(authUser);

        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = undefined;
        }

        if (authUser) {
          setLoading(true);
          const userDocRef = doc(db, 'users', authUser.uid);
          unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (!isMounted) return;
            
            if (docSnap.exists()) {
              setUser({ id: authUser.uid, ...(docSnap.data() as Omit<User, 'id'>) });
            } else {
              console.warn('[Auth] Profile missing.');
              setUser(null);
            }
            setLoading(false);
          }, (err) => {
            console.error('[Auth] Snapshot error:', err);
            setLoading(false);
          });
        } else {
          setUser(null);
          setFirebaseUser(null);
          setLoading(false);
        }
      });

      return unsubscribeAuth;
    };

    const authPromise = initializeAuth();

    return () => {
      isMounted = false;
      authPromise.then(unsub => unsub?.());
      if (unsubscribeSnapshot) unsubscribeSnapshot();
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
    console.log('[Auth] Redirecting to Google...');
    try {
      const provider = new GoogleAuthProvider();
      await setPersistence(auth, browserLocalPersistence);
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error('[Auth] Google redirect trigger failed:', error);
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