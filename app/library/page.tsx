"use client";

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Download, BookOpen, Clock, Loader2 } from 'lucide-react';
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Kit {
  id: string;
  title: string;
  createdAt: any;
  fileUrl: string;
}

export default function LibraryPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyKits() {
      try {
        // In a real app, we'd filter by user ID. 
        // For the MVP demonstration, we fetch all generated kits.
        const q = query(collection(db, "kits"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedKits = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Kit[];
        setKits(fetchedKits);
      } catch (error) {
        console.error("Error fetching library:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMyKits();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">My Library</h1>
          <p className="text-muted-foreground font-medium underline decoration-primary decoration-4 underline-offset-4">Your collection of forged knowledge.</p>
        </div>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 opacity-50">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="font-bold uppercase tracking-widest text-sm">Opening Vault...</p>
          </div>
        ) : kits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kits.map((kit) => (
              <div key={kit.id} className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase bg-muted/50 px-3 py-1 rounded-full">
                    <Clock className="h-3 w-3" />
                    {kit.createdAt?.toDate ? kit.createdAt.toDate().toLocaleDateString() : 'Recent'}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-4">{kit.title}</h3>
                
                <div className="flex items-center gap-3">
                  <a 
                    href={kit.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    <Download className="h-4 w-4" />
                    Download ZIP
                  </a>
                  <button className="h-11 px-4 rounded-xl border border-border bg-muted/20 font-bold text-xs hover:bg-muted/50 transition-all">
                    View Contents
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center rounded-3xl border-2 border-dashed border-border bg-muted/20">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">You haven&apos;t purchased any kits yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
