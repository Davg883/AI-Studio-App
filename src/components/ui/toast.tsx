'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const STYLES: Record<ToastKind, { box: string; icon: React.ReactNode }> = {
  success: {
    box: 'border-emerald-800/60 bg-emerald-950/90 text-emerald-100',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
  },
  error: {
    box: 'border-red-800/60 bg-red-950/90 text-red-100',
    icon: <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />,
  },
  info: {
    box: 'border-zinc-700 bg-zinc-900/95 text-zinc-100',
    icon: <Info className="h-4 w-4 text-zinc-300 shrink-0" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts(prev => [...prev.slice(-3), { id, kind, message }]);
      // Errors stay longer so they can actually be read
      setTimeout(() => dismiss(id), kind === 'error' ? 8000 : 4000);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: m => push('success', m),
      error: m => push('error', m),
      info: m => push('info', m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm shadow-2xl ${STYLES[t.kind].box}`}
          >
            {STYLES[t.kind].icon}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="rounded p-0.5 opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/** Reads `{ error }` from a failed JSON response, falling back to the HTTP status. */
export async function responseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.clone().json();
    return data?.error || `${fallback} (HTTP ${res.status})`;
  } catch {
    return `${fallback} (HTTP ${res.status})`;
  }
}
