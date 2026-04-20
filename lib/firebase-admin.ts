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

  // If manual credentials are provided, use them (best for local dev)
  if (projectId && clientEmail && privateKey) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      }, 'manual'); // Named instance to avoid conflict
      console.log('Firebase Admin: Initialized with manual credentials.');
      return adminApp;
    } catch (error) {
      console.error('Firebase Admin: Manual initialization failed:', error);
    }
  }

  // Fallback: Default initialization (best for production/Cloud environment)
  try {
    adminApp = initializeApp({
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('Firebase Admin: Initialized with default Cloud credentials.');
    return adminApp;
  } catch (error) {
    console.error('Firebase Admin: Default initialization failed:', error);
    return null;
  }
}

/**
 * Exported services as Proxies.
 */
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (typeof prop === 'symbol' || (typeof prop === 'string' && (prop.startsWith('__') || prop === 'toJSON'))) {
      return undefined;
    }
    
    if (!cachedDb) {
      const app = getAdminApp();
      if (!app) throw new Error('Firebase Admin SDK not initialized. No credentials available.');
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
      if (!app) throw new Error('Firebase Admin SDK not initialized. No credentials available.');
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
      if (!app) throw new Error('Firebase Admin SDK not initialized. No credentials available.');
      cachedAuth = getAuth(app);
    }
    const value = (cachedAuth as any)[prop];
    if (typeof value === 'function') {
      return value.bind(cachedAuth);
    }
    return value;
  }
});
