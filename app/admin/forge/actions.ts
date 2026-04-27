'use server';

import { db, storage } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { kitSchema, type Kit } from '@/lib/schemas/kit';
import JSZip from 'jszip';
import { FORGE_REQUIRED_FILES } from '@/lib/constants/forge';

export async function ingestKit(data: any) {
  try {
    // 1. Re-validate on the server (Critical for security)
    const result = kitSchema.safeParse(data);
    if (!result.success) {
      return { 
        success: false, 
        error: 'Validation failed on server.', 
        details: result.error.format() 
      };
    }

    const kit = result.data;
    const kitId = kit.id;

    // 2. Create the ZIP bundle
    const zip = new JSZip();
    const folder = zip.folder(kit.slug);
    
    if (!folder) throw new Error("Failed to create zip folder");

    // Add all mandatory markdown files to the zip
    Object.entries(kit.content).forEach(([id, content]) => {
      const fileMeta = FORGE_REQUIRED_FILES.find(f => f.id === id);
      if (fileMeta) {
        folder.file(fileMeta.filename, content);
      }
    });

    // Generate the zip as a buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // 3. Upload ZIP to Firebase Storage
    const storagePath = `kits/${kitId}/${kit.slug}.zip`;
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, zipBuffer, {
      contentType: 'application/zip',
      customMetadata: {
        kitId: kitId,
        version: kit.metadata.version
      }
    });

    const downloadUrl = await getDownloadURL(storageRef);

    // 4. Update the Kit object with the final storage URL
    const finalKit: Kit = {
      ...kit,
      assets: {
        ...kit.assets,
        fileUrl: downloadUrl
      },
      status: 'published' // Promote to published upon successful ingestion
    };

    // 5. Write to Firestore (New 'kits' collection)
    await setDoc(doc(db, 'kits', kitId), finalKit);

    return { 
      success: true, 
      kitId: kitId, 
      url: `/kits/${kit.slug}` 
    };

  } catch (error: any) {
    console.error('Forge Ingestion Error:', error);
    return { 
      success: false, 
      error: error.message || 'Internal Server Error' 
    };
  }
}
