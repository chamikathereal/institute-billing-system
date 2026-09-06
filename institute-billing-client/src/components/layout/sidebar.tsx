'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  FileText,
  GraduationCap,
  Percent,
  BarChart3,
  Settings,
  Globe,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/axios';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/students/register', label: 'Register Student', icon: UserPlus },
  { href: '/payments', label: 'Record Payment', icon: CreditCard },
  { href: '/invoices', label: 'Invoices & Receipts', icon: FileText },
  { href: '/courses', label: 'Courses & Schemes', icon: GraduationCap },
  { href: '/discounts', label: 'Discounts Engine', icon: Percent },
  { href: '/reports', label: 'Billing Reports', icon: BarChart3 },
  { href: '/settings', label: 'Institute Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  const instituteName =
    settingsData?.settings?.institute_name || settingsData?.tenant?.name || 'Nimas Fashion Academy';
  const tagline =
    settingsData?.settings?.institute_tagline || settingsData?.tenant?.tagline || 'Institute Billing System';
  const logoUrl = settingsData?.tenant?.logoUrl;

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-xl flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/20 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md shrink-0">
            {instituteName.charAt(0)}
          </div>
        )}
        <div className="overflow-hidden">
          <h1 className="font-bold text-sm tracking-tight truncate text-foreground" title={instituteName}>
            {instituteName}
          </h1>
          <p className="text-[11px] text-muted-foreground truncate">{tagline}</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Public Access
        </div>
        <Link
          href="/portal"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all group border border-dashed border-border"
        >
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-sky-500 shrink-0 group-hover:scale-110 transition-transform" />
            <span>Student Portal</span>
          </div>
          <span className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded font-mono">
            No Pass
          </span>
        </Link>
      </div>

      {/* Tenant / Multi-tenant Badge footer */}
      <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">SaaS Active</span>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">v1.0</span>
      </div>
    </aside>
  );
}
