"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function PartnerDashboard() {
  const { user, isPartner, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !isPartner && !isAdmin) {
      router.push("/");
    }
  }, [loading, isPartner, isAdmin, router]);

  useEffect(() => {
    if (user?.email) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    try {
      const pQuery = query(collection(db, "payments"), where("partnerId", "==", user?.email));
      const aQuery = collection(db, "marketing_assets");
      
      const [pSnap, aSnap] = await Promise.all([
        getDocs(pQuery),
        getDocs(aQuery)
      ]);
      
      setPayments(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setAssets(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching partner data:", err);
    } finally {
      setFetching(false);
    }
  }

  if (loading || fetching) {
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
      </header>

      {/* Metrics Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold">Total Earnings</h3>
          <p className="text-4xl font-black mt-2">
            ${payments.reduce((sum, p) => sum + (p.amount * 0.5), 0).toFixed(2)}
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold">Total Sales</h3>
          <p className="text-4xl font-black mt-2">{payments.length}</p>
        </div>
      </section>

      {/* Earnings History */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-black">Earnings History</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 font-bold text-xs uppercase">Date</th>
              <th className="p-4 font-bold text-xs uppercase">Kit Sold</th>
              <th className="p-4 font-bold text-xs uppercase">Sale Price</th>
              <th className="p-4 font-bold text-xs uppercase">Commission (50%)</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-4">{formatDate(p.createdAt)}</td>
                <td className="p-4 font-bold">{p.kitTitle}</td>
                <td className="p-4">${p.amount.toFixed(2)}</td>
                <td className="p-4 font-black text-primary">${(p.amount * 0.5).toFixed(2)}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">No sales recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Link Generator */}
      <section className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <h2 className="text-xl font-black">Link Generator</h2>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Paste Kit URL here..." 
            className="flex-1 px-4 py-3 bg-muted rounded-xl border border-border"
          />
          <button className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90">
            Generate Link
          </button>
        </div>
      </section>

      {/* Asset Vault */}
      <section className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <h2 className="text-xl font-black">Creative Asset Vault</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assets currently available.</p>
          ) : (
            assets.map(asset => (
              <div key={asset.id} className="p-4 rounded-xl bg-muted border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {asset.type === 'banner' ? <ImageIcon className="h-5 w-5 text-primary" /> : <LinkIcon className="h-5 w-5 text-primary" />}
                  <span className="font-bold">{asset.name}</span>
                </div>
                <a href={asset.url} target="_blank" rel="noreferrer" className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-lg">Download</a>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
