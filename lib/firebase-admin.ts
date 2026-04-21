import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App | null = null;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Production environment configuration
  // The secret is stored with escaped newlines (\\n). We need to unescape them.
  let privateKey = process.env.FB_ADMIN_PRIVATE_KEY;
  if (privateKey) {
    // If the key is wrapped in quotes or has escaped characters, clean it
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');
  }

  const serviceAccount = {
    projectId: process.env.FB_ADMIN_PROJECT_ID,
    clientEmail: process.env.FB_ADMIN_CLIENT_EMAIL,
    privateKey: privateKey,
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebase Admin SDK missing required environment variables.');
  }

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  
  return adminApp;
}

export const adminDb = getFirestore(getAdminApp());
export const adminStorage = getStorage(getAdminApp()).bucket();
export const adminAuth = getAuth(getAdminApp());
