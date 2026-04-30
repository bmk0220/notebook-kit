"use client";

import { useEffect, useState } from "react";
import StatsCard from "@/components/admin/StatsCard";
import { 
  NotebookIcon, 
  Users, 
  MessageSquare, 
  DollarSign,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Hammer,
  Briefcase
} from "lucide-react";
import { collection, query, orderBy, limit, getDocs, getCountFromServer, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface RecentKit {
  id: string;
  title: string;
  email?: string;
  createdAt: any;
  status: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalKits: 0,
    totalUsers: 0,
    totalRequests: 0,
    totalPartners: 0,
    activeForge: 0
  });
  const [recentKits, setRecentKits] = useState<RecentKit[]>([]);


  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Counts
        const kitsCount = await getCountFromServer(collection(db, "kits"));
        const usersCount = await getCountFromServer(collection(db, "users"));
        const requestsCount = await getCountFromServer(collection(db, "requests"));
        const partnersCount = await getCountFromServer(query(collection(db, "users"), where("role", "==", "partner")));

        setStats({
          totalKits: kitsCount.data().count,
          totalUsers: usersCount.data().count,
          totalRequests: requestsCount.data().count,
          totalPartners: partnersCount.data().count,
          activeForge: 0 
        });

        // Fetch Recent Kits
        const q = query(collection(db, "kits"), orderBy("createdAt", "desc"), limit(5));
        const snapshot = await getDocs(q);
        const kits = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RecentKit[];
        setRecentKits(kits);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-8 md:space-y-10">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Dashboard</h1>
        <p className="text-muted-foreground font-medium mt-1 text-sm">System status and recent forge activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatsCard 
          label="Total Kits" 
          value={stats.totalKits} 
          icon={NotebookIcon} 
          trend="+4.3%" 
          trendType="up"
          href="/admin/kits"
        />
        <StatsCard 
          label="Active Users" 
          value={stats.totalUsers} 
          icon={Users} 
          trend="+12%" 
          trendType="up"
          href="/admin/users"
        />
        <StatsCard 
          label="Kit Requests" 
          value={stats.totalRequests} 
          icon={MessageSquare} 
          trend="Steady" 
          href="/admin/requests"
        />
        <StatsCard 
          label="Partners" 
          value={stats.totalPartners} 
          icon={Briefcase} 
          trend="Active" 
          href="/admin/partners"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
              <Clock className="h-5 w-5 text-primary" />
              Forge Activity
            </h2>
            <Link href="/admin/kits" className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1 tracking-widest">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 md:px-6 py-4">Kit Title</th>
                    <th className="px-4 md:px-6 py-4">Status</th>
                    <th className="px-4 md:px-6 py-4">Created</th>
                    <th className="px-4 md:px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {recentKits.length > 0 ? recentKits.map((kit) => (
                    <tr key={kit.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-4 md:px-6 py-4">
                        <div className="font-bold group-hover:text-primary transition-colors text-sm">{kit.title}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{kit.id}</div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/10 text-green-600 uppercase tracking-tighter">
                          {kit.status || 'Live'}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-muted-foreground font-medium text-xs">
                        {formatDate(kit.createdAt)}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                         <button className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors ml-auto">
                           <ArrowUpRight className="h-3.5 w-3.5" />
                         </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
                        No recent activity found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="space-y-6">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
            <Hammer className="h-5 w-5 text-primary" />
            Quick Actions
          </h2>
          <div className="space-y-3">
             <Link 
              href="/admin/forge" 
              className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group"
             >
               <div className="flex items-center gap-3">
                 <div className="bg-primary p-2 rounded-lg text-primary-foreground">
                   <Hammer className="h-4 w-4" />
                 </div>
                 <span className="font-bold text-sm">Forge New Kit</span>
               </div>
               <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
             </Link>

             <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left">
               <div className="flex items-center gap-3">
                 <div className="bg-muted p-2 rounded-lg">
                   <Users className="h-4 w-4" />
                 </div>
                 <span className="font-bold text-sm">Audit Users</span>
               </div>
               <ChevronRight className="h-4 w-4 opacity-30" />
             </button>

             <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden group mt-6 md:mt-10">
               <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                 <NotebookIcon className="h-24 w-24 -mr-8 -mt-8" />
               </div>
               <h3 className="font-black uppercase tracking-tighter text-2xl mb-2 leading-none">Alpha v0.1</h3>
               <p className="text-[10px] md:text-xs font-bold opacity-90 leading-relaxed max-w-[200px]">
                 The system is currently in Alpha. Automated billing and analytics are being finalized.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
