import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notFound } from "next/navigation";
import Header from "@/components/Header";

interface Kit {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  category: string;
}

export default async function KitPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  // 1. Fetch Kit by slug
  const kitsRef = collection(db, "kits");
  const q = query(kitsRef, where("slug", "==", slug));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    notFound();
  }

  const kitDoc = querySnapshot.docs[0];
  const kit = { id: kitDoc.id, ...kitDoc.data() } as Kit;

  // 2. Fetch Content
  const contentRef = doc(db, "kits_content", kit.id);
  const contentSnap = await getDoc(contentRef);
  const content = contentSnap.exists() ? contentSnap.data() : null;

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
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{value as string}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>Content preview unavailable.</p>
          )}
        </div>

        <button className="w-full h-14 bg-primary text-white font-bold rounded-2xl hover:opacity-90">
          Purchase Kit - ${kit.price}
        </button>
      </main>
    </div>
  );
}
