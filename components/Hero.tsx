import { Sparkles, ShoppingCart, MessageSquarePlus } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-x-0 top-0 h-96 -z-10 bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-50" />

      <div className="container max-w-7xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Sparkles className="h-4 w-4" />
          <span>The Next Generation of NotebookLM Support</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Curate Your Content into <br />
          <span className="text-primary italic">Notebook Ready</span> Kits
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          The curated marketplace for high-performance NotebookLM sources.
          Discover and collect custom knowledge kits for any subject in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/marketplace">
            <button className="h-12 px-8 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5" />
              Request a Kit
            </button>
          </Link>
          <Link href="/marketplace">
            <button className="h-12 px-8 rounded-full border border-border bg-background/50 backdrop-blur font-bold text-lg hover:bg-muted/50 transition-all flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Explore Marketplace
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
