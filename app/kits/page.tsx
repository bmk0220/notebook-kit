"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, BookOpen, Clock, Loader2, Lock, Sparkles } from 'lucide-react';
import { collection, query, orderBy, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';

interface Kit {
  id: string;
  title: string;
  createdAt: any;
  fileUrl: string;
  userId: string;
  slug: string;
}

export default function LibraryPage() {
  const { user } = useAuth();
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchMyLibrary() {
      try {
        const q = query(
          collection(db, "user_kits"),
          where("userId", "==", user!.uid),
          orderBy("grantedAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        
        const kitPromises = querySnapshot.docs.map(async (accessDoc) => {
          const accessData = accessDoc.data();
          const kitRef = doc(db, "kits", accessData.kitId);
          const kitSnap = await getDoc(kitRef);
          
          if (kitSnap.exists()) {
            const data = kitSnap.data();
            return {
              id: kitSnap.id,
              ...data,
              fileUrl: data.assets?.fileUrl || "",
              slug: data.slug || ""
            } as Kit;
          }
          return null;
        });

        const fetchedKits = (await Promise.all(kitPromises)).filter(k => k !== null) as Kit[];
        setKits(fetchedKits);
      } catch (error) {
        console.error("Error fetching library:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMyLibrary();
  }, [user]);

  return (
    <DashboardLayout requiredRole="user">
      <main className="p-4 md:p-8">
        <PageHeader 
          title="My Kits" 
          subtitle="Your personal collection of specialized Notebook Kits."
          icon={BookOpen}
          actions={
            <Link 
              href="/kits/custom"
              className="h-12 px-6 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              Request Custom Kit
            </Link>
          }
        />

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 opacity-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-bold uppercase tracking-widest text-sm text-muted-foreground animate-pulse">Opening Vault...</p>
          </div>
        ) : kits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {kits.map((kit) => (
              <div key={kit.id} className="group p-6 rounded-3xl border border-border bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase bg-muted/50 px-3 py-1.5 rounded-full tracking-wider border border-border/50">
                    <Clock className="h-3 w-3" />
                    {(kit.createdAt as { toDate?: () => Date })?.toDate
                      ? (kit.createdAt as { toDate: () => Date }).toDate().toLocaleDateString()
                      : 'Recent'}
                  </div>
                </div>

                <h3 className="text-xl font-black mb-2 group-hover:text-primary transition-colors leading-tight">{kit.title}</h3>
                <p className="text-xs text-muted-foreground font-medium mb-6 line-clamp-2">Premium specialized kit for Google NotebookLM research and data orchestration.</p>

                <div className="mt-auto flex items-center gap-3">
                  <a
                    href={kit.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-all active:scale-95"
                  >
                    <Download className="h-4 w-4" />
                    Download Kit
                  </a>
                  <Link 
                    href={`/marketplace/${kit.slug}`}
                    className="flex items-center justify-center h-12 px-5 rounded-2xl border border-border bg-card font-bold text-xs hover:bg-muted/50 transition-all active:scale-95"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center rounded-[3rem] border-2 border-dashed border-border bg-muted/10 animate-in zoom-in-95 duration-500">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <Lock className="h-10 w-10 text-muted-foreground opacity-20" />
            </div>
            <p className="text-xl font-black uppercase tracking-tight">Your library is empty.</p>
            <p className="text-sm text-muted-foreground font-medium mt-2 max-w-xs mx-auto">Kits purchased or assigned will appear here automatically.</p>
            <Link 
              href="/marketplace" 
              className="mt-8 inline-flex items-center gap-2 text-primary font-bold hover:underline"
            >
              Browse Marketplace →
            </Link>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
