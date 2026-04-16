import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, header').remove();

    // Extract text from main body or article if possible
    const mainContent = $('main, article').length > 0 
      ? $('main, article').text() 
      : $('body').text();

    const cleanText = mainContent
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000); // Limit to 15k chars for prompt efficiency

    return NextResponse.json({ 
      success: true, 
      text: cleanText,
      source: url 
    });
  } catch (error: any) {
    console.error('Scrape error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
