"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { AuthProvider } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { setPartnerCookie } from "@/lib/utils";

function Tracker() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setPartnerCookie(ref);
    }
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
