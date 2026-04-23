import React from 'react';
import { FileText, MessageCircle } from 'lucide-react';
import Button from '../../components/shared/ui/Button';
import Eyebrow from '../../components/shared/ui/Eyebrow';

export default function CRMTab({ customers, onExportCustomers }) {
  return (
    <div className="space-y-8 anim-rise">
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Eyebrow>CRM</Eyebrow>
          <h1 className="display mt-3 text-4xl md:text-5xl">
            Tus <em className="display-italic text-acid">clientes</em>
          </h1>
          <p className="mt-2 text-sm text-text-muted">Base de datos con actividad histórica.</p>
        </div>
        <Button onClick={onExportCustomers} variant="paper" size="md">
          <FileText className="h-4 w-4" /> Exportar CSV
        </Button>
      </header>

      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-rule bg-ink-3">
              <th className="mono p-5 text-[10px] uppercase tracking-[0.22em] text-text-subtle">Cliente</th>
              <th className="mono p-5 text-[10px] uppercase tracking-[0.22em] text-text-subtle">Pedidos</th>
              <th className="mono p-5 text-[10px] uppercase tracking-[0.22em] text-text-subtle">Total</th>
              <th className="mono p-5 text-[10px] uppercase tracking-[0.22em] text-text-subtle">Contacto</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={i} className="border-b border-rule transition-colors last:border-0 hover:bg-white/[0.02]">
                <td className="p-5">
                  <p className="display text-lg text-text">{c.customer_name}</p>
                  <p className="mono mt-0.5 text-[10px] uppercase tracking-[0.2em] text-text-subtle">
                    {c.customer_phone}
                  </p>
                </td>
                <td className="num p-5 text-sm font-semibold text-text">{c.total_orders}</td>
                <td className="num p-5 text-sm font-semibold text-acid">
                  ${c.total_spent?.toLocaleString()}
                </td>
                <td className="p-5">
                  <a
                    href={`https://wa.me/${c.customer_phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-rule bg-white/5 p-2.5 text-text-muted transition-colors hover:border-acid hover:bg-acid/10 hover:text-acid"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="4" className="p-16 text-center">
                  <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">
                    Sin clientes todavía
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
