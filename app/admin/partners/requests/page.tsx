"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { Loader2, Check, X } from "lucide-react";
import { PartnerRequest } from "@/lib/types";

export default function PartnerRequests() {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    const q = query(collection(db, "partner_requests"), where("status", "==", "pending"));
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

  if (loading) return <Loader2 className="h-8 w-8 animate-spin" />;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tighter">Partner Requests</h1>
      </header>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 font-bold text-xs uppercase">User Email</th>
              <th className="p-4 font-bold text-xs uppercase">Requested At</th>
              <th className="p-4 font-bold text-xs uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="border-t border-border">
                <td className="p-4">{req.userEmail}</td>
                <td className="p-4">{req.requestedAt?.toDate().toLocaleDateString()}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => handleAction(req, 'approved')} className="text-primary hover:bg-primary/10 p-2 rounded-lg">
                    <Check className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleAction(req, 'rejected')} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg">
                    <X className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground">No pending requests.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
