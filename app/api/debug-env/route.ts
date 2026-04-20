import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    projectId: process.env.FB_ADMIN_PROJECT_ID ? 'Set' : 'Missing',
    clientEmail: process.env.FB_ADMIN_CLIENT_EMAIL ? 'Set' : 'Missing',
    privateKey: process.env.FB_ADMIN_PRIVATE_KEY ? 'Set (Length: ' + process.env.FB_ADMIN_PRIVATE_KEY.length + ')' : 'Missing',
    nodeEnv: process.env.NODE_ENV,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'Set' : 'Missing',
  };

  return NextResponse.json(envVars);
}
