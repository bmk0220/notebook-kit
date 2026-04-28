"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
  className?: string;
  href?: string;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  trendType = "neutral",
  className,
  href
}: StatsCardProps) {
  const content = (
    <div className={cn("h-full p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter",
            trendType === "up" ? "bg-green-500/10 text-green-600" : 
            trendType === "down" ? "bg-red-500/10 text-red-600" : 
            "bg-muted text-muted-foreground"
          )}>
            {trendType === "up" ? <TrendingUp className="h-3 w-3" /> : 
             trendType === "down" ? <TrendingDown className="h-3 w-3" /> : null}
            {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">{label}</h3>
        <p className="text-3xl font-black mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full group">{content}</Link>;
  }

  return content;
}
