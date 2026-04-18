"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import { Loader2, Menu, X } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
            Authenticating Admin...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative w-72 h-full bg-card shadow-2xl animate-in slide-in-from-left duration-300 border-r border-border">
            <Sidebar onLinkClick={() => setIsSidebarOpen(false)} />
            <button 
              className="absolute top-4 right-[-50px] bg-background border border-border p-2 rounded-lg shadow-lg text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2">
             <button 
              className="bg-primary p-1.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
              onClick={() => setIsSidebarOpen(true)}
             >
               <Menu className="h-5 w-5 text-primary-foreground" />
             </button>
             <span className="font-bold tracking-tight">Admin <span className="text-primary italic">Panel</span></span>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold border border-primary/20">
            {user.email?.[0].toUpperCase()}
          </div>
        </header>

        <div className="flex-1">
          {children}
        </div>

        <footer className="py-6 px-8 border-t border-border/40 bg-muted/10 text-center lg:text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Notebook Kit SaaS Engine © 2026 • v0.1.0-alpha
          </p>
        </footer>
      </main>
    </div>
  );
}
