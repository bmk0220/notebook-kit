import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { createNotebookZip } from "./zip";

export type KitContent = {
  main_source: string;
  overview: string;
  key_concepts: string;
  step_by_step: string;
  resources: string;
  faq: string;
  checklists: string;
  tips: string;
  system_instructions: string;
};

export type KitMetadata = {
  title: string;
  slug: string;
  description: string;
};

/**
 * Saves the Kit data to Firestore and uploads the Zipped content to Firebase Storage.
 */
export async function publishKit(kitId: string, metadata: KitMetadata, content: KitContent, userId: string) {
  const files = [
    { title: '00_Main_Source', content: content.main_source },
    { title: '01_Overview', content: content.overview },
    { title: '02_Key_Concepts', content: content.key_concepts },
    { title: '03_Step_by_Step', content: content.step_by_step },
    { title: '04_Resources', content: content.resources },
    { title: '05_FAQ', content: content.faq },
    { title: '06_Checklists', content: content.checklists },
    { title: '07_Tips', content: content.tips },
    { title: '08_System_Instructions', content: content.system_instructions },
  ];

  const zipBlob = await createNotebookZip(files);

  const storagePath = `kits/${kitId}/${metadata.slug}.zip`;
  const storageRef = ref(storage, storagePath);
  try {
    await uploadBytes(storageRef, zipBlob);
  } catch (error: unknown) {
    console.error('Firebase Storage Upload Failed:', error);
    throw error;
  }
  const downloadUrl = await getDownloadURL(storageRef);

  try {
    await setDoc(doc(db, "kits", kitId), {
      ...metadata,
      price: 49,
      category: "general",
      status: "published",
      fileUrl: downloadUrl,
      userId: userId,
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, "kits_content", kitId), {
      ...content,
      updatedAt: serverTimestamp(),
    });
  } catch (error: unknown) {
    console.error('Firebase Firestore Write Failed:', error);
    throw new Error('Database write failed. Check server logs.');
  }

  return { kitId, downloadUrl };
  }