"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import KitCard from "@/components/KitCard";
import { Sparkles, TrendingUp, Clock, Loader2, Zap, ArrowRight } from "lucide-react";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface Kit {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  category?: string;
  categories?: string[];
  createdAt?: string;
  metadata?: {
    createdAt: string;
  };
  assets?: {
    iconSvgName: string;
  };
  isNew?: boolean;
}

export default function Home() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchKits() {
      try {
        // Fetch all kits and filter for published ones in-memory to ensure 
        // we catch items with different timestamp structures and avoid index issues.
        const q = query(collection(db, "kits"), where("status", "==", "published"));
        const querySnapshot = await getDocs(q);
        const fetchedKits = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Kit));

        // Sort by date (top-level or metadata fallback)
        const sortedKits = fetchedKits.sort((a, b) => {
          const dateA = a.createdAt || a.metadata?.createdAt || "";
          const dateB = b.createdAt || b.metadata?.createdAt || "";
          return dateB.localeCompare(dateA);
        });

        // Limit to 3 for the featured section
        setKits(sortedKits.slice(0, 3));
      } catch (error) {
        console.error("Error fetching kits:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchKits();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <Hero />

        <section className="container max-w-7xl mx-auto px-4 py-20 border-t border-border/40">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-wider uppercase">
                <TrendingUp className="h-4 w-4" />
                <span>Featured Collection</span>
              </div>
              <h2 className="text-4xl font-black tracking-tight">The Marketplace</h2>
              <p className="text-muted-foreground max-w-md">Browse our curated collection of verified knowledge kits.</p>
            </div>

            <Link href="/marketplace">
              <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:scale-[1.02] transition-all shadow-lg shadow-primary/20">
                View All Kits
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 opacity-50">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="font-bold uppercase tracking-tight">Accessing Digital Archives...</p>
              </div>
            ) : kits.length > 0 ? (
              <>
                {kits.map((kit) => (
                  <KitCard key={kit.id} {...kit} />
                ))}

                {/* Custom Request Call to Action */}
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-2xl bg-muted/20 text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Need something custom?</h3>
                  <p className="text-sm text-muted-foreground mb-6">Our team can generate a specialized bundle for any subject. Contact us to request a Custom Kit.</p>
                  <Link href="/marketplace" className="w-full">
                    <button className="w-full py-3 rounded-full bg-foreground text-background font-bold hover:scale-[1.02] transition-transform">
                      Request Custom Kit
                    </button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20">
                <p className="text-muted-foreground font-medium">No results found. Check back soon for new arrivals.</p>
              </div>
            )}
          </div>
        </section>

        {/* Features / Benefits */}
        <section className="bg-muted/30 py-20 border-y border-border/40">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center shadow-sm border border-border/50 text-primary">
                  <Clock className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold">Always Current</h4>
                <p className="text-muted-foreground">Kits are frequently regenerated to ensure insights reflect the latest global data.</p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center shadow-sm border border-border/50 text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold">NotebookLM Ready</h4>
                <p className="text-muted-foreground">Perfectly formatted markdown bundles optimized for NotebookLM&apos;s ingestion engine.</p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center shadow-sm border border-border/50 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold">High Precision</h4>
                <p className="text-muted-foreground">Expert-level system instructions included with every kit to guide AI reasoning.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-border/40 bg-background">
        <div className="container max-w-7xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2026 Notebook Kit. Building Super-Charged NotebookLM Knowledge Kits.</p>
        </div>
      </footer>
    </div>
  );
}