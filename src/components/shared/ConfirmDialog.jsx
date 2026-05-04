import React, { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { ConfirmContext } from './confirmContext';

const DEFAULTS = {
  title: '¿Confirmás?',
  message: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  danger: false,
};

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ ...DEFAULTS, ...opts });
    });
  }, []);

  const close = (value) => {
    setState(null);
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-ink/85 p-6 backdrop-blur-sm"
            onClick={() => close(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative w-full max-w-md rounded-[var(--radius-2xl)] border border-rule-strong bg-ink-2 p-8 shadow-[var(--shadow-editorial)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => close(false)}
                className="absolute right-5 top-5 rounded-full border border-rule p-2 text-text-muted transition-colors hover:border-text hover:text-text"
                aria-label="Cerrar"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-start gap-4">
                {state.danger && (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-signal/15 text-signal">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="display text-2xl text-text">{state.title}</h3>
                  {state.message && (
                    <p className="mt-3 text-sm leading-6 text-text-muted">{state.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => close(false)}
                  className="mono rounded-[var(--radius-sm)] border border-rule bg-ink-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted transition-colors hover:border-text hover:text-text"
                >
                  {state.cancelLabel}
                </button>
                <button
                  onClick={() => close(true)}
                  className={`mono rounded-[var(--radius-sm)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all hover:brightness-110 ${
                    state.danger
                      ? 'bg-signal text-white'
                      : 'bg-acid text-ink'
                  }`}
                >
                  {state.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

