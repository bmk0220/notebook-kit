"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Hammer, 
  Users, 
  Settings, 
  MessageSquare, 
  BookOpen, 
  LogOut,
  NotebookIcon,
  ChevronRight,
  Tags,
  CreditCard,
  Briefcase,
  ImageIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils'; // I will check if this exists or create it

export default function Sidebar({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { user, logout, isAdmin, isPartner } = useAuth();

  const handleLinkClick = () => {
    if (onLinkClick) onLinkClick();
  };

  const menuGroups = [
    {
      title: "Main",
      links: [
        { name: "Dashboard", href: isAdmin ? "/admin" : "/partner", icon: LayoutDashboard },
        ...(isAdmin ? [{ name: "Analytics", href: "/admin/analytics", icon: BookOpen, disabled: true }] : []),
      ]
    },
    ...(isAdmin ? [{
      title: "Forge Engine",
      links: [
        { name: "The Forge", href: "/admin/forge", icon: Hammer },
        { name: "Custom Requests", href: "/admin/requests", icon: MessageSquare },
      ]
    },
    {
      title: "System",
      links: [
        { name: "Manage Kits", href: "/admin/kits", icon: NotebookIcon },
        { name: "Categories", href: "/admin/categories", icon: Tags },
        { name: "Payments", href: "/admin/payments", icon: CreditCard },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Partners", href: "/admin/partners", icon: Briefcase },
        { name: "Marketing", href: "/admin/assets", icon: ImageIcon },
        { name: "Settings", href: "/admin/settings", icon: Settings, disabled: true },
        ]
        }] : []),
        // Partnership Section (Visible to everyone)
        {
        title: "Partnership",
        links: [
        { name: "Partner Program", href: "/partner", icon: Briefcase },
        ...(isAdmin ? [
          { name: "Partner Requests", href: "/admin/partners/requests", icon: Users },
          { name: "Payout Requests", href: "/admin/payouts", icon: CreditCard }
        ] : []),
        ]
        }
        ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-full overflow-y-auto">
      {/* Logo Section */}
      <div className="p-6 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg shadow-sm">
            <NotebookIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Admin <span className="text-primary italic">Panel</span></span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-8">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.disabled ? '#' : link.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      link.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-primary")} />
                      {link.name}
                    </div>
                    {!isActive && !link.disabled && (
                      <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border/50 bg-muted/20">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
            {user?.email?.[0].toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{user?.email}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{isAdmin ? 'Administrator' : isPartner ? 'Partner' : 'User'}</p>
          </div>
        </div>
        <button 
          onClick={() => logout()}
          className="w-full mt-2 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
