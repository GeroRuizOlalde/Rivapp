import { Check, MapPin, Printer, Bike, User } from 'lucide-react';

export const KanbanColumn = ({ title, count, children }) => (
  <div className="flex-1 flex flex-col bg-[#141414] rounded-2xl border border-white/5 min-w-[300px] snap-center h-full max-h-[calc(100vh-140px)]">
    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a] rounded-t-2xl sticky top-0 z-10">
      <h3 className="font-bold text-white text-xs uppercase tracking-widest">{title}</h3>
      <span className="bg-white/10 text-gray-400 text-[10px] px-2 py-1 rounded-full font-bold">{count}</span>
    </div>
    <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">{children}</div>
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
    <div className="bg-[#1e1e1e] p-4 rounded-xl border border-white/5 shadow-xl group hover:border-white/10 transition-all relative overflow-hidden">
      {order.payment_method === 'mercadopago' && (
        <div
          className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold rounded-bl-xl flex items-center gap-1 ${
            isPaid ? 'bg-green-500 text-white' : 'bg-[#009EE3] text-white'
          }`}
        >
          {isPaid ? (
            <>
              <Check size={10} /> PAGADO
            </>
          ) : (
            'MERCADO PAGO'
          )}
        </div>
      )}

      <div className="flex justify-between items-start mb-3 mt-2">
        <div>
          <h4 className="font-bold text-white leading-none text-lg">{order.customer_name}</h4>
          {branchName && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded w-fit">
              <MapPin size={10} className="text-[#d0ff00]" /> {branchName}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <p className="text-[10px] text-gray-500 uppercase font-bold">{order.payment_method}</p>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                isPickup ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'
              }`}
            >
              {isPickup ? 'Retiro' : 'Delivery'}
            </span>
            {!isPaid && !isFinished && (
              <button
                onClick={() => onMarkPaid(order.id)}
                className="text-[10px] bg-white/10 hover:bg-green-500/20 hover:text-green-500 text-gray-400 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                title="Marcar como pagado manualmente"
              >
                <Check size={10} />
              </button>
            )}
          </div>
        </div>
        <button onClick={() => onPrint(order)} className="p-2 bg-black/50 rounded-lg text-blue-400 hover:text-white transition-colors">
          <Printer size={16} />
        </button>
      </div>

      <div className="space-y-1 mb-4 border-l-2 border-white/5 pl-3">
        {(order.items || []).map((item, idx) => (
          <div key={idx} className="text-sm text-gray-300">
            <span className="font-bold text-white">{item.quantity}x</span> {item.name}{' '}
            {item.variantName && <span className="text-gray-500 text-xs">({item.variantName})</span>}
            {item.selectedExtras && item.selectedExtras.length > 0 && (
              <div className="text-[10px] text-gray-500 ml-4">+ {item.selectedExtras.map((extra) => extra.name).join(', ')}</div>
            )}
          </div>
        ))}
        {order.note && (
          <p className="text-xs text-yellow-500 italic mt-2 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
            Nota: "{order.note}"
          </p>
        )}
        {!isPickup && (
          <div className="mt-2 text-xs flex items-center gap-1 text-blue-400 font-bold">
            <Bike size={12} /> Envio: ${order.delivery_cost || 0}
          </div>
        )}
        <div className="mt-2 text-lg font-black text-white text-right border-t border-white/10 pt-2">
          ${order.total?.toLocaleString()}
        </div>
      </div>

      {!isFinished && (
        <div className="grid grid-cols-2 gap-2">
          {order.status === 'pendiente' && (
            <>
              <button
                onClick={() => onReject(order.id)}
                className="bg-red-500/10 text-red-500 py-3 rounded-xl text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={() => onStatusChange(order.id, 'confirmado')}
                className="bg-green-500/10 text-green-500 py-3 rounded-xl text-xs font-bold uppercase hover:bg-green-500 hover:text-white transition-colors"
              >
                Confirmar
              </button>
            </>
          )}
          {order.status === 'confirmado' && (
            <button
              onClick={() => onStatusChange(order.id, 'listo')}
              className="col-span-2 bg-blue-600 py-3 rounded-xl text-xs font-bold text-white uppercase hover:bg-blue-500 transition-colors"
            >
              Marcar Listo
            </button>
          )}
          {order.status === 'listo' && (
            <>
              {isPickup ? (
                <button
                  onClick={() => onStatusChange(order.id, 'entregado')}
                  className="col-span-2 bg-green-600 py-3 rounded-xl text-xs font-bold text-white uppercase hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                >
                  <User size={16} /> Entregado al Cliente
                </button>
              ) : (
                <>
                  <button
                    onClick={onAssignRider}
                    className="col-span-1 bg-yellow-500/10 text-yellow-500 py-3 rounded-xl text-xs font-bold uppercase hover:bg-yellow-500/20 transition-colors"
                  >
                    Rider
                  </button>
                  <button
                    onClick={() => onStatusChange(order.id, 'entregado')}
                    className="col-span-1 bg-green-600 py-3 rounded-xl text-xs font-bold text-white uppercase hover:bg-green-500 transition-colors"
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
        <div className="text-red-500 text-xs font-bold text-center uppercase border border-red-500/20 p-2 rounded">Cancelado</div>
      )}
    </div>
  );
};
