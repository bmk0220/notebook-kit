"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  User as UserIcon, 
  MoreVertical, 
  Trash2,
  Mail,
  Clock,
  Loader2,
  RefreshCcw,
  BookOpen,
  UserPlus
} from "lucide-react";
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import AssignKitModal from "@/components/admin/AssignKitModal";
import UserModal from "@/components/admin/UserModal";

interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "user";
  createdAt?: any;
  lastLogin?: any;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{id: string, email: string} | null>(null);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("email", "asc"));
      const snapshot = await getDocs(q);
      const fetchedUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    setActionLoading(userId);
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Failed to update user role.");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user record? This only removes the Firestore profile, not the Auth account.")) return;
    
    setActionLoading(userId);
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Users className="h-10 w-10 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Audit and manage platform access.</p>
        </div>
        
        <div className="flex items-center gap-3 self-start">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
          <button 
            onClick={fetchUsers}
            className="flex items-center gap-2 h-11 px-6 rounded-xl border border-border bg-card hover:bg-muted font-bold text-sm transition-all"
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input 
          type="text"
          placeholder="Search by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-2xl border border-input bg-card focus:ring-2 focus:ring-primary/50 outline-none transition-all"
        />
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-5">User Profile</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">Joined Date</th>
                <th className="px-6 py-5">Last Login</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50 mx-auto mb-4" />
                    <p className="font-bold uppercase tracking-tight text-xs text-muted-foreground">Accessing User Directory...</p>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs border transition-colors",
                          user.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
                        )}>
                          {user.email?.[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm truncate max-w-[200px]">{user.email}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        user.role === "admin" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground border border-border/50"
                      )}>
                        {user.role === "admin" ? <ShieldCheck className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-muted-foreground text-xs">
                      {user.createdAt?.toDate ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 opacity-50" />
                          {user.createdAt.toDate().toLocaleDateString()}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 font-medium text-muted-foreground text-xs">
                      {user.lastLogin?.toDate ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 opacity-50" />
                          {user.lastLogin.toDate().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      ) : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {actionLoading === user.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <>
                            <button 
                              onClick={() => setSelectedUser({ id: user.id, email: user.email })}
                              title="Assign Kit"
                              className="h-9 w-9 flex items-center justify-center rounded-xl border border-border hover:bg-primary/10 text-primary transition-all"
                            >
                              <BookOpen className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => setEditUser(user)}
                              title="Edit User"
                              className="h-9 w-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-all"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteUser(user.id)}
                              className="h-9 w-9 flex items-center justify-center rounded-xl border border-border hover:bg-destructive hover:text-destructive-foreground transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
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

      <AssignKitModal 
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        userId={selectedUser?.id || ""}
        userEmail={selectedUser?.email || ""}
      />

      <UserModal 
        isOpen={isAddModalOpen || !!editUser}
        user={editUser}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditUser(null);
        }}
        onSuccess={fetchUsers}
      />

      {/* Info Card */}
      <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4">
        <div className="bg-primary/20 p-2 rounded-xl text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-primary uppercase tracking-wider">Security Notice</h4>
          <p className="text-xs text-primary/70 leading-relaxed mt-1">
            Role changes affect permissions immediately across the platform. Deleting a user here only removes their 
            Firestore metadata; their authentication credentials must be managed separately in the Firebase Auth console.
          </p>
        </div>
      </div>
    </div>
  );
}
