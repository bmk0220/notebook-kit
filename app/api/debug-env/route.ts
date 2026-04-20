import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'Server is alive',
    time: new Date().toISOString(),
    node_version: process.version
  });
}
