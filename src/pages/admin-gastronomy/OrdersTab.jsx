import { RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { KanbanColumn, OrderCard } from './components';
import Eyebrow from '../../components/shared/ui/Eyebrow';

export default function OrdersTab({
  filteredOrders,
  isSoundEnabled,
  onToggleSound,
  onRefreshOrders,
  onUpdateOrderStatus,
  onRejectOrder,
  onPrintOrder,
  onMarkOrderPaid,
  onOpenAssignRider,
  getBranchName,
}) {
  const pendingOrders = filteredOrders.filter((order) => order.status === 'pendiente');
  const confirmedOrders = filteredOrders.filter((order) => order.status === 'confirmado');
  const readyOrders = filteredOrders.filter((order) => order.status === 'listo');
  const deliveredOrders = filteredOrders.filter((order) => order.status === 'entregado');

  return (
    <div className="flex h-full flex-col anim-rise">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <Eyebrow>Operación</Eyebrow>
          <h1 className="display mt-3 flex items-baseline gap-3 text-4xl md:text-5xl">
            <em className="display-italic text-acid">Cocina</em>
            <span className="num text-lg text-text-subtle">· {filteredOrders.length}</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleSound}
            className={`mono inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${
              isSoundEnabled ? 'bg-acid/10 text-acid' : 'bg-signal/10 text-signal-soft'
            }`}
          >
            {isSoundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            Sonido {isSoundEnabled ? 'on' : 'off'}
          </button>
          <button
            onClick={onRefreshOrders}
            className="rounded-[var(--radius-sm)] border border-rule bg-ink-2 p-2.5 text-text-muted hover:border-text hover:text-text"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        <KanbanColumn title="Enviado" count={pendingOrders.length}>
          {pendingOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onUpdateOrderStatus}
              onReject={onRejectOrder}
              onPrint={onPrintOrder}
              onMarkPaid={onMarkOrderPaid}
              branchName={getBranchName(order.branch_id)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn title="Confirmado" count={confirmedOrders.length}>
          {confirmedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onUpdateOrderStatus}
              onPrint={onPrintOrder}
              onMarkPaid={onMarkOrderPaid}
              branchName={getBranchName(order.branch_id)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn title="Listo" count={readyOrders.length}>
          {readyOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onUpdateOrderStatus}
              onPrint={onPrintOrder}
              onAssignRider={() => onOpenAssignRider(order)}
              onMarkPaid={onMarkOrderPaid}
              branchName={getBranchName(order.branch_id)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn title="Entregado" count={deliveredOrders.length}>
          {deliveredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onUpdateOrderStatus}
              onPrint={onPrintOrder}
              isFinished
              onMarkPaid={onMarkOrderPaid}
              branchName={getBranchName(order.branch_id)}
            />
          ))}
        </KanbanColumn>
      </div>
    </div>
  );
}
