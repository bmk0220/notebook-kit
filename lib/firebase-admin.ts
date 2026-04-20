import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth, Auth } from 'firebase-admin/auth';

/**
 * Professional Lazy Initialization Pattern
 * 
 * This ensures the Admin SDK is ONLY initialized at runtime on the server,
 * preventing 'Missing Project ID' errors during the Next.js build process.
 */
let adminApp: App | null = null;

function getAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FB_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FB_ADMIN_CLIENT_EMAIL;
  // Handle the newline characters in the private key correctly
  const privateKey = process.env.FB_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // Only log warning during runtime, keep quiet during build unless accessed
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      console.warn('Firebase Admin: Missing credentials. This is expected during build but check your env vars if this happens at runtime.');
    }
    return null;
  }

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    return adminApp;
  } catch (error) {
    console.error('Firebase Admin: Initialization failed:', error);
    return null;
  }
}

/**
 * Exported services as Proxies.
 * These will trigger initialization only when a property (like .collection or .file) is accessed.
 */
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    const app = getAdminApp();
    if (!app) throw new Error('Firebase Admin SDK not initialized. Check your environment variables.');
    const db = getFirestore(app);
    return (db as any)[prop];
  }
});

export const adminStorage = new Proxy({} as any, {
  get(_target, prop) {
    const app = getAdminApp();
    if (!app) throw new Error('Firebase Admin SDK not initialized. Check your environment variables.');
    const bucket = getStorage(app).bucket();
    return (bucket as any)[prop];
  }
});

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    const app = getAdminApp();
    if (!app) throw new Error('Firebase Admin SDK not initialized. Check your environment variables.');
    const auth = getAuth(app);
    return (auth as any)[prop];
  }
});
