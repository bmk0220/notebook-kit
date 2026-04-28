"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { Download, BookOpen, Clock, Loader2, Lock, Sparkles } from 'lucide-react';
import { collection, query, orderBy, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface Kit {
  id: string;
  title: string;
  createdAt: any;
  fileUrl: string;
  userId: string;
  slug: string;
}

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!user) return;

    async function fetchMyLibrary() {
      try {
        // 1. Query the 'user_kits' table to see what the user has access to
        const q = query(
          collection(db, "user_kits"),
          where("userId", "==", user!.uid),
          orderBy("grantedAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        
        // 2. Fetch the actual kit data for each access record
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
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 container max-w-5xl mx-auto px-4 py-12">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-foreground">My Kits</h1>
            <p className="text-muted-foreground font-medium underline decoration-primary decoration-4 underline-offset-4">
              Your personal collection of specialized Notebook Kits.
            </p>
          </div>
          <Link 
            href="/kits/custom"
            className="h-12 px-6 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Request Custom Kit
          </Link>
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
                    {(kit.createdAt as { toDate?: () => Date })?.toDate
                      ? (kit.createdAt as { toDate: () => Date }).toDate().toLocaleDateString()
                      : 'Recent'}
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
                    Download Kit
                  </a>
                  <Link 
                    href={`/marketplace/${kit.slug}`}
                    className="flex items-center justify-center h-11 px-6 rounded-xl border border-border bg-muted/20 font-bold text-xs hover:bg-muted/50 transition-all"
                  >
                    View Kit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center rounded-3xl border-2 border-dashed border-border bg-muted/20">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">Your library is empty.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Kits purchased or assigned will appear here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
