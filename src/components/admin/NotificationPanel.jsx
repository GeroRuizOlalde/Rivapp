import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, ShoppingBag, Calendar, Star, AlertTriangle, Users, CreditCard, Info } from 'lucide-react';

const TYPE_CONFIG = {
  new_order:          { icon: ShoppingBag,   color: '#22c55e', label: 'Pedido' },
  order_status:       { icon: ShoppingBag,   color: '#3b82f6', label: 'Pedido' },
  new_appointment:    { icon: Calendar,      color: '#8b5cf6', label: 'Turno' },
  appointment_status: { icon: Calendar,      color: '#3b82f6', label: 'Turno' },
  low_stock:          { icon: AlertTriangle, color: '#f59e0b', label: 'Stock' },
  new_review:         { icon: Star,          color: '#eab308', label: 'Reseña' },
  new_member:         { icon: Users,         color: '#06b6d4', label: 'Equipo' },
  payment_received:   { icon: CreditCard,    color: '#22c55e', label: 'Pago' },
  system:             { icon: Info,          color: '#6b7280', label: 'Sistema' },
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

export default function NotificationPanel({ notifications, unreadCount, onMarkAsRead, onMarkAllAsRead, onDelete, onClearAll, accentColor = '#d0ff00' }) {
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
      {/* Campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl hover:bg-white/10 transition-all group"
      >
        <Bell size={20} className="text-gray-400 group-hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black text-black px-1 animate-pulse"
            style={{ backgroundColor: accentColor }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[70vh] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#141414]">
            <h3 className="font-bold text-white text-sm">Notificaciones</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1"
                  style={{ color: accentColor }}
                  title="Marcar todas como leídas"
                >
                  <CheckCheck size={12} /> Leer todas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => { if (window.confirm('¿Borrar todas las notificaciones?')) onClearAll(); }}
                  className="text-[10px] font-bold text-gray-500 px-2 py-1 rounded-lg hover:bg-white/10 hover:text-red-400 transition-colors"
                  title="Borrar todas"
                >
                  <Trash2 size={12} />
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Bell size={32} className="mb-3 opacity-30" />
                <p className="text-sm font-bold">Sin notificaciones</p>
                <p className="text-xs mt-1">Todo tranquilo por ahora</p>
              </div>
            ) : (
              notifications.map(n => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group ${!n.is_read ? 'bg-white/[0.02]' : ''}`}
                    onClick={() => { if (!n.is_read) onMarkAsRead(n.id); }}
                  >
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5" style={{ backgroundColor: config.color + '15' }}>
                      <Icon size={16} style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm leading-tight ${!n.is_read ? 'font-bold text-white' : 'text-gray-300'}`}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                        )}
                      </div>
                      {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: config.color }}>{config.label}</span>
                        <span className="text-[10px] text-gray-600">{timeAgo(n.created_at)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
                      className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-all"
                    >
                      <X size={12} />
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
