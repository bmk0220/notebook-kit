"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  User as UserIcon, 
  Mail,
  Clock,
  Loader2,
  RefreshCcw,
  Briefcase
} from "lucide-react";
import { collection, query, orderBy, getDocs, doc, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn, formatDate } from "@/lib/utils";
import { UserProfile } from "@/lib/types";

export default function PartnerManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch only users with partner role OR all users to promote?
      // Usually "Partner Management" implies managing EXISTING partners, 
      // but the user might want to see everyone to promote them.
      // Given the previous implementation, let's show ALL users but with better design.
      const q = query(collection(db, "users"), orderBy("email", "asc"));
      const snapshot = await getDocs(q);
      
      const fetchedUsers = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Error fetching partners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const togglePartnerRole = async (user: UserProfile) => {
    const newRole = user.role === "partner" ? "user" : "partner";
    setActionLoading(user.uid);
    try {
      await updateDoc(doc(db, "users", user.uid), { role: newRole });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, role: newRole as any } : u));
    } catch (err) {
      console.error("Error updating role:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase flex items-center gap-3">
            <Briefcase className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            Partner Management
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm md:text-base">Manage your affiliate network and roles.</p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={fetchUsers}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 md:h-11 px-4 md:px-6 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs md:text-sm transition-all"
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input 
          type="text"
          placeholder="Search partners by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 md:h-12 pl-11 pr-4 rounded-2xl border border-input bg-card focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
        />
      </div>

      {/* Partners Table */}
      <div className="bg-card border border-border rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <th className="px-4 md:px-6 py-4 md:py-5">Partner Profile</th>
                <th className="px-4 md:px-6 py-4 md:py-5">Current Role</th>
                <th className="px-4 md:px-6 py-4 md:py-5">Joined Date</th>
                <th className="px-4 md:px-6 py-4 md:py-5">Last Login</th>
                <th className="px-4 md:px-6 py-4 md:py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50 mx-auto mb-4" />
                    <p className="font-bold uppercase tracking-tight text-xs text-muted-foreground">Accessing Partner Directory...</p>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 md:h-10 md:w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-xs border transition-colors",
                          user.role === "partner" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
                        )}>
                          {user.email?.[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate max-w-[150px] md:max-w-[200px]">{user.email}</p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">{user.uid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        user.role === "partner" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground border border-border/50"
                      )}>
                        {user.role === "partner" ? <ShieldCheck className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                        {user.role || 'user'}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-muted-foreground text-xs">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 opacity-50 shrink-0" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-muted-foreground text-xs">
                      {user.lastLogin ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 opacity-50 shrink-0" />
                          <span className="whitespace-nowrap">
                            {formatDate(user.lastLogin)}
                          </span>
                        </div>
                      ) : 'Never'}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                      {actionLoading === user.uid ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary ml-auto" />
                      ) : (
                        <button 
                          onClick={() => togglePartnerRole(user)}
                          className={cn(
                            "ml-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm",
                            user.role === 'partner' 
                              ? "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white" 
                              : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                          )}
                        >
                          {user.role === 'partner' ? 'Demote' : 'Promote'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-3 md:gap-4">
        <div className="bg-primary/20 p-2 rounded-xl text-primary shrink-0">
          <ShieldCheck className="h-5 w-5 md:h-6 md:w-6" />
        </div>
        <div>
          <h4 className="font-bold text-xs md:text-sm text-primary uppercase tracking-wider">Partner Access</h4>
          <p className="text-[10px] md:text-xs text-primary/70 leading-relaxed mt-1">
            Promoting a user to Partner immediately grants them access to the Partner Portal and affiliate resources.
            Demoting them will restrict access to these features instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
