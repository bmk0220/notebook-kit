"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Loader2, Plus, Trash2, Link as LinkIcon, Image as ImageIcon } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  type: string;
  url: string;
}

export default function AssetManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAsset, setNewAsset] = useState({ name: "", type: "banner", url: "" });

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    const snapshot = await getDocs(collection(db, "marketing_assets"));
    setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset)));
    setLoading(false);
  }

  async function addAsset() {
    if (!newAsset.name || !newAsset.url) return;
    await addDoc(collection(db, "marketing_assets"), {
      ...newAsset,
      createdAt: serverTimestamp(),
    });
    setNewAsset({ name: "", type: "banner", url: "" });
    fetchAssets();
  }

  async function deleteAsset(id: string) {
    await deleteDoc(doc(db, "marketing_assets", id));
    fetchAssets();
  }

  if (loading) return <Loader2 className="h-8 w-8 animate-spin" />;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
            <ImageIcon className="h-8 w-8 text-primary" />
            Marketing Materials
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Upload and manage promotional assets for partners.</p>
        </div>
      </header>

      <section className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
        <h2 className="font-bold uppercase tracking-widest text-xs text-muted-foreground">Add New Asset</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input className="flex-1 px-4 py-3 bg-muted rounded-xl text-sm" placeholder="Asset Name" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} />
          <select className="px-4 py-3 bg-muted rounded-xl text-sm" value={newAsset.type} onChange={e => setNewAsset({...newAsset, type: e.target.value})}>
            <option value="banner">Banner</option>
            <option value="swipe">Swipe Copy</option>
          </select>
          <input className="flex-[2] px-4 py-3 bg-muted rounded-xl text-sm" placeholder="External URL" value={newAsset.url} onChange={e => setNewAsset({...newAsset, url: e.target.value})} />
          <button onClick={addAsset} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Asset
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map(asset => (
          <div key={asset.id} className="p-6 rounded-3xl bg-card border border-border shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                {asset.type === 'banner' ? <ImageIcon className="h-6 w-6" /> : <LinkIcon className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-bold text-sm">{asset.name}</p>
                <a href={asset.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors underline decoration-dotted">View Asset</a>
              </div>
            </div>
            <button onClick={() => deleteAsset(asset.id)} className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 transition-all">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
