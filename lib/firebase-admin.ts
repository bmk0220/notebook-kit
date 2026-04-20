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
let cachedDb: Firestore | null = null;
let cachedBucket: any | null = null;
let cachedAuth: Auth | null = null;

function getAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FB_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FB_ADMIN_CLIENT_EMAIL;
  // Handle the newline characters in the private key correctly
  const privateKey = process.env.FB_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // Detailed logging for what's missing (only on the server)
    if (typeof window === 'undefined') {
      const missing = [];
      if (!projectId) missing.push('FB_ADMIN_PROJECT_ID');
      if (!clientEmail) missing.push('FB_ADMIN_CLIENT_EMAIL');
      if (!privateKey) missing.push('FB_ADMIN_PRIVATE_KEY');
      
      console.warn(`Firebase Admin: Missing credentials (${missing.join(', ')}).`);
      
      if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: Firebase Admin credentials missing in production environment. Ensure they are set in the Firebase project configuration.');
      }
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
    console.log('Firebase Admin: SDK initialized successfully.');
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
    // Avoid crashing during library inspection or Next.js internals checks
    if (typeof prop === 'symbol' || (typeof prop === 'string' && (prop.startsWith('__') || prop === 'toJSON'))) {
      return undefined;
    }
    
    if (!cachedDb) {
      const app = getAdminApp();
      if (!app) throw new Error('Firebase Admin SDK not initialized. Check your environment variables.');
      cachedDb = getFirestore(app);
    }
    const value = (cachedDb as any)[prop];
    if (typeof value === 'function') {
      return value.bind(cachedDb);
    }
    return value;
  }
});

export const adminStorage = new Proxy({} as any, {
  get(_target, prop) {
    if (typeof prop === 'symbol' || (typeof prop === 'string' && (prop.startsWith('__') || prop === 'toJSON'))) {
      return undefined;
    }

    if (!cachedBucket) {
      const app = getAdminApp();
      if (!app) throw new Error('Firebase Admin SDK not initialized. Check your environment variables.');
      cachedBucket = getStorage(app).bucket();
    }
    const value = (cachedBucket as any)[prop];
    if (typeof value === 'function') {
      return value.bind(cachedBucket);
    }
    return value;
  }
});

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (typeof prop === 'symbol' || (typeof prop === 'string' && (prop.startsWith('__') || prop === 'toJSON'))) {
      return undefined;
    }

    if (!cachedAuth) {
      const app = getAdminApp();
      if (!app) throw new Error('Firebase Admin SDK not initialized. Check your environment variables.');
      cachedAuth = getAuth(app);
    }
    const value = (cachedAuth as any)[prop];
    if (typeof value === 'function') {
      return value.bind(cachedAuth);
    }
    return value;
  }
});
