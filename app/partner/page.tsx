"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Payment, MarketingAsset } from "@/lib/types";

export default function PartnerDashboard() {
  const { user, isPartner, isAdmin, loading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [fetching, setFetching] = useState(true);
  const [inputUrl, setInputUrl] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [linkHistory, setLinkHistory] = useState<string[]>([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  useEffect(() => {
    // Load history from localStorage only on client
    const saved = localStorage.getItem("referralLinkHistory");
    if (saved) setLinkHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (user?.email) {
      fetchData();
    } else {
      setFetching(false);
    }
  }, [user]);

  async function fetchData() {
    try {
      const pQuery = query(collection(db, "payments"), where("partnerId", "==", user?.email));
      const aQuery = collection(db, "marketing_assets");
      const reqQuery = query(collection(db, "partner_requests"), where("userEmail", "==", user?.email), where("status", "==", "pending"));

      const [pSnap, aSnap, reqSnap] = await Promise.all([
        getDocs(pQuery),
        getDocs(aQuery),
        getDocs(reqQuery)
      ]);

      setPayments(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
      setAssets(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketingAsset)));
      setHasPendingRequest(!reqSnap.empty);
    } catch (err) {
      console.error("Error fetching partner data:", err);
    } finally {
      setFetching(false);
    }
  }

  const handleRequest = async () => {
    if (!user || hasPendingRequest) return;
    try {
      await addDoc(collection(db, "partner_requests"), {
        userId: user.uid,
        userEmail: user.email,
        status: "pending",
        requestedAt: serverTimestamp(),
      });
      setHasPendingRequest(true);
      alert("Request submitted! We'll review your application soon.");
    } catch (err) {
      console.error("Error requesting partnership:", err);
      alert("Failed to submit request.");
    }
  };

  const handleGenerate = () => {
    if (!inputUrl) return;
    try {
      const url = new URL(inputUrl);
      // For Admin, use their email or a fallback identifier if needed, 
      // ensuring consistency for referral tracking.
      const refId = user?.email || "";
      url.searchParams.set("ref", refId);
      const newLink = url.toString();
      setGeneratedLink(newLink);
      
      const newHistory = [newLink, ...linkHistory.filter(l => l !== newLink)].slice(0, 5);
      setLinkHistory(newHistory);
      localStorage.setItem("referralLinkHistory", JSON.stringify(newHistory));
    } catch {
      alert("Please enter a valid URL");
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPartner && !isAdmin) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-8">
        <h1 className="text-5xl font-black tracking-tighter">Become a Notebook Kit Partner</h1>
        <p className="text-xl text-muted-foreground">Join our affiliate program and earn 50% commission on every sale you drive. Access our exclusive partner resources and start earning today.</p>
        <button 
          onClick={handleRequest} 
          disabled={hasPendingRequest}
          className={`px-8 py-4 font-black text-lg rounded-full transition-all shadow-xl ${hasPendingRequest ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:scale-105 shadow-primary/20'}`}
        >
          {hasPendingRequest ? "Partnership Request Pending" : "Request Partnership Access"}
        </button>
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
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 px-4 py-3 bg-muted rounded-xl border border-border"
          />
          <button 
            onClick={handleGenerate}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            Generate Link
          </button>
        </div>
        
        {/* Recent History */}
        {linkHistory.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Recent Links</h3>
            {linkHistory.map((link, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg text-xs font-mono break-all border border-border">
                <span className="truncate mr-4">{link}</span>
                <button 
                  onClick={() => { navigator.clipboard.writeText(link); alert("Copied!"); }}
                  className="font-bold text-primary underline shrink-0"
                >Copy</button>
              </div>
            ))}
          </div>
        )}
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
