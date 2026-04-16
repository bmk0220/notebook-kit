"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NotebookIcon, Search, LogIn, LogOut, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { user, loading, isAdmin, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between mx-auto px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary p-1.5 rounded-lg shadow-sm">
              <NotebookIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Notebook <span className="text-primary italic">Kit</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 ml-10 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-primary">Marketplace</Link>
            {isAdmin && (
              <Link href="/forge" className="transition-colors hover:text-primary underline decoration-primary underline-offset-4 decoration-2 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                The Forge
              </Link>
            )}
            {user && (
              <Link href="/library" className="transition-colors hover:text-primary font-bold">My Library</Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Kits..."
              className="h-10 w-64 rounded-full border border-input bg-muted/30 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all focus:w-80"
            />
          </div>

          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                {isAdmin && (
                  <span className="bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Admin
                  </span>
                )}
                <span className="truncate max-w-[140px]">{user.email}</span>
              </div>
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="flex items-center gap-2 h-9 px-4 rounded-full border border-border bg-muted/20 hover:bg-muted/50 font-semibold text-xs transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              id="login-btn"
              href="/login"
              className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
