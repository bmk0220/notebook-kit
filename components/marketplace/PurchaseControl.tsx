"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Download, ShoppingCart, Loader2, CheckCircle2, CreditCard, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { cn } from "@/lib/utils";

interface PurchaseControlProps {
  kitId: string;
  kitTitle: string;
  kitSlug: string;
  price: number;
  fileUrl: string;
}

export default function PurchaseControl({ kitId, kitTitle, kitSlug, price, fileUrl }: PurchaseControlProps) {
  const { user, loading: authLoading } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(true);
  const [showPaymentTray, setShowPaymentTray] = useState(false);
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

  const handleFreeUnlock = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setProcessing(true);
    try {
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

  const handleStripeCheckout = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kitId,
          kitTitle,
          price,
          userId: user.uid,
          userEmail: user.email,
          slug: kitSlug
        }),
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);

      window.location.href = url;
    } catch (err: any) {
      console.error("Stripe Checkout Error:", err);
      alert("Failed to initiate Stripe checkout. Please try again.");
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
    <div className="space-y-3">
      {!showPaymentTray ? (
        <button 
          onClick={() => {
            if (price === 0) {
              handleFreeUnlock();
            } else {
              setShowPaymentTray(true);
            }
          }}
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
      ) : (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Payment Method</span>
            <button 
              onClick={() => setShowPaymentTray(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Stripe Button */}
            <button
              onClick={handleStripeCheckout}
              disabled={processing}
              className="w-full h-14 bg-[#533afd] text-white font-bold rounded-2xl hover:opacity-90 flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Pay with Stripe
                </>
              )}
            </button>

            {/* PayPal Button */}
            <div className={cn("w-full min-h-[56px]", processing && "opacity-50 pointer-events-none")}>
              <PayPalButtons
                key={kitId}
                forceReRender={[kitId, price]}
                style={{ 
                  layout: 'vertical',
                  color: 'gold',
                  shape: 'rect',
                  label: 'paypal',
                  height: 55
                }}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [
                      {
                        description: `Notebook Kit: ${kitTitle}`,
                        amount: {
                          currency_code: "USD",
                          value: price.toString(),
                        },
                      },
                    ],
                  });
                }}
                onApprove={async (data, actions) => {
                  setProcessing(true);
                  try {
                    const response = await fetch('/api/payments/paypal/capture', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        orderID: data.orderID,
                        userId: user!.uid,
                        userEmail: user!.email,
                        kitId,
                        kitTitle
                      }),
                    });

                    const result = await response.json();
                    if (result.success) {
                      setIsOwner(true);
                      setShowPaymentTray(false);
                    } else {
                      throw new Error(result.error);
                    }
                  } catch (err: any) {
                    console.error("PayPal Capture Error:", err);
                    alert("Failed to verify payment. Please contact support.");
                  } finally {
                    setProcessing(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
