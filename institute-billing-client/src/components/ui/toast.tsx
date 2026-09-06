'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'sms';
}

interface ToastContextType {
  toast: (msg: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  sms: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    ({ title, description, type = 'info' }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const success = React.useCallback(
    (title: string, description?: string) => toast({ title, description, type: 'success' }),
    [toast]
  );

  const error = React.useCallback(
    (title: string, description?: string) => toast({ title, description, type: 'error' }),
    [toast]
  );

  const sms = React.useCallback(
    (title: string, description?: string) => toast({ title, description, type: 'sms' }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, sms }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200',
              t.type === 'success' && 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100',
              t.type === 'error' && 'bg-rose-950/90 border-rose-500/30 text-rose-100',
              t.type === 'sms' && 'bg-indigo-950/90 border-indigo-500/30 text-indigo-100',
              (!t.type || t.type === 'info') && 'bg-card/95 border-border text-foreground'
            )}
          >
            {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />}
            {t.type === 'sms' && <MessageSquare className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />}
            {(!t.type || t.type === 'info') && <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />}

            <div className="flex-1 text-sm">
              <div className="font-semibold">{t.title}</div>
              {t.description && <div className="text-xs opacity-90 mt-1">{t.description}</div>}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
