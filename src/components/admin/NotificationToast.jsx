import { useEffect, useState } from 'react';
import { X, ShoppingBag, Calendar, Star, AlertTriangle, Users, CreditCard, Info } from 'lucide-react';

const TYPE_CONFIG = {
  new_order:          { icon: ShoppingBag,   color: '#22c55e', bg: '#22c55e', label: 'Nuevo Pedido' },
  order_status:       { icon: ShoppingBag,   color: '#3b82f6', bg: '#3b82f6', label: 'Pedido' },
  new_appointment:    { icon: Calendar,      color: '#8b5cf6', bg: '#8b5cf6', label: 'Nuevo Turno' },
  appointment_status: { icon: Calendar,      color: '#3b82f6', bg: '#3b82f6', label: 'Turno' },
  low_stock:          { icon: AlertTriangle, color: '#f59e0b', bg: '#f59e0b', label: 'Stock Bajo' },
  new_review:         { icon: Star,          color: '#eab308', bg: '#eab308', label: 'Nueva Reseña' },
  new_member:         { icon: Users,         color: '#06b6d4', bg: '#06b6d4', label: 'Equipo' },
  payment_received:   { icon: CreditCard,    color: '#22c55e', bg: '#22c55e', label: 'Pago' },
  system:             { icon: Info,          color: '#6b7280', bg: '#6b7280', label: 'Sistema' },
};

function SingleToast({ toast, onDismiss, onClick }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.system;
  const Icon = config.icon;

  useEffect(() => {
    // Entrada animada
    requestAnimationFrame(() => setVisible(true));
    // Salida animada antes de remover
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
      className="cursor-pointer group"
      style={{
        transform: visible && !exiting ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible && !exiting ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        marginBottom: '10px',
      }}
    >
      <div className="relative w-[340px] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Barra de progreso */}
        <div
          className="absolute bottom-0 left-0 h-[3px] rounded-full"
          style={{
            backgroundColor: config.bg,
            animation: 'shrinkWidth 5s linear forwards',
          }}
        />

        <div className="flex items-start gap-3 p-4">
          {/* Icono */}
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: config.color + '20' }}
          >
            <Icon size={20} style={{ color: config.color }} />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: config.color }}
              >
                {config.label}
              </span>
              <span className="text-[10px] text-gray-600">ahora</span>
            </div>
            <p className="text-sm font-bold text-white leading-tight">{toast.title}</p>
            {toast.body && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{toast.body}</p>
            )}
            <p className="text-[10px] text-gray-600 mt-1.5 group-hover:text-white transition-colors">
              Toca para ver →
            </p>
          </div>

          {/* Cerrar */}
          <button
            onClick={handleClose}
            className="shrink-0 p-1 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <X size={14} />
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
      {/* CSS para la animación de la barra */}
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      <div className="fixed top-4 right-4 z-[300] flex flex-col items-end pointer-events-auto">
        {toasts.slice(-3).map(toast => (
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
