'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; kind: ToastKind };
type ToastContext = { notify: (message: string, kind?: ToastKind) => void };
const Context = createContext<ToastContext | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dismiss = useCallback((id: number) => {
    setToasts(current => current.filter(t => t.id !== id));
  }, []);
  const notify = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++nextId.current;
    setToasts(current => [...current.slice(-3), { id, message, kind }]);
    timers.current.push(setTimeout(() => dismiss(id), kind === 'error' ? 6500 : 4000));
  }, [dismiss]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  return (
    <Context.Provider value={{ notify }}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="fixed bottom-5 right-4 left-4 sm:left-auto sm:w-96 z-[120] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => {
          const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertCircle : Info;
          return (
            <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-xl" style={{ background: '#151515', color: '#F8F4EC', border: `1px solid ${t.kind === 'error' ? '#f87171' : '#C8A96B'}` }}>
              <Icon className="shrink-0" size={20} color={t.kind === 'error' ? '#f87171' : '#C8A96B'} />
              <span className="flex-1 text-sm leading-5">{t.message}</span>
              <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(t.id)}><X size={18} /></button>
            </div>
          );
        })}
      </div>
    </Context.Provider>
  );
}

export function useToast() {
  const toast = useContext(Context);
  if (!toast) throw new Error('useToast must be used inside ToastProvider');
  return toast;
}
