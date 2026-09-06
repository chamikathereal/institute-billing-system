'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  UserPlus,
  Globe,
  Bell,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/axios';

export function Header() {
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  const instituteName =
    settingsData?.settings?.institute_name || settingsData?.tenant?.name || 'Nimas Fashion Academy';

  return (
    <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base text-foreground tracking-tight">
            {instituteName}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
            Billing Admin
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
      </div>
    </header>
  );
}
