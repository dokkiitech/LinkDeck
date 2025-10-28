import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  EmailAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  linkGuestToAccount: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // プロフィールの更新
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'サインアップに失敗しました');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'ログインに失敗しました');
    }
  };

  const signInAsGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error('Guest sign in error:', error);
      throw new Error(error.message || 'ゲストログインに失敗しました');
    }
  };

  const linkGuestToAccount = async (email: string, password: string, displayName: string) => {
    try {
      if (!user || !user.isAnonymous) {
        throw new Error('ゲストユーザーではありません');
      }

      const credential = EmailAuthProvider.credential(email, password);
      const userCredential = await linkWithCredential(user, credential);

      // プロフィールの更新
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (error: any) {
      console.error('Link guest to account error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('このメールアドレスは既に使用されています');
      }
      throw new Error(error.message || 'アカウントの作成に失敗しました');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'ログアウトに失敗しました');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInAsGuest, linkGuestToAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
