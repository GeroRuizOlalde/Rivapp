import { useState, useRef, useEffect } from 'react';
import {
  Bell, CheckCheck, Trash2, X, ShoppingBag, Calendar, Star, AlertTriangle,
  Users, CreditCard, Info,
} from 'lucide-react';

const TYPE_CONFIG = {
  new_order:          { icon: ShoppingBag,   tone: 'acid',   label: 'Pedido' },
  order_status:       { icon: ShoppingBag,   tone: 'ml',     label: 'Pedido' },
  new_appointment:    { icon: Calendar,      tone: 'violet', label: 'Turno' },
  appointment_status: { icon: Calendar,      tone: 'ml',     label: 'Turno' },
  low_stock:          { icon: AlertTriangle, tone: 'amber',  label: 'Stock' },
  new_review:         { icon: Star,          tone: 'amber',  label: 'Reseña' },
  new_member:         { icon: Users,         tone: 'ml',     label: 'Equipo' },
  payment_received:   { icon: CreditCard,    tone: 'acid',   label: 'Pago' },
  system:             { icon: Info,          tone: 'muted',  label: 'Sistema' },
};

const TONE_STYLES = {
  acid:   { bg: 'rgba(208,255,0,0.10)',  color: '#D0FF00' },
  ml:     { bg: 'rgba(0,158,227,0.12)',  color: '#7CD3FF' },
  violet: { bg: 'rgba(139,92,246,0.14)', color: '#B2A3FF' },
  amber:  { bg: 'rgba(255,159,28,0.14)', color: '#FFB75A' },
  muted:  { bg: 'rgba(247,245,238,0.06)',color: '#A19B8D' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function NotificationPanel({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  accentColor = '#D0FF00',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative rounded-[var(--radius-sm)] border border-rule bg-ink-2 p-2.5 transition-colors hover:border-text hover:bg-white/5"
      >
        <Bell className="h-4 w-4 text-text-muted transition-colors group-hover:text-text" />
        {unreadCount > 0 && (
          <span
            className="num absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-ink shadow-[var(--shadow-lift)]"
            style={{ backgroundColor: accentColor }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-[100] mt-2 flex max-h-[70vh] w-[380px] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 shadow-[var(--shadow-editorial)] anim-rise">
          <div className="flex items-center justify-between border-b border-rule bg-ink-3 px-4 py-3">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">Inbox</p>
              <p className="display mt-0.5 text-lg text-text">Notificaciones</p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="mono inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-[10px] uppercase tracking-[0.22em] hover:bg-white/5"
                  style={{ color: accentColor }}
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="h-3 w-3" /> Leer todas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('¿Borrar todas las notificaciones?')) onClearAll();
                  }}
                  className="rounded-[var(--radius-sm)] p-1.5 text-text-muted hover:bg-signal/10 hover:text-signal"
                  title="Borrar todas"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-[var(--radius-sm)] p-1.5 text-text-muted hover:bg-white/5 hover:text-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rule-strong bg-ink-3 text-text-subtle">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                    Sin notificaciones
                  </p>
                  <p className="mt-1 text-xs text-text-subtle">Todo tranquilo por ahora.</p>
                </div>
              </div>
            ) : (
              notifications.map((n) => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                const Icon = config.icon;
                const toneStyle = TONE_STYLES[config.tone] || TONE_STYLES.muted;
                return (
                  <div
                    key={n.id}
                    className={`group flex cursor-pointer items-start gap-3 border-b border-rule px-4 py-3 last:border-0 transition-colors hover:bg-white/[0.02] ${
                      !n.is_read ? 'bg-white/[0.015]' : ''
                    }`}
                    onClick={() => {
                      if (!n.is_read) onMarkAsRead(n.id);
                    }}
                  >
                    <div
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: toneStyle.bg }}
                    >
                      <Icon className="h-4 w-4" style={{ color: toneStyle.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm leading-tight ${!n.is_read ? 'font-semibold text-text' : 'text-text-muted'}`}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: accentColor }}
                          />
                        )}
                      </div>
                      {n.body && (
                        <p className="mt-1 line-clamp-2 text-xs text-text-subtle">{n.body}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <span
                          className="mono text-[9px] font-semibold uppercase tracking-[0.22em]"
                          style={{ color: toneStyle.color }}
                        >
                          {config.label}
                        </span>
                        <span className="mono text-[9px] text-text-subtle">·</span>
                        <span className="mono text-[9px] uppercase tracking-[0.18em] text-text-subtle">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(n.id);
                      }}
                      className="shrink-0 rounded-[var(--radius-sm)] p-1 text-text-subtle opacity-0 transition-all hover:bg-signal/10 hover:text-signal group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
