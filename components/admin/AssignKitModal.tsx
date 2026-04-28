"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Search, 
  BookOpen, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { collection, query, getDocs, orderBy, setDoc, doc, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface Kit {
  id: string;
  title: string;
  slug: string;
}

interface AssignKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onSuccess?: () => void;
}

export default function AssignKitModal({ isOpen, onClose, userId, userEmail, onSuccess }: AssignKitModalProps) {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    async function fetchKits() {
      setLoading(true);
      try {
        const q = query(collection(db, "kits"), orderBy("title", "asc"));
        const snap = await getDocs(q);
        setKits(snap.docs.map(d => ({ id: d.id, ...d.data() } as Kit)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchKits();
  }, [isOpen]);

  const handleAssign = async (kitId: string, kitTitle: string) => {
    setAssigning(kitId);
    setStatus(null);
    try {
      const accessId = `${userId}_${kitId}`;
      await setDoc(doc(db, "user_kits", accessId), {
        userId,
        kitId,
        grantedAt: serverTimestamp(),
        grantedBy: "admin"
      });
      setStatus({ type: 'success', msg: `Successfully assigned "${kitTitle}" to ${userEmail}` });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || "Failed to assign kit" });
    } finally {
      setAssigning(null);
    }
  };

  if (!isOpen) return null;

  const filteredKits = kits.filter(k => k.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Assign Kit</h2>
            <p className="text-xs text-muted-foreground mt-1">Granting access to <span className="font-bold text-primary">{userEmail}</span></p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search master kits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-muted/20 focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
            />
          </div>

          {status && (
            <div className={cn(
              "p-4 rounded-xl flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2",
              status.type === 'success' ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
            )}>
              {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
              {status.msg}
            </div>
          )}

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 opacity-50">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Inventorying...</span>
              </div>
            ) : filteredKits.length > 0 ? (
              filteredKits.map((kit) => (
                <div key={kit.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/5 hover:bg-muted/20 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{kit.title}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{kit.id}</p>
                    </div>
                  </div>
                  <button 
                    disabled={!!assigning}
                    onClick={() => handleAssign(kit.id, kit.title)}
                    className="h-8 px-4 rounded-lg bg-foreground text-background text-[10px] font-black uppercase hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {assigning === kit.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Assign"}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center py-12 text-xs font-bold text-muted-foreground uppercase tracking-widest">No kits found.</p>
            )}
          </div>
        </div>

        <div className="p-4 bg-muted/30 border-t border-border/50 text-center">
           <button onClick={onClose} className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
             Done
           </button>
        </div>
      </div>
    </div>
  );
}
