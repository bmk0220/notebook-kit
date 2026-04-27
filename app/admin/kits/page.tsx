"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye,
  NotebookIcon,
  CheckCircle,
  FileEdit,
  Archive,
  ArrowUpDown,
  AlertTriangle,
  X,
  Loader2
} from "lucide-react";
import StatsCard from "@/components/admin/StatsCard";
import { KIT_ICONS } from "@/lib/constants/forge";
import { cn } from "@/lib/utils";

interface Kit {
  id: string;
  title: string;
  slug: string;
  price: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: any;
  iconSvgName?: string;
  categories?: string[];
}

export default function ManageKitsPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteKit, setDeleteKit] = useState<Kit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchKits();
  }, []);

  async function fetchKits() {
    setLoading(true);
    try {
      const q = query(collection(db, "kits"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetchedKits = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Kit[];
      setKits(fetchedKits);
    } catch (err) {
      console.error("Error fetching kits:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteClick = (kit: Kit) => {
    setDeleteKit(kit);
  };

  const performDelete = async (kit: Kit) => {
    setIsDeleting(true);
    try {
      // 1. Check if the kit has been purchased
      console.log(`Checking purchase count for kit ID: ${kit.id}`);
      const q = query(collection(db, "user_kits"), where("kitId", "==", kit.id));
      const accessSnaps = await getDocs(q);
      const purchaseCount = accessSnaps.size;
      console.log(`Found ${purchaseCount} owner(s).`);

      // 2. Perform Cascading Delete
      // a) Delete all user_kits access records
      if (purchaseCount > 0) {
        const batch = writeBatch(db);
        accessSnaps.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
        console.log(`Successfully revoked access for ${purchaseCount} users.`);
      }

      // b) Delete from Storage
      try {
        if (kit.slug) {
          const storagePath = `kits/${kit.id}/${kit.slug}.zip`;
          const fileRef = ref(storage, storagePath);
          await deleteObject(fileRef);
          console.log(`Successfully deleted storage file: ${storagePath}`);
        }
      } catch (e: any) {
        if (e.code !== 'storage/object-not-found') {
          console.error("Storage cleanup failed:", e);
        }
      }

      // c) Delete from kits_content
      try {
        await deleteDoc(doc(db, "kits_content", kit.id));
      } catch (e) {
        console.warn("kits_content doc not found or delete failed.");
      }

      // d) Delete main doc
      await deleteDoc(doc(db, "kits", kit.id));
      
      setKits(prev => prev.filter(k => k.id !== kit.id));
      setDeleteKit(null);
      console.log(`Successfully deleted kit: ${kit.title}`);
    } catch (err: any) {
      console.error("Error deleting kit:", err);
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (kitId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'published' ? 'archived' : 'published';
    try {
      await updateDoc(doc(db, "kits", kitId), { status: nextStatus });
      setKits(kits.map(k => k.id === kitId ? { ...k, status: nextStatus as any } : k));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const filteredKits = kits.filter(kit => {
    const matchesSearch = kit.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         kit.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || kit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: kits.length,
    published: kits.filter(k => k.status === 'published').length,
    drafts: kits.filter(k => k.status === 'draft').length,
    archived: kits.filter(k => k.status === 'archived').length,
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Manage Kits</h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm">Inventory management and kit orchestration.</p>
        </div>
        <Link 
          href="/admin/forge" 
          className="btn btn-primary h-12 px-6 rounded-xl font-bold gap-2 flex items-center justify-center"
        >
          <Plus className="h-5 w-5" />
          Forge New Kit
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatsCard 
          label="Total Inventory" 
          value={stats.total} 
          icon={NotebookIcon} 
        />
        <StatsCard 
          label="Live Kits" 
          value={stats.published} 
          icon={CheckCircle} 
          className="text-green-600"
        />
        <StatsCard 
          label="Drafts" 
          value={stats.drafts} 
          icon={FileEdit} 
          className="text-amber-600"
        />
        <StatsCard 
          label="Archived" 
          value={stats.archived} 
          icon={Archive} 
          className="text-muted-foreground"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search by title or slug..."
            className="input input-bordered w-full pl-10 bg-card rounded-xl h-12 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="select select-bordered bg-card rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest px-4"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
          <button className="btn btn-ghost h-12 w-12 p-0 rounded-xl border border-border bg-card">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-4">Kit Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8">
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : filteredKits.length > 0 ? filteredKits.map((kit) => {
                const Icon = (kit.iconSvgName && KIT_ICONS[kit.iconSvgName]) || NotebookIcon;
                return (
                  <tr key={kit.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{kit.title}</div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">/{kit.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1">
                        {kit.categories?.map(cat => (
                          <span key={cat} className="text-[9px] font-black uppercase bg-muted px-2 py-0.5 rounded tracking-tighter">
                            {cat}
                          </span>
                        )) || <span className="text-[9px] font-medium text-muted-foreground italic">General</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-sm">
                      ${kit.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                        kit.status === 'published' ? "bg-green-500/10 text-green-600" :
                        kit.status === 'draft' ? "bg-amber-500/10 text-amber-600" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {kit.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-muted-foreground font-medium text-xs">
                      {kit.createdAt?.toDate ? kit.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/marketplace/${kit.slug}`}
                          target="_blank"
                          className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
                          title="View on Marketplace"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <Link 
                          href={`/admin/kits/${kit.id}`}
                          className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Edit Kit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button 
                          onClick={() => handleStatusToggle(kit.id, kit.status)}
                          className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
                          title={kit.status === 'published' ? "Archive" : "Publish"}
                        >
                          {kit.status === 'published' ? <Archive className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5 text-green-600" />}
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(kit)}
                          className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-colors"
                          title="Hard Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Search className="h-8 w-8 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-xs">No kits found matching criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmModal 
        isOpen={!!deleteKit} 
        kit={deleteKit} 
        onClose={() => setDeleteKit(null)} 
        onConfirm={performDelete}
        loading={isDeleting}
      />
    </div>
  );
}

function DeleteConfirmModal({ isOpen, kit, onClose, onConfirm, loading }: { 
  isOpen: boolean, 
  kit: Kit | null, 
  onClose: () => void, 
  onConfirm: (kit: Kit) => void,
  loading: boolean
}) {
  const [confirmText, setConfirmText] = useState('');
  const [owners, setOwners] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && kit) {
      setConfirmText('');
      setOwners(null);
      // Fetch owners count for the modal
      const fetchOwners = async () => {
        const q = query(collection(db, "user_kits"), where("kitId", "==", kit.id));
        const snap = await getDocs(q);
        setOwners(snap.size);
      };
      fetchOwners();
    }
  }, [isOpen, kit]);

  if (!isOpen || !kit) return null;

  const isConfirmed = confirmText === 'DELETE';
  const hasOwners = owners !== null && owners > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Hard Delete Kit?</h2>
            <p className="text-sm text-muted-foreground px-4">
              You are about to permanently remove <span className="font-bold text-foreground">"{kit.title}"</span>.
            </p>
          </div>

          {owners !== null && owners > 0 && (
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-600 text-xs font-bold flex items-start gap-3 text-left">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <div>
                CRITICAL: This kit is owned by {owners} user(s). 
                Deleting it will revoke their access and delete the source files.
              </div>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text-alt font-black uppercase tracking-widest text-[9px] text-muted-foreground">Type 'DELETE' to confirm</span>
              </label>
              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="input input-bordered w-full bg-muted/20 text-center font-black tracking-widest focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="btn btn-ghost flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest"
              >
                Cancel
              </button>
              <button 
                disabled={!isConfirmed || loading}
                onClick={() => onConfirm(kit)}
                className="btn btn-error flex-[2] h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-white shadow-lg shadow-red-500/20"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Hard Delete"}
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
