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
import { doc, setDoc, serverTimestamp, getDoc, onSnapshot } from "firebase/firestore";

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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (!u) {
        setIsPartner(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Start listening to the user's document in Firestore for real-time role updates
      const userRef = doc(db, "users", u.uid);
      const unsubUser = onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const role = data.role;
          setIsPartner(role === "partner");
          setIsAdmin(role === "admin" || u.email === ADMIN_EMAIL);
        } else {
          // If doc doesn't exist, try to sync initial data
          syncUserToFirestore(u);
        }
        setLoading(false);
      });

      return () => unsubUser();
    });
    
    return () => unsubAuth();
  }, []);

  const syncUserToFirestore = async (u: User) => {
    try {
      const userRef = doc(db, "users", u.uid);
      const userDoc = await getDoc(userRef);
      
      const role = u.email === ADMIN_EMAIL ? "admin" : (userDoc.exists() ? userDoc.data()?.role : "user");
      
      const userData: any = {
        email: u.email,
        role: role || "user",
        lastLogin: serverTimestamp(),
      };

      if (!userDoc.exists()) {
        userData.createdAt = serverTimestamp();
      }

      await setDoc(userRef, userData, { merge: true });
    } catch (err) {
      console.error("Firestore sync failed:", err);
    }
  };

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
