import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    
    if (serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Fallback for local development if service account is not provided
      // This will use default credentials if available
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export { admin };
