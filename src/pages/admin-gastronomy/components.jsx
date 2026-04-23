import { Check, MapPin, Printer, Bike, User } from 'lucide-react';

export const KanbanColumn = ({ title, count, children }) => (
  <div className="flex h-full max-h-[calc(100vh-140px)] min-w-[300px] flex-1 flex-col snap-center rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2">
    <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[var(--radius-xl)] border-b border-rule bg-ink-3 px-4 py-3">
      <h3 className="mono text-[11px] font-semibold uppercase tracking-[0.22em] text-text">{title}</h3>
      <span className="num rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-text-muted">
        {count}
      </span>
    </div>
    <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-3">{children}</div>
  </div>
);

export const OrderCard = ({
  order,
  onStatusChange,
  onReject,
  onPrint,
  isFinished,
  onAssignRider,
  onMarkPaid,
  branchName,
}) => {
  const isPickup = order.delivery_type?.toLowerCase() === 'retiro';
  const isPaid = order.payment_status === 'paid' || order.paid === true;

  return (
    <div className="group relative overflow-hidden rounded-[var(--radius-md)] border border-rule-strong bg-ink-3 p-4 transition-all hover:border-text-muted">
      {order.payment_method === 'mercadopago' && (
        <div
          className={`mono absolute right-0 top-0 flex items-center gap-1 rounded-bl-[var(--radius-sm)] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] ${
            isPaid ? 'bg-acid text-ink' : 'bg-ml text-white'
          }`}
        >
          {isPaid ? (
            <>
              <Check className="h-3 w-3" /> Pagado
            </>
          ) : (
            'MP'
          )}
        </div>
      )}

      <div className="mb-3 mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="display truncate text-lg text-text">{order.customer_name}</h4>
          {branchName && (
            <div className="mono mt-1 inline-flex items-center gap-1 rounded-sm bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-text-muted">
              <MapPin className="h-2.5 w-2.5 text-acid" /> {branchName}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="mono text-[9px] uppercase tracking-[0.2em] text-text-subtle">
              {order.payment_method}
            </span>
            <span
              className={`mono rounded-sm px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] ${
                isPickup
                  ? 'bg-signal/10 text-signal-soft'
                  : 'bg-ml/10 text-ml-soft'
              }`}
            >
              {isPickup ? 'Retiro' : 'Delivery'}
            </span>
            {!isPaid && !isFinished && (
              <button
                onClick={() => onMarkPaid(order.id)}
                className="inline-flex items-center gap-1 rounded-sm bg-white/5 px-2 py-0.5 text-[9px] text-text-muted transition-colors hover:bg-acid/10 hover:text-acid"
                title="Marcar como pagado"
              >
                <Check className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => onPrint(order)}
          className="rounded-[var(--radius-sm)] border border-rule bg-ink p-2 text-ml-soft hover:border-ml hover:text-ml"
        >
          <Printer className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 space-y-1 border-l-2 border-rule pl-3">
        {(order.items || []).map((item, idx) => (
          <div key={idx} className="text-sm text-text-muted">
            <span className="num font-semibold text-text">{item.quantity}x</span> {item.name}{' '}
            {item.variantName && <span className="text-text-subtle">({item.variantName})</span>}
            {item.selectedExtras && item.selectedExtras.length > 0 && (
              <div className="mono ml-4 text-[9px] uppercase tracking-[0.18em] text-text-subtle">
                + {item.selectedExtras.map((extra) => extra.name).join(', ')}
              </div>
            )}
          </div>
        ))}
        {order.note && (
          <p className="mt-2 rounded-[var(--radius-sm)] border border-acid/20 bg-acid/10 p-2 text-xs italic text-acid">
            Nota: "{order.note}"
          </p>
        )}
        {!isPickup && (
          <div className="mono mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-ml-soft">
            <Bike className="h-3 w-3" /> Envío: ${order.delivery_cost || 0}
          </div>
        )}
        <div className="num mt-2 border-t border-rule pt-2 text-right display text-xl text-text">
          ${order.total?.toLocaleString()}
        </div>
      </div>

      {!isFinished && (
        <div className="grid grid-cols-2 gap-2">
          {order.status === 'pendiente' && (
            <>
              <button
                onClick={() => onReject(order.id)}
                className="mono rounded-[var(--radius-sm)] border border-signal/30 bg-signal/10 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-signal-soft transition-colors hover:bg-signal hover:text-white"
              >
                Rechazar
              </button>
              <button
                onClick={() => onStatusChange(order.id, 'confirmado')}
                className="mono rounded-[var(--radius-sm)] bg-acid py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink transition-colors hover:brightness-110"
              >
                Confirmar
              </button>
            </>
          )}
          {order.status === 'confirmado' && (
            <button
              onClick={() => onStatusChange(order.id, 'listo')}
              className="mono col-span-2 rounded-[var(--radius-sm)] bg-ml py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:brightness-110"
            >
              Marcar listo
            </button>
          )}
          {order.status === 'listo' && (
            <>
              {isPickup ? (
                <button
                  onClick={() => onStatusChange(order.id, 'entregado')}
                  className="mono col-span-2 inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-acid py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink transition-colors hover:brightness-110"
                >
                  <User className="h-3.5 w-3.5" /> Entregado al cliente
                </button>
              ) : (
                <>
                  <button
                    onClick={onAssignRider}
                    className="mono rounded-[var(--radius-sm)] border border-rule-strong bg-white/5 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted transition-colors hover:border-acid hover:text-acid"
                  >
                    Rider
                  </button>
                  <button
                    onClick={() => onStatusChange(order.id, 'entregado')}
                    className="mono rounded-[var(--radius-sm)] bg-acid py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink transition-colors hover:brightness-110"
                  >
                    Entregar
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {order.status === 'rechazado' && (
        <div className="mono rounded-[var(--radius-sm)] border border-signal/30 p-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-signal">
          Cancelado
        </div>
      )}
    </div>
  );
};
