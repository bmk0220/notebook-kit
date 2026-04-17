"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Hammer, Sparkles, Loader2, CheckCircle2, AlertCircle, Download, ExternalLink, ShieldAlert } from 'lucide-react';
import { generateKit, processAndSaveKit, ForgeOutput } from '@/lib/forge';
import { useAuth } from '@/context/AuthContext';

export default function ForgePage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  
  const [status, setStatus] = useState<'idle' | 'generating' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<{ kitId: string; downloadUrl: string } | null>(null);

  const handleScrape = async () => {
    if (!scrapeUrl) return;
    setIsScraping(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl })
      });
      const data = await res.json();
      if (data.success) {
        setRawContent(prev => prev + `\n\n--- Source: ${scrapeUrl} ---\n` + data.text);
        setScrapeUrl('');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to scrape URL');
    } finally {
      setIsScraping(false);
    }
  };

  // Auth guard — show spinner while resolving, deny access to non-admins
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="h-20 w-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">Access Restricted</h1>
            <p className="text-muted-foreground text-sm mb-6">
              The Forge is reserved for administrators only. Please sign in with an authorized account.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleForge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !audience) return;

    setStatus('generating');
    setErrorMessage('');
    
    try {
      // 1. Generate AI Content
      const output = await generateKit({ 
        topic, 
        audience, 
        raw_content: rawContent
      });
      
      setStatus('saving');
      
      // 2. Process Files, Zip, and Save to Firebase
      const kitId = crypto.randomUUID();
      const saveResult = await processAndSaveKit(kitId, output, user!.uid);
      
      setResult(saveResult);
      setStatus('success');

      // 4. Send Notification Email if provided
      if (notificationEmail) {
        try {
          await fetch('/api/email', {
            method: 'POST',
            body: JSON.stringify({
              to: notificationEmail,
              subject: `Your Notebook Kit is Ready: ${topic}`,
              text: `Hello! Your knowledge kit for "${topic}" has been forged and is ready for download. \n\nView it in your library: ${window.location.origin}/library`,
              html: `
                <div style="font-family: sans-serif; padding: 20px;">
                  <h2 style="color: #6366f1;">Your Kit is Ready!</h2>
                  <p>The Forge has completed the knowledge bundle for: <strong>${topic}</strong></p>
                  <p>Target Audience: ${audience}</p>
                  <a href="${window.location.origin}/library" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; rounded: 8px;">View in Library</a>
                </div>
              `
            })
          });
        } catch (err) {
          console.error('Failed to send notification email', err);
        }
      }    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An unexpected error occurred during the forge.');
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <Hammer className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">The Forge</h1>
            <p className="text-muted-foreground text-sm font-medium tracking-wide">Generate Pro Knowledge Kits Instantly</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <form onSubmit={handleForge} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Topic / Domain</label>
                  <input 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. 2026 Art Grant Guide" 
                    className="w-full h-12 rounded-xl border border-input bg-muted/30 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Target Audience</label>
                  <input 
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. Professional Digital Artists" 
                    className="w-full h-12 rounded-xl border border-input bg-muted/30 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Notification Email</label>
                  <input 
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="Where should we send the kit link? (Optional)" 
                    className="w-full rounded-xl border border-input bg-muted/30 p-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Manual Research & Resources</label>
                    <div className="flex gap-2">
                      <input 
                        type="url"
                        value={scrapeUrl}
                        onChange={(e) => setScrapeUrl(e.target.value)}
                        placeholder="Paste a URL to fetch source text..."
                        className="flex-1 rounded-lg border border-input bg-muted/20 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button 
                        onClick={handleScrape}
                        disabled={isScraping || !scrapeUrl}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-bold uppercase hover:bg-secondary/80 disabled:opacity-50 transition-all"
                      >
                        {isScraping ? 'Fetching...' : 'Fetch Text'}
                      </button>
                    </div>
                  </div>
                  
                  <textarea 
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                    placeholder="Paste URLs, source text, or raw research data here. The Forge will synthesize this into your Kit." 
                    className="w-full h-64 rounded-xl border border-input bg-muted/30 p-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none font-mono text-xs"
                  />
                </div>

                <button 
                  disabled={status !== 'idle' && status !== 'success' && status !== 'error'}
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {status === 'generating' || status === 'saving' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5 fill-primary-foreground" />
                  )}
                  {status === 'generating' ? 'IGNITING ENGINE...' : 
                   status === 'saving' ? 'TEMPERING ZIP...' : 
                   'FORGE KIT'}
                </button>
              </form>
            </div>
          </div>

          {/* Status / Output Panel */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden relative">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Forge Output</h2>
              
              {status === 'idle' && (
                <div className="py-12 flex flex-col items-center justify-center opacity-40">
                  <Hammer className="h-12 w-12 mb-4" />
                  <p className="text-xs font-bold px-8 text-center">Engine is cold. <br /> Fill in details to start forge.</p>
                </div>
              )}

              {(status === 'generating' || status === 'saving') && (
                <div className="space-y-6 py-6 animate-in fade-in duration-500">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-bold uppercase tracking-tight">AI Reasoning...</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-50">
                    <div className="h-5 w-5 rounded-full border-2 border-primary/20" />
                    <span className="text-sm font-bold uppercase tracking-tight">Bundling Files...</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full bg-primary transition-all duration-1000 ${status === 'saving' ? 'w-2/3' : 'w-1/3 animate-pulse'}`} />
                  </div>
                </div>
              )}

              {status === 'success' && result && (
                <div className="space-y-6 py-4 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-center h-20 w-20 bg-green-500/10 rounded-full mx-auto text-green-500">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold">Forge Complete</h3>
                    <p className="text-xs text-muted-foreground mt-1">Your kit is indexed and live.</p>
                  </div>
                  <div className="space-y-3">
                    <a 
                      href={result.downloadUrl} 
                      className="flex items-center justify-between w-full p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold">Download ZIP</span>
                      </div>
                      <ExternalLink className="h-4 w-4 opacity-50" />
                    </a>
                  </div>
                  <button 
                    onClick={() => setStatus('idle')}
                    className="w-full py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forge Another?
                  </button>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-4 py-8 text-center animate-in shake duration-500">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                  <p className="text-sm font-bold text-destructive">{errorMessage}</p>
                  <button 
                    onClick={() => setStatus('idle')}
                    className="px-6 py-2 rounded-full bg-muted text-xs font-bold"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Cost Optimization</h3>
              <p className="text-[11px] leading-relaxed text-primary/80 font-medium">
                Generating this kit using <span className="font-bold">DeepSeek-V3</span> will cost approximately <span className="font-bold underline">$0.005</span>. 
                Manual research input significantly improves accuracy while keeping costs flat.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
