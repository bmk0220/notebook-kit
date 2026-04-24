import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { Download } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
};

import { KIT_ICONS } from "@/lib/constants/forge";

export default async function KitPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Fetch Kit by slug
  let querySnapshot;
  try {
    const kitsRef = collection(db, "kits");
    const q = query(kitsRef, where("slug", "==", slug));
    querySnapshot = await getDocs(q);
  } catch (err: any) {
    console.error("PDP FETCH ERROR:", err);
    // If we can't even query the kit, it's likely a permission or network issue
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10 p-4 text-center">
        <div className="card bg-card border border-border p-8 max-w-md shadow-xl">
          <h1 className="text-2xl font-bold text-error mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You do not have permission to view this kit, or the database is currently unreachable.</p>
          <a href="/marketplace" className="btn btn-primary">Return to Marketplace</a>
        </div>
      </div>
    );
  }

  if (querySnapshot.empty) {
    notFound();
  }

  const validDoc = querySnapshot.docs[0];
  const data = validDoc.data();

  const kit = { 
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

  // 2. Fetch Content (Optional for manifest display if manifest field is present)
  let content: any = null;
  if (!kit.manifest || kit.manifest.length === 0) {
    try {
      const contentRef = doc(db, "kits_content", kit.id);
      const contentSnap = await getDoc(contentRef);
      if (contentSnap.exists()) {
        content = contentSnap.data();
      }
    } catch (err) {
      console.warn("PDP CONTENT FETCH BLOCKED (Expected for public users):", err);
    }
  }
  
  // Safe Icon Resolver
  const RawIcon = KIT_ICONS[kit.iconSvgName] || Download;
  // Ensure the icon is a valid React component to avoid "Objects are not valid as a React child"
  const IconComponent = (RawIcon && (typeof RawIcon === 'function' || (typeof RawIcon === 'object' && RawIcon.$$typeof))) 
    ? RawIcon 
    : Download;

  return (
    <div className="min-h-screen bg-muted/10">
      <Header />
      <main className="container max-w-5xl mx-auto py-12 px-4">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left Column: Info & Action */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {kit.categories.map(cat => (
                  <span key={cat} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    {cat}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl text-primary-foreground shadow-lg shadow-primary/20">
                  <IconComponent className="h-8 w-8" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">{kit.title}</h1>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">{kit.description}</p>
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
                
                {kit.fileUrl ? (
                  <a 
                    href={kit.fileUrl} 
                    download
                    className="w-full h-14 bg-foreground text-background font-black rounded-2xl hover:opacity-90 flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 mb-4"
                  >
                    <Download className="h-5 w-5" />
                    DOWNLOAD NOW
                  </a>
                ) : (
                  <div className="p-4 bg-muted text-center rounded-2xl font-bold text-muted-foreground mb-4">
                    Processing Asset...
                  </div>
                )}
                
                <p className="text-[10px] text-center text-muted-foreground leading-tight">
                  Deterministic Build. Optimized for immediate NotebookLM ingestion.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <h4 className="text-xs font-bold uppercase mb-2">Instructions</h4>
                <div className="text-[11px] text-muted-foreground line-clamp-4 overflow-hidden italic">
                  {content.instructions || "Check the INSTRUCTIONS.md file included in the ZIP for detailed setup guides."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
