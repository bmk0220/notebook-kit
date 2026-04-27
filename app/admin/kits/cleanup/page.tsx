"use client";

import React, { useState } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { Loader2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OrphanCleanupPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  const handleCleanup = async () => {
    if (!confirm("Are you sure? This will permanently delete orphaned user_kits records and their associated ZIP files from Storage.")) return;
    
    setLoading(true);
    setLogs([]);
    setIsDone(false);

    try {
      addLog("Fetching all user_kits records...");
      const userKitsSnap = await getDocs(collection(db, "user_kits"));
      
      const orphanedRecords: any[] = [];
      const uniqueOrphanedKitIds = new Set<string>();
      
      // Step 1: Identify Orphans
      for (const ukDoc of userKitsSnap.docs) {
        const data = ukDoc.data();
        const kitId = data.kitId;
        
        if (!kitId) continue;

        // Check if the actual kit document still exists
        const kitRef = doc(db, "kits", kitId);
        const kitSnap = await getDoc(kitRef);
        
        if (!kitSnap.exists()) {
          orphanedRecords.push({ docId: ukDoc.id, kitId: kitId, slug: data.slug });
          uniqueOrphanedKitIds.add(JSON.stringify({ kitId: kitId, slug: data.slug }));
        }
      }

      addLog(`Found ${orphanedRecords.length} orphaned user_kits records pointing to missing kits.`);
      
      // Step 2: Delete Orphaned user_kits records
      if (orphanedRecords.length > 0) {
        addLog("Deleting orphaned user_kits records...");
        const batch = writeBatch(db);
        orphanedRecords.forEach(record => {
          batch.delete(doc(db, "user_kits", record.docId));
        });
        await batch.commit();
        addLog("✅ Deleted orphaned user_kits records.");
      }

      // Step 3: Delete Orphaned Storage Files
      const uniqueKitArr = Array.from(uniqueOrphanedKitIds).map(str => JSON.parse(str));
      if (uniqueKitArr.length > 0) {
        addLog(`Attempting to clean up ${uniqueKitArr.length} orphaned .zip files in Storage...`);
        for (const orphan of uniqueKitArr) {
          const storagePath = `kits/${orphan.kitId}/${orphan.slug}.zip`;
          const fileRef = ref(storage, storagePath);
          try {
            await deleteObject(fileRef);
            addLog(`✅ Deleted storage file: ${storagePath}`);
          } catch (e: any) {
            // Error code storage/object-not-found is common if it was already deleted
            if (e.code === 'storage/object-not-found') {
              addLog(`⚠️ File already missing, skipped: ${storagePath}`);
            } else {
              addLog(`❌ Failed to delete storage file ${storagePath}: ${e.message}`);
            }
          }
        }
      }

      addLog("🎉 Cleanup process complete!");
      setIsDone(true);
    } catch (err: any) {
      console.error(err);
      addLog(`❌ Fatal Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-12 max-w-4xl mx-auto">
      <div className="card bg-card border border-border p-8 shadow-xl">
        <h1 className="text-3xl font-black flex items-center gap-3 mb-2 text-foreground">
          <Trash2 className="text-red-500" /> Orphaned Data Cleanup
        </h1>
        <p className="text-muted-foreground mb-8">
          This tool scans the database for users who own kits that no longer exist (because they were deleted using an older cached version of the dashboard). It will remove the broken database records and clean up the left-over ZIP files in Firebase Storage.
        </p>

        <button 
          onClick={handleCleanup}
          disabled={loading}
          className="btn btn-error text-white font-bold h-12 px-8 mb-8"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
          {loading ? "Scanning & Cleaning..." : "Run Orphan Cleanup"}
        </button>

        {logs.length > 0 && (
          <div className="bg-black text-green-400 p-6 rounded-xl font-mono text-sm h-96 overflow-y-auto shadow-inner space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap">{log}</div>
            ))}
            {isDone && (
              <div className="mt-4 pt-4 border-t border-green-900 text-green-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> All clean! You can now close this page.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
