import React from 'react';
import { Plus, Tag, Trash2 } from 'lucide-react';
import Button from '../../components/shared/ui/Button';
import Eyebrow from '../../components/shared/ui/Eyebrow';

export default function CouponsTab({ coupons, onCreateCoupon, onDeleteCoupon }) {
  return (
    <div className="mx-auto max-w-5xl pb-20 anim-rise">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <Eyebrow>Marketing</Eyebrow>
          <h1 className="display mt-3 text-4xl md:text-5xl">
            <em className="display-italic text-acid">Cupones</em>
          </h1>
        </div>
        <Button onClick={onCreateCoupon} variant="acid" size="md">
          <Plus className="h-4 w-4" /> Crear
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="group relative rounded-[var(--radius-xl)] border border-dashed border-rule-strong bg-ink-2 p-6 transition-colors hover:border-acid/40"
          >
            <div className="flex items-start justify-between">
              <Eyebrow tone="acid">Código</Eyebrow>
              <button
                onClick={() => onDeleteCoupon(c.id)}
                className="text-text-subtle transition-opacity hover:text-signal md:opacity-0 md:group-hover:opacity-100"
                aria-label="Borrar cupón"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="display mono mt-4 text-3xl text-text">{c.code}</p>
            <p className="mono mt-4 inline-block rounded-full bg-acid/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-acid">
              -{c.discount}% OFF
            </p>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-4 rounded-[var(--radius-xl)] border border-dashed border-rule-strong p-12 text-center md:p-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rule-strong bg-ink-2 text-text-subtle">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="display text-xl text-text">Sin cupones todavía</p>
              <p className="mt-1 max-w-xs text-sm text-text-muted">
                Creá descuentos para fidelizar clientes o impulsar ventas.
              </p>
            </div>
            <Button onClick={onCreateCoupon} variant="acid" size="md">
              <Plus className="h-4 w-4" /> Crear primer cupón
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
