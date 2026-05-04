import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastContext } from './toastContext';

const VARIANT_STYLES = {
  success: { icon: CheckCircle2, accent: '#D0FF00', bg: 'rgba(208,255,0,0.10)' },
  error:   { icon: AlertCircle,  accent: '#FF6B6B', bg: 'rgba(255,107,107,0.10)' },
  warning: { icon: AlertTriangle, accent: '#FFB75A', bg: 'rgba(255,183,90,0.10)' },
  info:    { icon: Info,         accent: '#7CD3FF', bg: 'rgba(124,211,255,0.10)' },
};

const DEFAULT_DURATION = 4000;

function ToastItem({ toast, onDismiss }) {
  const config = VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info;
  const Icon = config.icon;

  useEffect(() => {
    if (toast.duration === 0) return undefined;
    const t = setTimeout(() => onDismiss(toast.id), toast.duration ?? DEFAULT_DURATION);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="pointer-events-auto w-[340px] max-w-[92vw]"
    >
      <div
        className="flex items-start gap-3 rounded-[var(--radius-md)] border border-rule-strong bg-ink-2 p-4 shadow-[var(--shadow-editorial)]"
        style={{ borderLeftColor: config.accent, borderLeftWidth: 3 }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: config.bg }}
        >
          <Icon className="h-4 w-4" style={{ color: config.accent }} />
        </div>
        <div className="min-w-0 flex-1">
          {toast.title && (
            <p className="display text-sm leading-tight text-text">{toast.title}</p>
          )}
          {toast.message && (
            <p className={`text-xs text-text-muted ${toast.title ? 'mt-1' : ''}`}>
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded-[var(--radius-sm)] p-1 text-text-subtle transition-colors hover:bg-white/5 hover:text-text"
          aria-label="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((variant, input, opts) => {
    const base = typeof input === 'string' ? { message: input } : input || {};
    const payload = { ...base, ...(opts || {}) };
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, variant, ...payload }]);
    return id;
  }, []);

  const api = useMemo(
    () => ({
      success: (input, opts) => push('success', input, opts),
      error:   (input, opts) => push('error',   input, opts),
      warning: (input, opts) => push('warning', input, opts),
      info:    (input, opts) => push('info',    input, opts),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[400] flex flex-col items-end gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

