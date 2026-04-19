import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';

// Dynamic import of pdf-parse to avoid build-time issues
async function parsePdf(buffer: Buffer) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse');
  return await pdfParse(buffer);
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let cleanText = '';
    let title = 'Unknown Source';
    let type: 'html' | 'pdf' | 'youtube' = 'html';

    // 1. Detect Source Type
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isPDF = url.toLowerCase().endsWith('.pdf');

    if (isYouTube) {
      type = 'youtube';
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(url);
        cleanText = transcript.map(t => t.text).join(' ');
        title = `YouTube Transcript: ${url}`;
      } catch (err) {
        console.error('YouTube Fetch Error:', err);
        throw new Error('Could not fetch YouTube transcript. Ensure the video has captions enabled.');
      }
    } else if (isPDF) {
      type = 'pdf';
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      const buffer = await response.arrayBuffer();
      const data = await parsePdf(Buffer.from(buffer));
      cleanText = data.text;
      title = url.split('/').pop() || 'PDF Document';
    } else {
      // Default: HTML Scraping
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $('script, style, nav, footer, header, noscript').remove();

      title = $('title').text() || url;
      const mainContent = $('main, article').length > 0 
        ? $('main, article').text() 
        : $('body').text();

      cleanText = mainContent
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Common Text Cleanup
    cleanText = cleanText.substring(0, 20000); // Limit to 20k chars for prompt efficiency

    return NextResponse.json({ 
      success: true, 
      text: cleanText,
      title: title.trim(),
      type: type,
      source: url 
    });
  } catch (error: unknown) {
    console.error('Scrape error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
