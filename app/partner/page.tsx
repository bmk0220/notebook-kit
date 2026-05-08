"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Link as LinkIcon, Image as ImageIcon, Briefcase, Clock } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { Payment, MarketingAsset } from "@/lib/types";
import PageHeader from "@/components/PageHeader";

export default function PartnerDashboard() {
  const { user, profile, isPartner, isAdmin, loading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [fetching, setFetching] = useState(true);
  const [inputUrl, setInputUrl] = useState("");
  const [linkHistory, setLinkHistory] = useState<string[]>([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [requestingPayout, setRequestingPayout] = useState(false);

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
  }, [user, profile]);

  async function fetchData() {
    let reqEmpty = true;
    try {
      const reqQuery = query(collection(db, "partner_requests"), where("userEmail", "==", user?.email), where("status", "==", "pending"));
      const reqSnap = await getDocs(reqQuery);
      reqEmpty = reqSnap.empty;
    } catch (err) {
      console.error("Error fetching partner requests:", err);
    }

    if (isPartner || isAdmin) {
      try {
        // Query by email
        const pQueryEmail = query(collection(db, "payments"), where("partnerId", "==", user?.email));
        const pSnapEmail = await getDocs(pQueryEmail);
        let fetchedPayments = pSnapEmail.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));

        // Query by partnerCode if it exists
        if (profile?.partnerCode) {
          try {
            const pQueryCode = query(collection(db, "payments"), where("partnerId", "==", profile.partnerCode));
            const pSnapCode = await getDocs(pQueryCode);
            const codePayments = pSnapCode.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));

            // Merge and remove duplicates
            codePayments.forEach(cp => {
              if (!fetchedPayments.some(fp => fp.id === cp.id)) {
                fetchedPayments.push(cp);
              }
            });
          } catch (err) {
            console.error("Error fetching payments by partner code:", err);
          }
        }

        fetchedPayments.sort((a, b) => {
          const timeA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate().getTime() : new Date((a.createdAt as any) || 0).getTime();
          const timeB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate().getTime() : new Date((b.createdAt as any) || 0).getTime();
          return timeB - timeA;
        });
        setPayments(fetchedPayments);
      } catch (err) {
        console.error("Error fetching partner payments:", err);
        setPayments([]);
      }

      try {
        const aQuery = collection(db, "marketing_assets");
        const aSnap = await getDocs(aQuery);
        setAssets(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketingAsset)));
      } catch (err) {
        console.error("Error fetching marketing assets:", err);
        setAssets([]);
      }

      try {
        const prQuery = query(collection(db, "payout_requests"), where("userEmail", "==", user?.email));
        const prSnap = await getDocs(prQuery);
        setPayoutRequests(prSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching payout requests:", err);
        setPayoutRequests([]);
      }
    }

    setHasPendingRequest(!reqEmpty);
    setFetching(false);
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

  const totalEarnings = payments.reduce((sum, p) => sum + (p.amount * 0.5), 0);
  const totalPaidOut = payoutRequests.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0);
  const totalPending = payoutRequests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
  const availableBalance = totalEarnings - totalPaidOut - totalPending;
  const hasPendingPayout = payoutRequests.some(r => r.status === 'pending');

  const handlePayoutRequest = async () => {
    if (!user || availableBalance < 35 || hasPendingPayout) return;
    setRequestingPayout(true);
    try {
      await addDoc(collection(db, "payout_requests"), {
        userId: user.uid,
        userEmail: user.email,
        amount: availableBalance,
        status: "pending",
        requestedAt: serverTimestamp(),
      });
      alert("Payout request submitted successfully!");
      fetchData(); // refresh
    } catch (err) {
      console.error("Error submitting payout request:", err);
      alert("Failed to submit payout request.");
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleGenerate = () => {
    if (!inputUrl) return;
    try {
      let urlStr = inputUrl;
      if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        urlStr = 'https://' + urlStr;
      }
      const url = new URL(urlStr);
      // Use partnerCode if available, otherwise fallback to email
      const refId = profile?.partnerCode || user?.email || "";
      url.searchParams.set("ref", refId);
      const newLink = url.toString();

      const newHistory = [newLink, ...linkHistory.filter(l => l !== newLink)].slice(0, 5);
      setLinkHistory(newHistory);
      localStorage.setItem("referralLinkHistory", JSON.stringify(newHistory));
      setInputUrl(""); // Clear input on success
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

  return (
    <div className="max-w-4xl mx-auto py-12 md:py-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="relative overflow-hidden rounded-[3rem] bg-card border border-border p-8 md:p-16 text-center space-y-8 shadow-2xl shadow-primary/5">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />

        <div className="relative">
          <div className="h-20 w-20 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground mx-auto mb-8 shadow-xl shadow-primary/20">
            <Briefcase className="h-10 w-10" />
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase leading-none">
            Become a <span className="text-primary italic">Partner</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium mt-6 max-w-2xl mx-auto leading-relaxed">
            Join the elite affiliate network of Notebook Kit.
            Earn <span className="text-foreground font-black">50% commission</span> on every sale you drive.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
            <div className="text-2xl font-black text-primary">50%</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Commission</div>
          </div>
          <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
            <div className="text-2xl font-black text-primary">$35</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Min. Payout</div>
          </div>
          <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
            <div className="text-2xl font-black text-primary">120 Days</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Tracking</div>
          </div>
        </div>

        <div className="pt-8">
          <button
            onClick={handleRequest}
            disabled={hasPendingRequest}
            className={cn(
              "group relative inline-flex items-center justify-center px-10 py-5 font-black text-xl rounded-2xl transition-all shadow-xl active:scale-95",
              hasPendingRequest
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:scale-105 shadow-primary/30"
            )}
          >
            {hasPendingRequest ? (
              <>
                <Clock className="mr-2 h-6 w-6 animate-pulse" />
                Request Pending Review
              </>
            ) : (
              <>
                Request Partner Access
                <LinkIcon className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          <p className="text-xs text-muted-foreground font-medium mt-6">
            Requests are typically reviewed within 24-48 hours.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Partner Portal"
        subtitle="Manage your referrals, track earnings, and access marketing resources."
        icon={Briefcase}
      />

      {/* Metrics Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Total Earnings</h3>
          <p className="text-3xl font-black mt-2">
            ${totalEarnings.toFixed(2)}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-primary/20 bg-primary/5">
          <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Available Balance</h3>
          <p className="text-3xl font-black mt-2 text-primary">
            ${availableBalance.toFixed(2)}
          </p>
          <div className="mt-4">
            <button
              onClick={handlePayoutRequest}
              disabled={requestingPayout || hasPendingPayout || availableBalance < 35}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${hasPendingPayout ? 'bg-warning/20 text-warning cursor-not-allowed' :
                  availableBalance < 35 ? 'bg-muted text-muted-foreground cursor-not-allowed' :
                    'bg-primary text-primary-foreground shadow-lg hover:scale-[1.02]'
                }`}
            >
              {requestingPayout ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> :
                hasPendingPayout ? "Payout Pending" :
                  availableBalance < 35 ? "Min $35 to Payout" : "Request Payout"}
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Total Paid Out</h3>
          <p className="text-3xl font-black mt-2 text-green-500">
            ${totalPaidOut.toFixed(2)}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Total Sales</h3>
          <p className="text-3xl font-black mt-2">{payments.length}</p>
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

      {/* Marketing Materials */}
      <section className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <h2 className="text-xl font-black">Marketing Materials</h2>
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

