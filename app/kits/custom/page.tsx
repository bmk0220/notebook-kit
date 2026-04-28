"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import { 
  Send, 
  Sparkles, 
  Layout, 
  Target, 
  ListTodo, 
  Link as LinkIcon, 
  Loader2,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function CustomRequestPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    topic: "",
    description: "",
    purpose: "",
    outcome: "",
    references: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "requests"), {
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting request:", err);
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted/10 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user && !authLoading) {
    router.push("/login");
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted/10 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border p-10 rounded-[2.5rem] shadow-2xl text-center space-y-6">
            <div className="bg-green-500/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Request Received!</h1>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Your custom kit request has been submitted successfully. Our team will review it and get back to you soon.
            </p>
            <div className="pt-4">
              <Link 
                href="/kits"
                className="inline-flex items-center gap-2 h-12 px-8 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all"
              >
                Back to Library
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/10">
      <Header />
      <main className="container max-w-4xl mx-auto py-12 px-4">
        <div className="mb-10 space-y-4">
          <Link 
            href="/kits" 
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Library
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none">
                Custom <span className="text-primary italic">Kit</span> Request
              </h1>
              <p className="text-muted-foreground font-medium mt-2">
                Need something specific? Tell us what you're looking for and we'll build it.
              </p>
            </div>
            <div className="hidden md:block">
               <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                    Premium<br />Assistance
                  </div>
               </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 bg-card border border-border p-8 rounded-3xl shadow-sm space-y-6">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                <Layout className="h-3.5 w-3.5 text-primary" />
                Topic or Subject
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Advanced Financial Modeling for SaaS"
                className="w-full h-14 bg-muted/30 border border-border rounded-xl px-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Detailed Description
              </label>
              <textarea
                required
                rows={4}
                placeholder="Explain the scope and specific requirements of the kit..."
                className="w-full bg-muted/30 border border-border rounded-xl p-4 font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Goals & Outcome */}
          <div className="bg-card border border-border p-8 rounded-3xl shadow-sm space-y-6">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                <Target className="h-3.5 w-3.5 text-primary" />
                Purpose / Goal
              </label>
              <textarea
                rows={3}
                placeholder="What is the main objective of this kit?"
                className="w-full bg-muted/30 border border-border rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-card border border-border p-8 rounded-3xl shadow-sm space-y-6">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                <ListTodo className="h-3.5 w-3.5 text-primary" />
                Desired Outcome
              </label>
              <textarea
                rows={3}
                placeholder="What should the user be able to achieve?"
                className="w-full bg-muted/30 border border-border rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              />
            </div>
          </div>

          {/* References */}
          <div className="md:col-span-2 bg-card border border-border p-8 rounded-3xl shadow-sm space-y-4">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
              <LinkIcon className="h-3.5 w-3.5 text-primary" />
              Reference Links (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. YouTube videos, documentation, or articles..."
              className="w-full h-14 bg-muted/30 border border-border rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              value={formData.references}
              onChange={(e) => setFormData({ ...formData, references: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight italic">
              Separate multiple links with commas.
            </p>
          </div>

          <div className="md:col-span-2 pt-4">
            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full h-16 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl hover:opacity-90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
