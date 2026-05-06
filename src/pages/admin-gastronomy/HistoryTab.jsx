import React from 'react';
import { Trash2, Edit, Loader2 } from 'lucide-react';
import Eyebrow from '../../components/shared/ui/Eyebrow';
import Button from '../../components/shared/ui/Button';

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
    <div className="mx-auto max-w-5xl pb-20 anim-rise">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Eyebrow>Archivo</Eyebrow>
          <h1 className="display mt-3 text-4xl md:text-5xl">
            <em className="display-italic text-acid">Historial</em>
          </h1>
        </div>
        <button
          onClick={onDeleteAllHistory}
          className="mono inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-signal/30 bg-signal/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-signal-soft hover:bg-signal hover:text-white"
        >
          <Trash2 className="h-3.5 w-3.5" /> Vaciar todo
        </button>
      </header>

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {filteredHistory.map((o) => (
          <div
            key={o.id}
            className="rounded-[var(--radius-md)] border border-rule-strong bg-ink-2 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="display text-base text-text">{o.customer_name || 'Sin nombre'}</p>
                <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                  {new Date(o.created_at).toLocaleString('es-AR')}
                </p>
                {getBranchName(o.branch_id) && (
                  <p className="mono mt-1 text-[10px] uppercase tracking-[0.18em] text-text-muted">
                    {getBranchName(o.branch_id)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="num text-base font-semibold text-acid">
                  ${o.total?.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2 border-t border-rule pt-3">
              <button
                onClick={() => onEditOrder(o)}
                className="rounded-[var(--radius-sm)] border border-rule bg-white/5 p-2 text-ml-soft hover:border-ml hover:bg-ml/10"
                aria-label="Editar"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDeleteOrder(o.id)}
                className="rounded-[var(--radius-sm)] border border-signal/30 bg-signal/10 p-2 text-signal hover:bg-signal hover:text-white"
                aria-label="Borrar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {filteredHistory.length === 0 && (
          <div className="rounded-[var(--radius-md)] border border-dashed border-rule-strong p-10 text-center">
            <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">
              Sin pedidos archivados
            </p>
          </div>
        )}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-rule bg-ink-3">
              <th className="mono p-4 text-[10px] uppercase tracking-[0.22em] text-text-subtle">Fecha</th>
              <th className="mono p-4 text-[10px] uppercase tracking-[0.22em] text-text-subtle">Cliente</th>
              <th className="mono p-4 text-[10px] uppercase tracking-[0.22em] text-text-subtle">Sucursal</th>
              <th className="mono p-4 text-[10px] uppercase tracking-[0.22em] text-text-subtle">Total</th>
              <th className="mono p-4 text-[10px] uppercase tracking-[0.22em] text-text-subtle">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((o) => (
              <tr key={o.id} className="border-b border-rule last:border-0 hover:bg-white/[0.02]">
                <td className="mono p-4 text-xs text-text-muted">
                  {new Date(o.created_at).toLocaleString('es-AR')}
                </td>
                <td className="p-4 text-sm font-semibold text-text">{o.customer_name}</td>
                <td className="mono p-4 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  {getBranchName(o.branch_id) || '—'}
                </td>
                <td className="num p-4 text-sm font-semibold text-acid">${o.total?.toLocaleString()}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditOrder(o)}
                      className="rounded-[var(--radius-sm)] border border-rule bg-white/5 p-2 text-ml-soft hover:border-ml hover:bg-ml/10"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteOrder(o.id)}
                      className="rounded-[var(--radius-sm)] border border-signal/30 bg-signal/10 p-2 text-signal hover:bg-signal hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredHistory.length === 0 && (
              <tr>
                <td colSpan="5" className="p-16 text-center">
                  <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">
                    Sin pedidos archivados
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button onClick={onLoadMore} disabled={loadingMore} variant="outline" size="md">
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
              </>
            ) : (
              'Cargar más'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
