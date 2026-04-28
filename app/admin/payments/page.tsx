"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Payment } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  Loader2, 
  ExternalLink,
  DollarSign,
  TrendingUp,
  Package
} from "lucide-react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [gatewayFilter, setGatewayFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPayments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Payment));
      setPayments(fetchedPayments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.kitTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.gatewayTransactionId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGateway = gatewayFilter === "all" || payment.gateway === gatewayFilter;
    
    return matchesSearch && matchesGateway;
  });

  const totalRevenue = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const stripeRevenue = payments.filter(p => p.gateway === 'stripe').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const paypalRevenue = payments.filter(p => p.gateway === 'paypal').reduce((acc, curr) => acc + (curr.amount || 0), 0);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
          Retrieving Ledger...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Payment <span className="text-primary italic">Ledger</span></h1>
          <p className="text-muted-foreground font-medium mt-1">Track and manage all marketplace transactions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold hover:bg-muted transition-colors">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Revenue</span>
          </div>
          <div className="text-3xl font-black">${totalRevenue.toFixed(2)}</div>
          <div className="mt-2 text-[10px] font-bold text-muted-foreground uppercase">From {payments.length} transactions</div>
        </div>

        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gateway Split</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="text-lg font-black text-[#533afd]">S: ${stripeRevenue.toFixed(2)}</div>
              <div className="text-lg font-black text-amber-600">P: ${paypalRevenue.toFixed(2)}</div>
            </div>
            <div className="h-12 w-12 rounded-full border-4 border-muted flex items-center justify-center">
               <div className="text-[10px] font-black">{Math.round((stripeRevenue/totalRevenue)*100 || 0)}%</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Average Order</span>
          </div>
          <div className="text-3xl font-black">${(totalRevenue / (payments.length || 1)).toFixed(2)}</div>
          <div className="mt-2 text-[10px] font-bold text-muted-foreground uppercase">Value per kit</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by email, kit, or transaction ID..."
            className="w-full h-11 bg-muted/30 border border-border rounded-xl pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-xl px-3 h-11">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="bg-transparent border-none text-xs font-bold outline-none cursor-pointer"
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
            >
              <option value="all">All Gateways</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payer / ID</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kit Purchased</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gateway</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{payment.userEmail}</span>
                        <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">
                          {payment.gatewayTransactionId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm font-bold truncate max-w-[200px]">{payment.kitTitle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-foreground">${(payment.amount || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        payment.gateway === 'stripe' 
                          ? "bg-[#533afd10] text-[#533afd]" 
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {payment.gateway}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-muted-foreground">{formatDate(payment.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-8 w-8 opacity-20" />
                      <p className="font-bold text-sm uppercase tracking-widest">No transactions found</p>
                    </div>
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
