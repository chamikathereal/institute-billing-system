'use client';

import * as React from 'react';
import QueryProvider from '@/components/providers/query-provider';
import { ToastProvider } from '@/components/ui/toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryProvider>
  );
}
