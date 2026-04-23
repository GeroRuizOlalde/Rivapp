import { useEffect, useState } from 'react';
import { X, ShoppingBag, Calendar, Star, AlertTriangle, Users, CreditCard, Info } from 'lucide-react';

const TYPE_CONFIG = {
  new_order:          { icon: ShoppingBag,   tone: 'acid',   label: 'Nuevo pedido' },
  order_status:       { icon: ShoppingBag,   tone: 'ml',     label: 'Pedido' },
  new_appointment:    { icon: Calendar,      tone: 'violet', label: 'Nuevo turno' },
  appointment_status: { icon: Calendar,      tone: 'ml',     label: 'Turno' },
  low_stock:          { icon: AlertTriangle, tone: 'amber',  label: 'Stock bajo' },
  new_review:         { icon: Star,          tone: 'amber',  label: 'Nueva reseña' },
  new_member:         { icon: Users,         tone: 'ml',     label: 'Equipo' },
  payment_received:   { icon: CreditCard,    tone: 'acid',   label: 'Pago' },
  system:             { icon: Info,          tone: 'muted',  label: 'Sistema' },
};

const TONE_STYLES = {
  acid:   { bg: 'rgba(208,255,0,0.14)',  color: '#D0FF00', bar: '#D0FF00' },
  ml:     { bg: 'rgba(0,158,227,0.14)',  color: '#7CD3FF', bar: '#009EE3' },
  violet: { bg: 'rgba(139,92,246,0.18)', color: '#B2A3FF', bar: '#8B5CF6' },
  amber:  { bg: 'rgba(255,159,28,0.18)', color: '#FFB75A', bar: '#FF9F1C' },
  muted:  { bg: 'rgba(247,245,238,0.08)',color: '#A19B8D', bar: '#A19B8D' },
};

function SingleToast({ toast, onDismiss, onClick }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.system;
  const Icon = config.icon;
  const toneStyle = TONE_STYLES[config.tone] || TONE_STYLES.muted;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const exitTimer = setTimeout(() => setExiting(true), 4500);
    return () => clearTimeout(exitTimer);
  }, []);

  const handleClick = () => {
    setExiting(true);
    setTimeout(() => {
      onDismiss(toast.toastId);
      if (onClick) onClick(toast);
    }, 300);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setExiting(true);
    setTimeout(() => onDismiss(toast.toastId), 300);
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer"
      style={{
        transform: visible && !exiting ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible && !exiting ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        marginBottom: '10px',
      }}
    >
      <div className="relative w-[340px] overflow-hidden rounded-[var(--radius-md)] border border-rule-strong bg-ink-2 shadow-[var(--shadow-editorial)]">
        <div
          className="absolute bottom-0 left-0 h-[2px]"
          style={{
            backgroundColor: toneStyle.bar,
            animation: 'shrinkWidth 5s linear forwards',
          }}
        />

        <div className="flex items-start gap-3 p-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: toneStyle.bg }}
          >
            <Icon className="h-5 w-5" style={{ color: toneStyle.color }} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span
                className="mono text-[9px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: toneStyle.color }}
              >
                {config.label}
              </span>
              <span className="mono text-[9px] text-text-subtle">·</span>
              <span className="mono text-[9px] uppercase tracking-[0.2em] text-text-subtle">ahora</span>
            </div>
            <p className="display text-base leading-tight text-text">{toast.title}</p>
            {toast.body && (
              <p className="mt-1 line-clamp-2 text-xs text-text-muted">{toast.body}</p>
            )}
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.22em] text-text-subtle transition-colors group-hover:text-text">
              Tocar para ver →
            </p>
          </div>

          <button
            onClick={handleClose}
            className="shrink-0 rounded-[var(--radius-sm)] p-1 text-text-subtle opacity-0 transition-all hover:bg-white/5 hover:text-text group-hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationToast({ toasts, onDismiss, onClickToast }) {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      <div className="pointer-events-auto fixed right-4 top-4 z-[300] flex flex-col items-end">
        {toasts.slice(-3).map((toast) => (
          <SingleToast
            key={toast.toastId}
            toast={toast}
            onDismiss={onDismiss}
            onClick={onClickToast}
          />
        ))}
      </div>
    </>
  );
}
