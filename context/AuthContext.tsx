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
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const ADMIN_EMAIL = "admin@notebookkit.com";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const loginWithEmail = async (email: string, password: string) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    if (res.user) {
      try {
        await setDoc(doc(db, "users", res.user.uid), {
          email: res.user.email,
          role: res.user.email === ADMIN_EMAIL ? "admin" : "user",
          lastLogin: serverTimestamp(),
        }, { merge: true });
        console.log("User document updated in Firestore (login)");
      } catch (err) {
        console.error("Error updating user document in Firestore:", err);
      }
    }
  };

  const signupWithEmail = async (email: string, password: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (res.user) {
      try {
        await setDoc(doc(db, "users", res.user.uid), {
          email: res.user.email,
          role: res.user.email === ADMIN_EMAIL ? "admin" : "user",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        }, { merge: true });
        console.log("User document created in Firestore (signup)");
      } catch (err) {
        console.error("Error creating user document in Firestore:", err);
      }
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    if (res.user) {
      try {
        // Use setDoc with merge: true to avoid overwriting existing data if they log in again
        await setDoc(doc(db, "users", res.user.uid), {
          email: res.user.email,
          role: res.user.email === ADMIN_EMAIL ? "admin" : "user",
          lastLogin: serverTimestamp(),
        }, { merge: true });
        console.log("User document updated in Firestore (google login)");
      } catch (err) {
        console.error("Error updating user document in Firestore (google):", err);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, loginWithEmail, signupWithEmail, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
