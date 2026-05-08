import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8", className)}>
      <div className="flex items-start gap-4">
        {/* The "Red Icon" the user mentioned - often a square with an icon inside */}
        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 shrink-0 mt-1">
          {Icon ? <Icon className="h-6 w-6" /> : <div className="h-3 w-3 rounded-full bg-white animate-pulse" />}
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-none">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground font-medium mt-2 text-sm max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
