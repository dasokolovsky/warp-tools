'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  entered: boolean;
}

interface ToastContextValue {
  toast: (opts: { message: string; type?: ToastType }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TYPE_CONFIG: Record<ToastType, { accent: string; Icon: React.ElementType }> = {
  success: { accent: '#00C650', Icon: CheckCircle },
  error:   { accent: '#FF4444', Icon: XCircle },
  info:    { accent: '#4B8EE8', Icon: Info },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(({ message, type = 'info' }: { message: string; type?: ToastType }) => {
    const id = Math.random().toString(36).slice(2, 10);

    setToasts((prev) => [...prev, { id, message, type, entered: false }]);

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, entered: true } : t)));
    }, 20);

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, entered: false } : t)));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 320);
    }, 3000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, entered: false } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 320);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((t) => {
          const { accent, Icon } = TYPE_CONFIG[t.type];
          return (
            <div
              key={t.id}
              style={{
                transition: 'opacity 0.3s ease, transform 0.3s ease',
                opacity: t.entered ? 1 : 0,
                transform: t.entered ? 'translateX(0)' : 'translateX(calc(100% + 16px))',
              }}
              className="pointer-events-auto flex items-stretch w-72 rounded-xl bg-[#080F1E] border border-[#1A2235] shadow-2xl overflow-hidden"
            >
              <div className="w-1 flex-shrink-0" style={{ backgroundColor: accent }} />
              <div className="flex items-start gap-2.5 px-3 py-3 flex-1 min-w-0">
                <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                <p className="text-sm text-white leading-snug flex-1 break-words">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="flex-shrink-0 ml-1 text-[#8B95A5] hover:text-white transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
