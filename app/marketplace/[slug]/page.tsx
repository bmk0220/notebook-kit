"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";
import { Download, Loader2, AlertCircle } from "lucide-react";
import PurchaseControl from "@/components/marketplace/PurchaseControl";
import { KIT_ICONS, KIT_CATEGORIES } from "@/lib/constants/forge";
import ReactMarkdown from "react-markdown";

interface Kit {
  id: string;
  title: string;
  description: string;
  price: number;
  slug: string;
  fileUrl: string;
  iconSvgName: string;
  categories: string[];
  manifest: string[];
}

export default function KitPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [kit, setKit] = useState<Kit | null>(null);
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKitData() {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Kit by slug
        const kitsRef = collection(db, "kits");
        const q = query(kitsRef, where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("NOT_FOUND");
          setLoading(false);
          return;
        }

        const validDoc = querySnapshot.docs[0];
        const data = validDoc.data();

        const fetchedKit: Kit = {
          id: validDoc.id,
          title: String(data.title),
          description: String(data.description || "No description provided."),
          price: Number(data.price || 49),
          fileUrl: String(data.assets?.fileUrl || ""),
          slug: String(data.slug),
          iconSvgName: String(data.assets?.iconSvgName || "Package"),
          categories: (data.categories as string[]) || [],
          manifest: (data.manifest as string[]) || [],
        };

        setKit(fetchedKit);

        // 2. Optional: Fetch Content (Only works if owner/admin)
        try {
          const contentRef = doc(db, "kits_content", validDoc.id);
          const contentSnap = await getDoc(contentRef);
          if (contentSnap.exists()) {
            setContent(contentSnap.data());
          }
        } catch (err) {
          console.warn("Public user access to kits_content blocked - falling back to manifest.");
        }

      } catch (err: any) {
        console.error("PDP Fetch Error:", err);
        setError("ACCESS_DENIED");
      } finally {
        setLoading(false);
      }
    }

    fetchKitData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/10 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">
            Loading Knowledge Kit...
          </p>
        </div>
      </div>
    );
  }

  if (error === "NOT_FOUND") {
    notFound();
    return null;
  }

  if (error || !kit) {
    return (
      <div className="min-h-screen bg-muted/10 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div className="bg-card border border-border p-8 rounded-3xl max-w-md shadow-xl">
            <div className="bg-red-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-black mb-2">Access Error</h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We encountered a problem accessing this kit. This could be due to restricted permissions or a connectivity issue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all"
            >
              Try Again
            </button>
            <a href="/marketplace" className="block mt-4 text-sm font-bold text-primary hover:underline">
              Back to Marketplace
            </a>
          </div>
        </div>
      </div>
    );
  }

  const primaryCategoryName = kit.categories.length > 0 ? kit.categories[0] : "General";
  const categoryConfig = KIT_CATEGORIES[primaryCategoryName as keyof typeof KIT_CATEGORIES] || {
    color: '#6b7280',
    bgLight: 'rgba(107, 114, 128, 0.1)',
  };

  const RawIcon = KIT_ICONS[kit.iconSvgName] || Download;
  const IconComponent = (RawIcon && (typeof RawIcon === 'function' || (typeof RawIcon === 'object' && RawIcon.$$typeof)))
    ? RawIcon
    : Download;

  return (
    <div className="min-h-screen bg-muted/10">
      <Header />
      <main className="container max-w-5xl mx-auto py-12 px-4">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left Column: Info & Action */}
          <div className="flex-1 space-y-12">
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                {/* Hero Icon Container */}
                <div className="relative shrink-0">
                  <div
                    className="absolute inset-0 blur-3xl opacity-20 rounded-full"
                    style={{ backgroundColor: categoryConfig.color }}
                  />
                  <div
                    className="relative w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-sm"
                    style={{ backgroundColor: categoryConfig.bgLight }}
                  >
                    <IconComponent
                      className="h-12 w-12 md:h-16 md:w-16 drop-shadow-lg"
                      style={{ color: categoryConfig.color }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {kit.categories.map(cat => (
                      <span
                        key={cat}
                        className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
                        style={{
                          backgroundColor: categoryConfig.bgLight,
                          color: categoryConfig.color,
                          borderColor: `${categoryConfig.color}20`
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9]">
                    {kit.title}
                  </h1>
                </div>
              </div>

              <div className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium markdown-content">
                <ReactMarkdown>{kit.description}</ReactMarkdown>
              </div>
            </div>

            <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Kit Manifest</h2>
              {content ? (
                <div className="grid grid-cols-1 gap-4">
                  {Object.keys(content).filter(k => k !== 'updatedAt').map((key) => (
                    <div key={key} className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm font-bold capitalize">{key.replace('_', ' ')}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground uppercase font-bold">Included</span>
                    </div>
                  ))}
                </div>
              ) : kit.manifest && kit.manifest.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {kit.manifest.map((filename) => (
                    <div key={filename} className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm font-bold">{filename}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground uppercase font-bold">Included</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Content manifest temporarily unavailable.</p>
              )}
            </div>
          </div>

          {/* Right Column: Pricing & Download */}
          <div className="w-full md:w-80">
            <div className="sticky top-24 space-y-6">
              <div className="bg-card p-8 rounded-3xl border border-border shadow-xl">
                <div className="space-y-1 mb-6">
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Ownership Price</span>
                  <div className="text-4xl font-black">${kit.price}</div>
                </div>

                <PurchaseControl
                  kitId={kit.id}
                  kitSlug={kit.slug}
                  price={kit.price}
                  fileUrl={kit.fileUrl}
                />

                <p className="text-[10px] text-center text-muted-foreground leading-tight mt-4">
                  Optimized for NotebookLM.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <h4 className="text-xs font-bold uppercase mb-2">Instructions</h4>
                <div className="text-[11px] text-muted-foreground italic">
                  {(content && content.instructions) || "Check the INSTRUCTIONS.md file included in the ZIP for detailed setup guides."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
