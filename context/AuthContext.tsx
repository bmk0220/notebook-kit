"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

const ADMIN_EMAIL = "admin@notebookkit.com";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isPartner: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPartner, setIsPartner] = useState(false);

  // Central function to sync user data to Firestore
  const syncUserToFirestore = async (u: User) => {
    try {
      const userRef = doc(db, "users", u.uid);
      const userDoc = await getDoc(userRef);
      
      let role = u.email === ADMIN_EMAIL ? "admin" : "user";
      
      // If user doc exists, respect the existing role
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.role) role = data.role;
      }
      
      const userData: any = {
        email: u.email,
        role,
        lastLogin: serverTimestamp(),
      };

      // Only set createdAt if it doesn't exist yet
      if (!userDoc.exists()) {
        userData.createdAt = serverTimestamp();
      }

      await setDoc(userRef, userData, { merge: true });
      setIsPartner(role === "partner");
    } catch (err) {
      console.error("Firestore sync failed:", err);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      
      if (u) {
        syncUserToFirestore(u);
      } else {
        setIsPartner(false);
      }
    });
    return unsub;
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isPartner, loginWithEmail, signupWithEmail, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
