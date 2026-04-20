import { NextResponse } from 'next/server';
import { publishKit } from '@/lib/forge';

export async function POST(req: Request) {
  try {
    // 1. Validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { kitId, metadata, content, userId } = body;
    
    if (!metadata || !content || !userId) {
      return NextResponse.json({ error: 'Missing required kit data' }, { status: 400 });
    }

    // 2. Check for required environment variables before calling the library
    const requiredEnv = ['FB_ADMIN_PROJECT_ID', 'FB_ADMIN_CLIENT_EMAIL', 'FB_ADMIN_PRIVATE_KEY'];
    const missing = requiredEnv.filter(name => !process.env[name]);
    
    if (missing.length > 0) {
      console.error(`Missing Environment Variables: ${missing.join(', ')}`);
      return NextResponse.json({ 
        error: `Server Configuration Error: Missing ${missing.join(', ')}. Please check the Firebase console.`,
        success: false 
      }, { status: 500 });
    }

    // 3. Perform publishing
    const result = await publishKit(kitId, metadata, content, userId);
    
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error('Publishing error:', error);
    const message = error instanceof Error ? error.message : 'Failed to publish kit';
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
