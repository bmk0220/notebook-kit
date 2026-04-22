import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { Download } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function KitPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Fetch Kit by slug
  const kitsRef = collection(db, "kits");
  const q = query(kitsRef, where("slug", "==", slug));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    notFound();
  }

  const validDoc = querySnapshot.docs.find(doc => {
    const d = doc.data();
    return d && d.title && d.slug && d.fileUrl;
  });

  if (!validDoc) {
    console.error("PDP: No valid kit found for slug:", slug, querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    notFound();
  }

  const data = validDoc.data();

  const kit = { 
    id: validDoc.id, 
    title: String(data.title),
    description: String(data.description || "No description provided."),
    price: Number(data.price || 49),
    fileUrl: String(data.fileUrl),
    slug: String(data.slug),
  };

  // 2. Fetch Content
  let content: any = {};
  try {
    const contentRef = doc(db, "kits_content", kit.id);
    const contentSnap = await getDoc(contentRef);
    if (contentSnap.exists()) {
      content = contentSnap.data();
    }
  } catch (err) {
    console.error("PDP CONTENT FETCH ERROR:", err);
    // We fall back to an empty object to prevent render crashes
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <main className="container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-black mb-4">{kit.title}</h1>
        <p className="text-xl text-muted-foreground mb-8">{kit.description}</p>
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border mb-8">
          <h2 className="text-2xl font-bold mb-4">What&apos;s Inside</h2>
          {content ? (
            <div className="space-y-6">
              {Object.entries(content).map(([key, value]) => {
                if (key === 'updatedAt') return null;
                return (
                  <div key={key}>
                    <h3 className="font-bold capitalize">{key.replace('_', ' ')}</h3>
                    <div className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>Content preview unavailable.</p>
          )}
        </div>

        {kit.fileUrl ? (
          <a 
            href={kit.fileUrl} 
            download
            className="w-full h-14 bg-primary text-white font-bold rounded-2xl hover:opacity-90 flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all"
          >
            <Download className="h-6 w-6" />
            DOWNLOAD KIT ZIP
          </a>
        ) : (
          <div className="p-4 bg-muted text-center rounded-2xl font-bold text-muted-foreground">
            Download currently unavailable for this kit.
          </div>
        )}
      </main>
    </div>
  );
}
