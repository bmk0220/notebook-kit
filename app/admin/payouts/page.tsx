"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, 
  Loader2,
  CheckCircle,
  Clock,
  RefreshCcw,
} from "lucide-react";
import { collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn, formatDate } from "@/lib/utils";

interface PayoutRequest {
  id: string;
  userEmail: string;
  userId: string;
  amount: number;
  status: string;
  requestedAt: any;
  completedAt?: any;
}

export default function AdminPayoutRequests() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "payout_requests"), orderBy("requestedAt", "desc"));
      const snapshot = await getDocs(q);
      
      const fetchedRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PayoutRequest[];
      
      setRequests(fetchedRequests);
    } catch (err) {
      console.error("Error fetching payout requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const markAsPaid = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await updateDoc(doc(db, "payout_requests", requestId), { 
        status: "completed",
        completedAt: serverTimestamp()
      });
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "completed", completedAt: new Date() } : r));
    } catch (err) {
      console.error("Error marking as paid:", err);
      alert("Failed to mark payout as completed.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase flex items-center gap-3">
            <CreditCard className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            Payout Requests
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm md:text-base">Manage partner payout requests and fulfillments.</p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={fetchRequests}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 md:h-11 px-4 md:px-6 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs md:text-sm transition-all"
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-card border border-border rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <th className="px-4 md:px-6 py-4 md:py-5">Partner Email</th>
                <th className="px-4 md:px-6 py-4 md:py-5">Amount</th>
                <th className="px-4 md:px-6 py-4 md:py-5">Status</th>
                <th className="px-4 md:px-6 py-4 md:py-5">Requested Date</th>
                <th className="px-4 md:px-6 py-4 md:py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50 mx-auto mb-4" />
                    <p className="font-bold uppercase tracking-tight text-xs text-muted-foreground">Loading Payout Requests...</p>
                  </td>
                </tr>
              ) : requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="font-bold text-sm">{req.userEmail}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{req.userId}</div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="font-black text-lg text-primary">
                        ${req.amount?.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        req.status === "completed" ? "bg-green-500/10 text-green-600" : "bg-warning/20 text-warning"
                      )}>
                        {req.status === "completed" ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {req.status}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-muted-foreground text-xs">
                      {formatDate(req.requestedAt)}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                      {actionLoading === req.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary ml-auto" />
                      ) : req.status === 'pending' ? (
                        <button 
                          onClick={() => markAsPaid(req.id)}
                          className="ml-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm bg-primary/10 text-primary hover:bg-primary hover:text-white"
                        >
                          Mark as Paid
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
                    No payout requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
