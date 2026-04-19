"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Hammer, Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { KitContent, KitMetadata } from '@/lib/forge';

export default function ForgePage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [metadata, setMetadata] = useState<KitMetadata>({ title: '', slug: '', description: '' });
  const [content, setContent] = useState<KitContent>({
    overview: '', key_concepts: '', step_by_step: '', resources: '',
    faq: '', checklists: '', tips: '', system_instructions: ''
  });

  const [status, setStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary/50" /></div>;
  if (!user || !isAdmin) return <div className="p-12 text-center text-destructive">Access Restricted</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('publishing');
    try {
      const res = await fetch('/api/kit/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitId: crypto.randomUUID(), metadata, content, userId: user.uid })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setStatus('success');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Publishing failed');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <main className="container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
          <Hammer className="h-8 w-8 text-primary" /> KIT PUBLISHER
        </h1>
        
        {status === 'success' ? (
          <div className="bg-white p-12 rounded-3xl shadow-sm border text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Kit Published Successfully!</h2>
            <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-primary text-white rounded-xl">Publish Another</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="font-bold mb-4">Kit Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Title" className="p-3 border rounded-xl" onChange={e => setMetadata({...metadata, title: e.target.value})} />
                <input required placeholder="Slug" className="p-3 border rounded-xl" onChange={e => setMetadata({...metadata, slug: e.target.value})} />
              </div>
              <textarea required placeholder="Description" className="w-full mt-4 p-3 border rounded-xl" onChange={e => setMetadata({...metadata, description: e.target.value})} />
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="font-bold mb-4">Content Components (Markdown)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(content) as Array<keyof KitContent>).map(key => (
                  <textarea 
                    key={key} 
                    required
                    placeholder={key.replace('_', ' ').toUpperCase()}
                    className="p-3 border rounded-xl h-32 font-mono text-xs"
                    onChange={e => setContent({...content, [key]: e.target.value})}
                  />
                ))}
              </div>
            </section>

            {status === 'error' && <p className="text-red-500 font-bold flex items-center gap-2"><AlertCircle /> {errorMessage}</p>}
            
            <button 
              disabled={status === 'publishing'}
              className="w-full h-14 bg-primary text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === 'publishing' ? <Loader2 className="animate-spin h-6 w-6" /> : <Save className="h-5 w-5" />}
              PUBLISH KIT
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
