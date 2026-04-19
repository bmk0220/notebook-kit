"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { 
  Hammer, Sparkles, Loader2, CheckCircle2, 
  Download, ShieldAlert, Plus, Trash2, 
  FileText, Youtube, Globe, ChevronRight, ChevronLeft,
  Edit3, Eye, Layers, Settings2, Save
} from 'lucide-react';
import { generateKit, processAndSaveKit, ForgeOutput, Blueprint } from '@/lib/forge';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Source = {
  id: string;
  title: string;
  url: string;
  content: string;
  type: 'html' | 'pdf' | 'youtube' | 'manual';
};

export default function ForgePage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  
  // 1. Wizard State
  const [currentStep, setCurrentStep] = useState(0); // 0: Research, 1: Blueprint, 2: Forging, 3: Review
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // 2. Data State
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [manualContext, setManualContext] = useState('');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [forgeOutput, setForgeOutput] = useState<ForgeOutput | null>(null);
  const [activeTab, setActiveTab] = useState<keyof ForgeOutput['content']>('overview');
  const [previewMode, setPreviewMode] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [saveResult, setSaveResult] = useState<{ kitId: string; downloadUrl: string } | null>(null);

  // Computed Context
  const totalContext = useMemo(() => {
    const sourcesLen = sources.reduce((acc, s) => acc + s.content.length, 0);
    return sourcesLen + manualContext.length;
  }, [sources, manualContext]);

  // Auth guard
  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary/50" /></div>;
  if (!user || !isAdmin) return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="h-20 w-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6"><ShieldAlert className="h-10 w-10 text-destructive" /></div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">Access Restricted</h1>
          <p className="text-muted-foreground text-sm mb-6">The Forge is reserved for administrators only.</p>
          <button onClick={() => router.push('/login')} className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all">Sign In</button>
        </div>
      </div>
    </div>
  );

  // --- ACTIONS ---

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
        setSources(prev => [...prev, {
          id: crypto.randomUUID(),
          title: data.title,
          url: data.source,
          content: data.text,
          type: data.type
        }]);
        setScrapeUrl('');
      } else {
        alert(data.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch source';
      alert(message);
    } finally {
      setIsScraping(false);
    }
  };

  const removeSource = (id: string) => setSources(prev => prev.filter(s => s.id !== id));

  const buildRawContent = () => {
    let content = sources.map(s => `--- ${s.title} ---\n${s.content}`).join('\n\n');
    if (manualContext.trim()) {
      content += `\n\n--- Manual Research ---\n${manualContext}`;
    }
    return content;
  };

  const startBlueprint = async () => {
    if (!topic || !audience || (sources.length === 0 && !manualContext.trim())) return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const result = await generateKit({
        topic,
        audience,
        raw_content: buildRawContent(),
        mode: 'blueprint'
      });
      setBlueprint(result as Blueprint);
      setCurrentStep(1);
      setStatus('idle');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Blueprint generation failed');
      setStatus('error');
    }
  };

  const startForge = async () => {
    if (!blueprint) return;
    setStatus('loading');
    setCurrentStep(2);
    try {
      const result = await generateKit({
        topic,
        audience,
        raw_content: buildRawContent(),
        mode: 'generate',
        blueprint
      });
      setForgeOutput(result as ForgeOutput);
      setCurrentStep(3);
      setStatus('idle');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Forge Engine failed');
      setStatus('error');
    }
  };

  const finalizeKit = async () => {
    if (!forgeOutput || !user) return;
    setStatus('loading');
    try {
      const kitId = crypto.randomUUID();
      const res = await processAndSaveKit(kitId, forgeOutput, user.uid);
      setSaveResult(res);
      setStatus('success');

      if (notificationEmail) {
        await fetch('/api/email', {
          method: 'POST',
          body: JSON.stringify({
            to: notificationEmail,
            subject: `Your Notebook Kit is Ready: ${topic}`,
            text: `View it in your kits collection: ${window.location.origin}/kits`,
          })
        });
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Finalization failed');
      setStatus('error');
    }
  };

  // --- RENDER HELPERS ---

  const renderSteps = () => (
    <div className="flex items-center justify-between mb-8 px-2 max-w-2xl mx-auto overflow-x-auto gap-4 py-2 no-scrollbar">
      {['Research', 'Blueprint', 'Forge', 'Review'].map((label, i) => (
        <div key={label} className="flex items-center gap-2 shrink-0">
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
            currentStep === i ? "bg-primary text-primary-foreground scale-110 shadow-lg" : 
            currentStep > i ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
          )}>
            {currentStep > i ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          <span className={cn("text-[10px] uppercase font-bold tracking-widest", currentStep === i ? "text-foreground" : "text-muted-foreground")}>
            {label}
          </span>
          {i < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground/30" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa]">
      <Header />
      
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-2xl shadow-xl shadow-primary/20">
              <Hammer className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase leading-none">The Forge</h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] mt-2">Knowledge Production Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Context Load</p>
              <p className="text-sm font-black text-primary">{(totalContext / 1000).toFixed(1)}k Chars</p>
            </div>
            <div className="h-10 w-[1px] bg-border mx-2 hidden sm:block" />
            <button 
              onClick={() => router.push('/admin')}
              className="px-4 py-2 rounded-xl border border-border bg-white text-xs font-bold uppercase tracking-wider hover:bg-muted/50 transition-all"
            >
              Exit Studio
            </button>
          </div>
        </div>

        {renderSteps()}

        {/* STAGE 1: RESEARCH HUB */}
        {currentStep === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-border rounded-3xl p-8 shadow-sm">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  RESEARCH INGESTION
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kit Topic</label>
                      <input 
                        value={topic} onChange={e => setTopic(e.target.value)}
                        placeholder="e.g. 2026 Art Grant Guide"
                        className="w-full h-12 rounded-xl bg-muted/30 border border-transparent focus:border-primary/30 focus:bg-white px-4 outline-none transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Audience</label>
                      <input 
                        value={audience} onChange={e => setAudience(e.target.value)}
                        placeholder="e.g. Digital Artists"
                        className="w-full h-12 rounded-xl bg-muted/30 border border-transparent focus:border-primary/30 focus:bg-white px-4 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border/50">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Add Source (URL, PDF, YouTube)</label>
                    <div className="flex gap-2">
                      <input 
                        value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)}
                        placeholder="Paste link here..."
                        className="flex-1 h-12 rounded-xl bg-muted/30 border border-transparent focus:border-primary/30 focus:bg-white px-4 outline-none transition-all font-medium"
                      />
                      <button 
                        onClick={handleScrape} disabled={isScraping || !scrapeUrl}
                        className="h-12 px-6 rounded-xl bg-secondary text-secondary-foreground font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        FETCH
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sources List */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-2">
                  Active Resources ({sources.length})
                </h3>
                {sources.length === 0 ? (
                  <div className="bg-dashed border-2 border-dashed border-border rounded-3xl py-12 flex flex-col items-center justify-center text-muted-foreground/50">
                    <Globe className="h-10 w-10 mb-4 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">No sources added yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {sources.map(source => (
                      <div key={source.id} className="bg-white border border-border rounded-2xl p-4 flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                            source.type === 'youtube' ? "bg-red-50 text-red-500" :
                            source.type === 'pdf' ? "bg-blue-50 text-blue-500" : "bg-primary/5 text-primary"
                          )}>
                            {source.type === 'youtube' ? <Youtube className="h-5 w-5" /> :
                             source.type === 'pdf' ? <FileText className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-sm font-bold truncate">{source.title}</h4>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{source.url}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-2 hidden sm:block">
                            <p className="text-[10px] font-black text-muted-foreground uppercase">{Math.round(source.content.length / 5.5)} Tokens</p>
                          </div>
                          <button 
                            onClick={() => removeSource(source.id)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-primary text-primary-foreground rounded-3xl p-8 shadow-xl shadow-primary/20">
                <h3 className="text-lg font-black uppercase mb-4 tracking-tight">Ready to Blueprint?</h3>
                <p className="text-primary-foreground/70 text-sm font-medium leading-relaxed mb-6">
                  The Engine will analyze your resources to propose a unique angle and section focus points.
                </p>
                <button 
                  onClick={startBlueprint}
                  disabled={!topic || !audience || (sources.length === 0 && !manualContext.trim()) || status === 'loading'}
                  className="w-full h-14 rounded-2xl bg-white text-primary font-black text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-black/10"
                >
                  {status === 'loading' ? <Loader2 className="h-6 w-6 animate-spin" /> : <Settings2 className="h-5 w-5" />}
                  GENERATE BLUEPRINT
                </button>
                {status === 'error' && <p className="mt-4 text-xs font-bold text-red-200 text-center">{errorMessage}</p>}
              </div>

              <div className="bg-white border border-border rounded-3xl p-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Manual Context</h4>
                <textarea 
                  value={manualContext}
                  onChange={e => setManualContext(e.target.value)}
                  placeholder="Paste extra raw research or notes here..."
                  className="w-full h-40 bg-muted/20 border-none rounded-2xl p-4 text-xs font-medium resize-none focus:ring-1 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: BLUEPRINT EDITOR */}
        {currentStep === 1 && blueprint && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white border border-border rounded-3xl p-8 md:p-12 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-primary/10 p-2 rounded-lg"><Settings2 className="h-5 w-5 text-primary" /></div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Blueprint Strategy</h2>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">The Unique Angle</label>
                  <textarea 
                    value={blueprint.angle}
                    onChange={e => setBlueprint({...blueprint, angle: e.target.value})}
                    className="w-full p-6 bg-muted/30 border border-transparent focus:bg-white focus:border-primary/20 rounded-2xl text-lg font-bold leading-snug outline-none transition-all resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(blueprint.sections).map(([key, points]) => (
                    <div key={key} className="bg-muted/20 rounded-2xl p-6 border border-transparent hover:border-border transition-all">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">{key.replace('_', ' ')}</h4>
                      <div className="space-y-3">
                        {points.map((point, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                            <input 
                              value={point}
                              onChange={e => {
                                const newPoints = [...points];
                                newPoints[idx] = e.target.value;
                                setBlueprint({
                                  ...blueprint,
                                  sections: { ...blueprint.sections, [key]: newPoints }
                                });
                              }}
                              className="w-full bg-transparent text-xs font-bold text-muted-foreground outline-none border-b border-transparent focus:border-primary/20 pb-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-8">
                  <button 
                    onClick={() => setCurrentStep(0)}
                    className="px-8 h-14 rounded-2xl border border-border font-black text-sm uppercase tracking-widest hover:bg-muted/50 transition-all flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <button 
                    onClick={startForge}
                    disabled={status === 'loading'}
                    className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-black text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
                  >
                    {status === 'loading' ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    FORGE FULL KIT
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: FORGING ENGINE */}
        {currentStep === 2 && (
          <div className="max-w-xl mx-auto py-20 text-center space-y-8 animate-in zoom-in-95 duration-1000">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
              <div className="relative bg-white p-8 rounded-[40px] shadow-2xl border border-border">
                <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Igniting the Engine</h2>
              <p className="text-muted-foreground font-medium">DeepSeek is synthesizing your research into a professional 8-file kit...</p>
            </div>
            <div className="w-full bg-muted h-3 rounded-full overflow-hidden max-w-sm mx-auto">
              <div className="h-full bg-primary animate-progress-fast" style={{ width: '40%' }} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto pt-4">
              {['Overview', 'Step-by-Step', 'Resources', 'FAQ'].map(f => (
                <div key={f} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                  <div className="h-2 w-2 rounded-full bg-muted animate-pulse" /> {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAGE 4: REVIEWER & REFINER */}
        {currentStep === 3 && forgeOutput && (
          <div className="flex flex-col h-[calc(100vh-280px)] min-h-[600px] animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white border border-border rounded-t-3xl border-b-0 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm z-10">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
                {(Object.keys(forgeOutput.content) as Array<keyof ForgeOutput['content']>).map(key => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                      activeTab === key ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {key.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <button 
                  onClick={() => setPreviewMode(!previewMode)}
                  className={cn(
                    "flex-1 md:flex-none px-4 py-2 rounded-xl border border-border flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all",
                    previewMode ? "bg-secondary text-secondary-foreground" : "bg-white text-foreground"
                  )}
                >
                  {previewMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {previewMode ? 'Edit Mode' : 'Preview'}
                </button>
                <button 
                  onClick={finalizeKit}
                  disabled={status === 'loading'}
                  className="flex-1 md:flex-none px-6 py-2 rounded-xl bg-green-500 text-white flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  TEMPER & ZIP
                </button>
              </div>
            </div>

            <div className="flex-1 bg-white border border-border rounded-b-3xl overflow-hidden shadow-sm flex flex-col">
              {previewMode ? (
                <div className="flex-1 overflow-y-auto p-8 md:p-12 prose prose-indigo max-w-none prose-sm md:prose-base font-medium">
                  {/* Simplified markdown preview */}
                  <div dangerouslySetInnerHTML={{ 
                    __html: forgeOutput.content[activeTab]
                      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-black uppercase tracking-tight mb-6">$1</h1>')
                      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-black uppercase tracking-tight mt-8 mb-4">$1</h2>')
                      .replace(/^\- (.*$)/gim, '<li class="ml-4 mb-2">$1</li>')
                      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }} />
                </div>
              ) : (
                <textarea 
                  value={forgeOutput.content[activeTab]}
                  onChange={e => {
                    setForgeOutput({
                      ...forgeOutput,
                      content: { ...forgeOutput.content, [activeTab]: e.target.value }
                    });
                  }}
                  className="flex-1 w-full p-8 md:p-12 font-mono text-sm leading-relaxed resize-none focus:outline-none bg-muted/5"
                  spellCheck={false}
                />
              )}
            </div>
            
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-3">
                <input 
                  type="email"
                  value={notificationEmail}
                  onChange={e => setNotificationEmail(e.target.value)}
                  placeholder="Notification Email (optional)"
                  className="w-full md:w-64 h-10 px-4 rounded-xl border border-border bg-white text-xs font-medium outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
                * Review all files before final zipping to ensure content accuracy.
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS PANEL */}
        {status === 'success' && saveResult && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] p-8 md:p-12 max-w-md w-full shadow-2xl text-center animate-in zoom-in-95 duration-300">
              <div className="h-24 w-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/30">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-black uppercase mb-2">FORGE COMPLETE</h2>
              <p className="text-muted-foreground font-medium mb-10">Your Professional Knowledge Kit is now indexed and live.</p>
              
              <div className="space-y-3">
                <a 
                  href={saveResult.downloadUrl}
                  className="flex items-center justify-center gap-3 w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
                  target="_blank" rel="noopener noreferrer"
                >
                  <Download className="h-5 w-5" /> Download ZIP
                </a>
                <button 
                  onClick={() => {
                    setCurrentStep(0);
                    setStatus('idle');
                    setForgeOutput(null);
                    setBlueprint(null);
                    setSources([]);
                    setTopic('');
                  }}
                  className="w-full h-14 rounded-2xl border border-border font-black uppercase tracking-widest hover:bg-muted/50 transition-all text-xs"
                >
                  FORGE ANOTHER KIT
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes progress-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        .animate-progress-fast {
          animation: progress-fast 2s infinite linear;
        }
      `}</style>
    </div>
  );
}
