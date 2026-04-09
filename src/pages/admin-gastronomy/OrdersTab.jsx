import { RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { KanbanColumn, OrderCard } from './components';

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
    <div className="h-full flex flex-col animate-in fade-in">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          Cocina
          <span className="text-sm bg-[#1a1a1a] px-3 py-1 rounded-full text-gray-400 font-normal">
            {filteredOrders.length} pedidos
          </span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={onToggleSound}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${
              isSoundEnabled ? 'bg-green-500/20 text-green-500 border-green-500/20' : 'bg-red-500/20 text-red-500 border-red-500/20'
            }`}
          >
            {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            {isSoundEnabled ? 'Sonido ON' : 'Activar Sonido'}
          </button>
          <button onClick={onRefreshOrders} className="p-2 bg-[#1a1a1a] rounded-xl border border-white/10 hover:bg-white/5">
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        <KanbanColumn title="ENVIADO" count={pendingOrders.length}>
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

        <KanbanColumn title="CONFIRMADO" count={confirmedOrders.length}>
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

        <KanbanColumn title="LISTO" count={readyOrders.length}>
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

        <KanbanColumn title="ENTREGADO" count={deliveredOrders.length}>
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
