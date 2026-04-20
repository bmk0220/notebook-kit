import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';

// Initialize the Admin SDK if it hasn't been initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS!, 'utf8')
  );

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

// Access services
const adminDb = getFirestore();
const adminStorage = getStorage().bucket();
const adminAuth = getAuth();

export { adminDb, adminStorage, adminAuth };
