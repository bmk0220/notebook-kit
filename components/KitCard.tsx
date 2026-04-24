import { ShoppingCart, Zap } from 'lucide-react';
import Link from 'next/link';
import { KIT_ICONS } from '@/lib/constants/forge';

interface KitCardProps {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  categories?: string[];
  assets?: {
    iconSvgName: string;
  };
  isNew?: boolean;
}

export default function KitCard({ id: _id, slug, title, description, price, categories, assets, isNew }: KitCardProps) {
  // Resolve icon component
  const IconComponent = assets?.iconSvgName && KIT_ICONS[assets.iconSvgName] ? KIT_ICONS[assets.iconSvgName] : Zap;
  const primaryCategory = categories && categories.length > 0 ? categories[0] : "General";

  // Enforce slug-based routing only. If slug is missing, the card should not be a navigation element.
  if (!slug) {
    return (
      <div className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 opacity-60 grayscale cursor-not-allowed">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{primaryCategory}</span>
          <div className="rounded-full bg-muted p-2 text-muted-foreground">
            <IconComponent className="h-4 w-4" />
          </div>
        </div>
        <h3 className="mb-2 text-xl font-bold tracking-tight text-muted-foreground">{title} (Unpublished)</h3>
        <p className="mb-6 text-sm text-muted-foreground line-clamp-3">{description}</p>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xl font-black text-muted-foreground">${price}</span>
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link 
      href={`/marketplace/${slug}`} 
      className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:bg-muted/30 hover:shadow-xl hover:-translate-y-1 cursor-pointer block"
    >
      {isNew && (
        <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
          NEW
        </div>
      )}
      
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">{primaryCategory}</span>
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <IconComponent className="h-4 w-4 fill-primary" />
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
