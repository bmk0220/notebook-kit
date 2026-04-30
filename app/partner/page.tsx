"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function PartnerDashboard() {
  const { isPartner, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isPartner && !isAdmin) {
      router.push("/");
    }
  }, [loading, isPartner, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tighter">Partner Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your affiliate marketing hub.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold">Total Earnings</h3>
          <p className="text-4xl font-black mt-2">$0.00</p>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold">Referral Clicks</h3>
          <p className="text-4xl font-black mt-2">0</p>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold">Conversion Rate</h3>
          <p className="text-4xl font-black mt-2">0%</p>
        </div>
      </section>
    </div>
  );
}
