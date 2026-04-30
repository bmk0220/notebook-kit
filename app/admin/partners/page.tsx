"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Loader2, ShieldCheck, User as UserIcon } from "lucide-react";

export default function PartnerManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const q = query(collection(db, "users"));
      const snapshot = await getDocs(q);
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const togglePartnerRole = async (user: any) => {
    const newRole = user.role === "partner" ? "user" : "partner";
    try {
      await updateDoc(doc(db, "users", user.id), { role: newRole });
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  if (loading) return <Loader2 className="h-8 w-8 animate-spin" />;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tighter">Partner Management</h1>
      </header>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 font-bold text-xs uppercase">Email</th>
              <th className="p-4 font-bold text-xs uppercase">Role</th>
              <th className="p-4 font-bold text-xs uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'partner' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {user.role || 'user'}
                  </span>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => togglePartnerRole(user)}
                    className="flex items-center gap-2 text-xs font-bold bg-secondary px-3 py-2 rounded-lg hover:bg-secondary/80"
                  >
                    {user.role === 'partner' ? <ShieldCheck className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                    {user.role === 'partner' ? 'Demote' : 'Promote to Partner'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
