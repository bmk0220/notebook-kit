import { ShoppingCart, Notebook } from 'lucide-react';
import Link from 'next/link';
import { KIT_ICONS, KIT_CATEGORIES } from '@/lib/constants/forge';

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
  // Resolve category-based styles
  const primaryCategoryName = categories && categories.length > 0 ? categories[0] : "General";
  const categoryConfig = KIT_CATEGORIES[primaryCategoryName as keyof typeof KIT_CATEGORIES] || {
    color: '#6b7280', // gray-500 default
    bgLight: 'rgba(107, 114, 128, 0.1)',
  };

  // Resolve icon component
  const IconComponent = (assets?.iconSvgName && KIT_ICONS[assets.iconSvgName]) || Notebook;

  // Clean description for snippet (strip markdown)
  const cleanDescription = description
    .replace(/[#*`_~[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  // Enforce slug-based routing only. If slug is missing, the card should not be a navigation element.
  if (!slug) {
    return (
      <div className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 opacity-60 grayscale cursor-not-allowed">
        <div className="flex gap-4 mb-4">
           <div 
            className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: categoryConfig.bgLight }}
           >
            <IconComponent className="h-6 w-6" style={{ color: categoryConfig.color }} />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{primaryCategoryName}</span>
            <h3 className="text-lg font-bold tracking-tight text-muted-foreground line-clamp-1">{title} (Draft)</h3>
          </div>
        </div>
        <p className="mb-6 text-sm text-muted-foreground line-clamp-2">{cleanDescription}</p>
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
      className="group relative flex flex-col rounded-3xl border border-border bg-card p-6 transition-all hover:bg-muted/30 hover:shadow-xl hover:-translate-y-1 cursor-pointer block"
    >
      {isNew && (
        <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-sm animate-pulse z-10">
          NEW
        </div>
      )}
      
      <div className="flex gap-4 mb-6">
        <div 
          className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
          style={{ backgroundColor: categoryConfig.bgLight }}
        >
          <IconComponent className="h-7 w-7" style={{ color: categoryConfig.color }} />
        </div>
        <div className="space-y-1 flex-1 min-w-0">
          <span 
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: categoryConfig.color }}
          >
            {primaryCategoryName}
          </span>
          <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {title}
          </h3>
        </div>
      </div>
      
      <p className="mb-6 text-sm text-muted-foreground line-clamp-3 leading-relaxed">{cleanDescription}</p>
      
      <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Ownership Price</span>
          <span className="text-2xl font-black">${price}</span>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background transition-all hover:scale-110 active:scale-95 shadow-lg group-hover:bg-primary group-hover:text-primary-foreground">
          <ShoppingCart className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}
