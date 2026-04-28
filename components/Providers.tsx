"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
    currency: "USD",
    intent: "capture",
  };

  return (
    <AuthProvider>
      <PayPalScriptProvider options={paypalOptions}>
        {children}
      </PayPalScriptProvider>
    </AuthProvider>
  );
}
