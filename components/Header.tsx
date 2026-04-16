import Link from 'next/link';
import { NotebookIcon, Search, User } from 'lucide-react';

export default function Header() {
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
            <Link href="/forge" className="transition-colors hover:text-primary underline decoration-primary underline-offset-4 decoration-2">The Forge</Link>
            <Link href="/library" className="transition-colors hover:text-primary font-bold">My Library</Link>
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
          <button className="p-2 rounded-full hover:bg-muted/50 transition-colors">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
