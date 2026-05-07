import * as admin from 'firebase-admin';

function loadServiceAccount(): admin.ServiceAccount | null {
  const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saVar) {
    try {
      return JSON.parse(saVar);
    } catch {
      console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
    }
  }

  const projectId = process.env.FB_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FB_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FB_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

function getApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const serviceAccount = loadServiceAccount();

  if (serviceAccount) {
    try {
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized with Service Account.');
      return app;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Firebase Admin Service Account init failed:', errorMessage);
      console.warn(
        'Check your FB_ADMIN_PRIVATE_KEY in .env.local — it may be split across lines. ' +
        'Put the entire key on ONE line with \\n as literal escape sequences.'
      );
    }
  }

  // Fallback
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  console.log('Falling back to applicationDefault credentials...');
  const app = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  console.log('Firebase Admin initialized with default credentials.');
  return app;
}

// Lazy getters — initialization only happens on first access, not at import time
export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    return Reflect.get(admin.firestore(getApp()), prop);
  },
});

export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop) {
    return Reflect.get(admin.auth(getApp()), prop);
  },
});

export const adminStorage = new Proxy({} as admin.storage.Storage, {
  get(_target, prop) {
    return Reflect.get(admin.storage(getApp()), prop);
  },
});

export { admin };
