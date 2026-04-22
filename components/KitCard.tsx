import { ShoppingCart, Zap } from 'lucide-react';
import Link from 'next/link';

interface KitCardProps {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  category: string;
  isNew?: boolean;
}

export default function KitCard({ id: _id, slug, title, description, price, category, isNew }: KitCardProps) {
  // Use slug if available, fallback to id for the link to ensure it's always clickable
  const linkHref = slug ? `/marketplace/${slug}` : `/marketplace/id/${_id}`;

  return (
    <Link 
      href={linkHref} 
      className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:bg-muted/30 hover:shadow-xl hover:-translate-y-1 cursor-pointer block"
    >
      {isNew && (
        <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
          NEW
        </div>
      )}
      
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">{category}</span>
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Zap className="h-4 w-4 fill-primary" />
        </div>
      </div>
      
      <h3 className="mb-2 text-xl font-bold tracking-tight group-hover:text-primary transition-colors">{title}</h3>
      <p className="mb-6 text-sm text-muted-foreground line-clamp-3">{description}</p>
      
      <div className="mt-auto flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Price</span>
          <span className="text-xl font-black">${price}</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-110 active:scale-95">
          <ShoppingCart className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}
