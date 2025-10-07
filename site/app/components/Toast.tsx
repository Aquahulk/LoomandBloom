"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastItem = Required<ToastOptions> & { id: string };

type ToastContextValue = {
  showToast: (opts: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function Toast({ item, onClose }: { item: ToastItem; onClose: (id: string) => void }) {
  const color = item.variant === 'success' ? 'bg-green-600' : item.variant === 'error' ? 'bg-red-600' : 'bg-gray-800';
  const border = item.variant === 'success' ? 'border-green-700' : item.variant === 'error' ? 'border-red-700' : 'border-gray-700';
  return (
    <div className={`pointer-events-auto w-full sm:w-80 ${color} text-white shadow-lg rounded-md border ${border} overflow-hidden`}> 
      <div className="px-3 py-2">
        {item.title && <div className="text-sm font-semibold">{item.title}</div>}
        {item.description && <div className="text-sm opacity-90">{item.description}</div>}
      </div>
      <button
        onClick={() => onClose(item.id)}
        className="absolute top-1 right-1 text-white/80 hover:text-white"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((opts: ToastOptions) => {
    const id = Math.random().toString(36).slice(2);
    const item: ToastItem = {
      id,
      title: opts.title ?? '',
      description: opts.description ?? '',
      variant: opts.variant ?? 'info',
      durationMs: opts.durationMs ?? 4000,
    };
    setToasts((prev) => [item, ...prev]);
    window.setTimeout(() => remove(id), item.durationMs);
  }, [remove]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  // Replace blocking browser alerts with non-blocking toasts globally
  useEffect(() => {
    const originalAlert = window.alert;
    (window as any).alert = (message?: any) => {
      const text = typeof message === 'string' ? message : String(message ?? '');
      showToast({ variant: 'info', title: text });
    };
    return () => { (window as any).alert = originalAlert; };
  }, [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed z-[1000] top-2 right-2 left-2 sm:left-auto flex flex-col gap-2 items-stretch sm:items-end pointer-events-none">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}