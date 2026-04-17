"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import { Loader2, Menu } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2">
             <div className="bg-primary p-1 rounded-lg">
               <Menu className="h-5 w-5 text-primary-foreground" />
             </div>
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
