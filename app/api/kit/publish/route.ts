import { NextResponse } from 'next/server';
import { publishKit } from '@/lib/forge';

export async function POST(req: Request) {
  try {
    const { kitId, metadata, content, userId } = await req.json();
    
    if (!metadata || !content || !userId) {
      return NextResponse.json({ error: 'Missing required kit data' }, { status: 400 });
    }

    const result = await publishKit(kitId, metadata, content, userId);
    
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error('Publishing error:', error);
    const message = error instanceof Error ? error.message : 'Failed to publish kit';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
