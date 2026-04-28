"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Download, ShoppingCart, Loader2, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

interface PurchaseControlProps {
  kitId: string;
  kitSlug: string;
  price: number;
  fileUrl: string;
}

export default function PurchaseControl({ kitId, kitSlug, price, fileUrl }: PurchaseControlProps) {
  const { user, loading: authLoading } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function checkOwnership() {
      if (!user) {
        setIsOwner(false);
        setCheckingOwnership(false);
        return;
      }

      try {
        const q = query(
          collection(db, "user_kits"),
          where("userId", "==", user.uid),
          where("kitId", "==", kitId)
        );
        const snapshot = await getDocs(q);
        setIsOwner(!snapshot.empty);
      } catch (err) {
        console.error("Error checking ownership:", err);
      } finally {
        setCheckingOwnership(false);
      }
    }

    if (!authLoading) {
      checkOwnership();
    }
  }, [user, authLoading, kitId]);

  const handleUnlock = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setProcessing(true);
    try {
      // Logic for "Free" or "Simulated Purchase"
      // In a real app, this would happen after Stripe success
      await addDoc(collection(db, "user_kits"), {
        userId: user.uid,
        kitId: kitId,
        slug: kitSlug,
        status: "owned",
        unlockedAt: serverTimestamp(),
      });
      setIsOwner(true);
    } catch (err) {
      console.error("Unlock error:", err);
      alert("Failed to unlock kit. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || checkingOwnership) {
    return (
      <div className="w-full h-14 bg-muted animate-pulse rounded-2xl flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest px-1">
          <CheckCircle2 className="h-4 w-4" />
          <span>You own this kit</span>
        </div>
        <a 
          href={fileUrl} 
          download
          className="w-full h-14 bg-primary text-primary-foreground font-black rounded-2xl hover:opacity-90 flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <Download className="h-5 w-5" />
          DOWNLOAD KIT
        </a>
      </div>
    );
  }

  return (
    <button 
      onClick={handleUnlock}
      disabled={processing}
      className="w-full h-14 bg-foreground text-background font-black rounded-2xl hover:opacity-90 flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50"
    >
      {processing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          {price === 0 ? "UNLOCK FOR FREE" : `BUY NOW — $${price}`}
        </>
      )}
    </button>
  );
}
