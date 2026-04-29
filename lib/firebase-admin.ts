import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (saVar) {
      console.log('Initializing Firebase Admin with Service Account...');
      const serviceAccount = JSON.parse(saVar);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully with Service Account.');
    } else {
      console.log('FIREBASE_SERVICE_ACCOUNT not found, falling back to applicationDefault...');
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.log('Firebase Admin initialized with default credentials.');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Firebase admin initialization error:', errorMessage);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export { admin };
