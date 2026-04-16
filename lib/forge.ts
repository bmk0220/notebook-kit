import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { createNotebookZip } from "./zip";

export type ForgeInput = {
  topic: string;
  audience: string;
  raw_content?: string;
  useSearch?: boolean;
};

export type ForgeOutput = {
  title: string;
  slug: string;
  description: string;
  content: {
    overview: string;
    key_concepts: string;
    step_by_step: string;
    resources: string;
    faq: string;
    checklists: string;
    tips: string;
    system_instructions: string;
  };
};

/**
 * Placeholder for AI generation. 
 * In a real implementation, this would call an API route that interacts with OpenRouter.
 */
export async function generateKit(input: ForgeInput): Promise<ForgeOutput> {
  const response = await fetch('/api/forge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to generate Kit');
  }

  return await response.json();
}

/**
 * Saves the Kit data to Firestore and uploads the Zipped content to Firebase Storage.
 */
export async function processAndSaveKit(kitId: string, output: ForgeOutput) {
  // 1. Prepare files for ZIP
  const files = [
    { title: '01_Overview', content: output.content.overview },
    { title: '02_Key_Concepts', content: output.content.key_concepts },
    { title: '03_Step_by_Step', content: output.content.step_by_step },
    { title: '04_Resources', content: output.content.resources },
    { title: '05_FAQ', content: output.content.faq },
    { title: '06_Checklists', content: output.content.checklists },
    { title: '07_Tips', content: output.content.tips },
    { title: '08_System_Instructions', content: output.content.system_instructions },
  ];

  // 2. Create ZIP
  const zipBlob = await createNotebookZip(files);

  // 3. Upload to Firebase Storage
  const storagePath = `kits/${kitId}/${output.slug}.zip`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, zipBlob);
  const downloadUrl = await getDownloadURL(storageRef);

  // 4. Update Firestore
  await setDoc(doc(db, "kits", kitId), {
    title: output.title,
    slug: output.slug,
    description: output.description,
    price: 49, // Default price
    category: "general",
    status: "published",
    fileUrl: downloadUrl,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "kits_content", kitId), {
    ...output.content,
    updatedAt: serverTimestamp(),
  });

  return { kitId, downloadUrl };
}