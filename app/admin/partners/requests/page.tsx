"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { Loader2, Check, X, Users, RefreshCcw } from "lucide-react";
import { PartnerRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PartnerRequests() {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    const q = query(collection(db, "partner_requests"), where("status", "==", "pending"), orderBy("requestedAt", "desc"));
    const snapshot = await getDocs(q);
    setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartnerRequest)));
    setLoading(false);
  }

  async function handleAction(request: PartnerRequest, status: 'approved' | 'rejected') {
    try {
      if (status === 'approved') {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", request.userEmail));
        const userSnapshot = await getDocs(q);
        
        if (!userSnapshot.empty) {
          await updateDoc(doc(db, "users", userSnapshot.docs[0].id), { role: "partner" });
        }
      }
      
      await updateDoc(doc(db, "partner_requests", request.id), { status });
      fetchRequests();
    } catch (err) {
      console.error("Action failed:", err);
      alert("Failed to process request.");
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Partner Requests
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Review and manage partnership applications.</p>
        </div>
        <button onClick={fetchRequests} className="h-11 px-6 rounded-xl border border-border bg-card hover:bg-muted font-bold text-sm transition-all flex items-center gap-2">
           <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
           Refresh
        </button>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-5">User Email</th>
                <th className="px-6 py-5">Requested At</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center font-bold uppercase tracking-widest text-xs text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length > 0 ? requests.map((req) => (
                <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-bold">{req.userEmail}</td>
                  <td className="px-6 py-4 text-muted-foreground">{req.requestedAt?.toDate().toLocaleDateString()}</td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleAction(req, 'approved')} className="h-9 w-9 flex items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all" title="Approve">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleAction(req, 'rejected')} className="h-9 w-9 flex items-center justify-center rounded-xl border border-border text-destructive hover:bg-destructive/10 transition-all" title="Reject">
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">No pending requests.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
