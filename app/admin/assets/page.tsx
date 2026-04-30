"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Loader2, Plus, Trash2, Link as LinkIcon, Image as ImageIcon } from "lucide-react";

export default function AssetManagement() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAsset, setNewAsset] = useState({ name: "", type: "banner", url: "" });

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    const snapshot = await getDocs(collection(db, "marketing_assets"));
    setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tighter">Creative Asset Vault</h1>
      </header>

      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold">Add New Asset</h2>
        <div className="flex gap-4">
          <input className="flex-1 px-4 py-2 bg-muted rounded-lg" placeholder="Asset Name" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} />
          <select className="px-4 py-2 bg-muted rounded-lg" value={newAsset.type} onChange={e => setNewAsset({...newAsset, type: e.target.value})}>
            <option value="banner">Banner</option>
            <option value="swipe">Swipe Copy</option>
          </select>
          <input className="flex-1 px-4 py-2 bg-muted rounded-lg" placeholder="External URL" value={newAsset.url} onChange={e => setNewAsset({...newAsset, url: e.target.value})} />
          <button onClick={addAsset} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map(asset => (
          <div key={asset.id} className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              {asset.type === 'banner' ? <ImageIcon className="h-5 w-5 text-primary" /> : <LinkIcon className="h-5 w-5 text-primary" />}
              <div>
                <p className="font-bold">{asset.name}</p>
                <a href={asset.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline">View Asset</a>
              </div>
            </div>
            <button onClick={() => deleteAsset(asset.id)} className="text-destructive p-2 rounded-lg hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
