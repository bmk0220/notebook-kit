"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Save, Loader2 } from "lucide-react";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "user";
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: UserProfile | null; // If provided, we are in "Edit" mode
}

export default function UserModal({ isOpen, onClose, onSuccess, user }: UserModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!user;

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setRole(user.role);
    } else {
      setEmail("");
      setRole("user");
    }
    setError(null);
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        await updateDoc(doc(db, "users", user.id), {
          email,
          role,
          updatedAt: serverTimestamp(),
        });
      } else {
        const response = await fetch('https://admincreateuser-awar5h73rq-uc.a.run.app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: "TemporaryPassword123!", role })
        });
        
        if (!response.ok) throw new Error("Failed to create user account.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                {isEdit ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-xl font-bold">{isEdit ? "Edit User" : "Add New User"}</h2>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                  {isEdit ? "Update profile details" : "Register user profile"}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-8 space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs font-bold">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Email Address</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full h-12 px-4 rounded-xl border border-input bg-muted/20 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">System Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={cn(
                    "h-12 rounded-xl border font-bold text-sm transition-all",
                    role === "user" ? "bg-card border-primary text-primary shadow-sm" : "bg-muted/10 border-border text-muted-foreground hover:bg-muted/20"
                  )}
                >
                  Standard User
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={cn(
                    "h-12 rounded-xl border font-bold text-sm transition-all",
                    role === "admin" ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/10 border-border text-muted-foreground hover:bg-muted/20"
                  )}
                >
                  Administrator
                </button>
              </div>
            </div>

            {!isEdit && (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-600 font-medium leading-relaxed">
                <span className="font-black uppercase block mb-1 text-amber-700">Important</span>
                Adding a user here creates their Firestore record. The user will still need to sign up via the login page to verify their email and set a password.
              </div>
            )}
          </div>

          <div className="p-6 bg-muted/20 border-t border-border/50 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-border font-bold text-sm hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save Changes" : "Create Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
