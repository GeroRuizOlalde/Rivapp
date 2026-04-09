import React from 'react';
import { Trash2, Edit, Loader2 } from 'lucide-react';

export default function HistoryTab({
  filteredHistory,
  hasMore,
  loadingMore,
  onLoadMore,
  getBranchName,
  onEditOrder,
  onDeleteOrder,
  onDeleteAllHistory,
}) {
  return (
    <div className="animate-in fade-in">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Historial</h1>
        <button onClick={onDeleteAllHistory} className="text-red-500 text-sm font-bold flex items-center gap-2 hover:bg-red-500/10 px-4 py-2 rounded-lg">
          <Trash2 size={16} /> Vaciar Todo
        </button>
      </header>
      <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/50 text-gray-500 text-xs uppercase">
            <tr className="border-b border-white/5">
              <th className="p-4">Fecha</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Sucursal</th>
              <th className="p-4">Total</th>
              <th className="p-4">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map(o => (
              <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-xs">{new Date(o.created_at).toLocaleString()}</td>
                <td className="p-4 font-bold">{o.customer_name}</td>
                <td className="p-4 text-xs text-gray-400">{getBranchName(o.branch_id) || '-'}</td>
                <td className="p-4 font-bold text-green-500">${o.total}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => onEditOrder(o)} className="text-blue-500 hover:text-blue-400 p-2 bg-blue-500/10 rounded-lg"><Edit size={16} /></button>
                  <button onClick={() => onDeleteOrder(o.id)} className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loadingMore ? <><Loader2 size={16} className="animate-spin" /> Cargando...</> : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  );
}
