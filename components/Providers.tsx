"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { AuthProvider } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { setPartnerCookie } from "@/lib/utils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function Tracker() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    const resolveAndSetCookie = async () => {
      // If it's already an email, just set it
      if (ref.includes("@")) {
        setPartnerCookie(ref);
        return;
      }

      // Try to resolve partnerCode to email using public mapping
      try {
        const codeRef = doc(db, "partner_codes", ref.toLowerCase());
        const codeSnap = await getDoc(codeRef);
        
        if (codeSnap.exists()) {
          const mapping = codeSnap.data();
          if (mapping.email) {
            setPartnerCookie(mapping.email);
            console.log("Resolved partner code to:", mapping.email);
          }
        } else {
          // If not found in mapping, still set the cookie with the original ref 
          // (fallback for manual overrides or legacy direct email links)
          setPartnerCookie(ref);
        }
      } catch (err) {
        console.error("Error resolving partner code:", err);
        setPartnerCookie(ref);
      }
    };

    resolveAndSetCookie();
  }, [searchParams]);
  
  return null;
}

function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
    currency: "USD",
    intent: "capture",
  };

  return (
    <AuthProvider>
      <ReferralTracker />
      <PayPalScriptProvider options={paypalOptions}>
        {children}
      </PayPalScriptProvider>
    </AuthProvider>
  );
}
