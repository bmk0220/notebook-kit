"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import KitCard from "@/components/KitCard";
import { TrendingUp, Loader2, Sparkles, Search, Filter } from "lucide-react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Kit {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  isNew?: boolean;
}

const CATEGORIES = ["All", "Business", "Technology", "Education", "Health", "Lifestyle"];

export default function MarketplacePage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    async function fetchKits() {
      try {
        const q = query(collection(db, "kits"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedKits = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Kit[];
        setKits(fetchedKits);
      } catch (error) {
        console.error("Error fetching kits:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchKits();
  }, []);

  const filteredKits = kits.filter(kit => {
    const matchesSearch = kit.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         kit.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || kit.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 bg-muted/10">
        {/* Marketplace Header */}
        <section className="bg-background border-b border-border/40 py-8 md:py-16">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
              <div className="space-y-3 md:space-y-4 max-w-2xl text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold uppercase tracking-wider">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Verified Knowledge Kits</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight">The Marketplace</h1>
                <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">
                  Discover curated, high-performance NotebookLM sources. 
                  Every kit is optimized for precision and immediate ingestion.
                </p>
              </div>

              {/* Search Bar */}
              <div className="w-full max-w-md relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  placeholder="Search the collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 md:h-14 pl-12 pr-4 rounded-2xl border border-border bg-background shadow-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Filters and Grid */}
        <section className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
            
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-64 space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Categories</span>
                </div>
                {/* Horizontal scroll on mobile, vertical on desktop */}
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:overflow-visible no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap shrink-0 ${
                        selectedCategory === cat 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                        : "bg-background border border-border hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden lg:block p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
                <Sparkles className="h-8 w-8 text-primary" />
                <h3 className="font-bold text-lg">Custom Request?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Need a specific subject not listed here? Our team can generate a specialized bundle for you.
                </p>
                <button className="w-full py-2.5 rounded-xl bg-foreground text-background text-xs font-black uppercase hover:opacity-90 transition-opacity">
                  Request a Kit
                </button>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-lg md:text-xl font-bold">
                  {selectedCategory === "All" ? "Latest Arrivals" : selectedCategory}
                  <span className="ml-2 text-xs md:text-sm font-medium text-muted-foreground">({filteredKits.length})</span>
                </h2>
                <select className="bg-transparent border-none text-xs md:text-sm font-bold text-muted-foreground outline-none cursor-pointer hover:text-foreground">
                  <option>Newest</option>
                  <option>Price: Low-High</option>
                  <option>Price: High-Low</option>
                </select>
              </div>

              {loading ? (
                <div className="py-24 md:py-32 flex flex-col items-center justify-center gap-4 opacity-50">
                  <Loader2 className="h-8 w-8 md:h-10 md:w-10 animate-spin text-primary" />
                  <p className="font-bold uppercase tracking-widest text-xs">Opening Vault...</p>
                </div>
              ) : filteredKits.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6 md:gap-8">
                  {filteredKits.map((kit) => (
                    <KitCard key={kit.id} {...kit} />
                  ))}
                </div>
              ) : (
                <div className="py-24 md:py-32 text-center rounded-3xl border-2 border-dashed border-border bg-background/50 px-6">
                  <p className="text-muted-foreground font-medium mb-4">No kits match your current filters.</p>
                  <button 
                    onClick={() => {setSelectedCategory("All"); setSearchQuery("");}}
                    className="text-primary font-bold hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 md:py-12 border-t border-border/40 bg-background">
        <div className="container max-w-7xl mx-auto px-4 text-center text-muted-foreground text-xs md:text-sm">
          <p>© 2026 Notebook Kit Platform. Built for the future of knowledge.</p>
        </div>
      </footer>
    </div>
  );
}
