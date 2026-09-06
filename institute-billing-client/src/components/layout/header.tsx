'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  UserPlus,
  Globe,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/axios';

export function Header() {
  const { user, logout } = useAuth();
  const { success } = useToast();

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  const instituteName =
    settingsData?.settings?.institute_name || settingsData?.tenant?.name || 'Nimas Fashion Academy';

  const handleLogout = () => {
    logout();
    success('Logged Out', 'You have been logged out of the admin panel.');
  };

  return (
    <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base text-foreground tracking-tight">
            {instituteName}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            <span>{user?.role || 'Admin'}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/portal" target="_blank">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Globe className="h-3.5 w-3.5 text-sky-500" />
            <span>Public Student Portal</span>
          </Button>
        </Link>

        <Link href="/payments">
          <Button variant="secondary" size="sm" className="gap-2 text-xs">
            <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
            <span>Record Payment</span>
          </Button>
        </Link>

        <Link href="/students/register">
          <Button size="sm" className="gap-2 text-xs shadow-xs">
            <UserPlus className="h-3.5 w-3.5" />
            <span>Register Student</span>
          </Button>
        </Link>

        {/* User Info & Logout Button */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-medium text-foreground leading-none">
              {user?.name || 'Administrator'}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {user?.email || 'admin@nimasfashion.lk'}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            title="Sign out of Admin Panel"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
