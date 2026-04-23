import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../../components/shared/ui/Button';
import Eyebrow from '../../components/shared/ui/Eyebrow';

export default function CouponsTab({ coupons, onCreateCoupon, onDeleteCoupon }) {
  return (
    <div className="anim-rise">
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
                className="text-text-subtle opacity-0 transition-opacity hover:text-signal group-hover:opacity-100"
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
          <div className="col-span-full rounded-[var(--radius-xl)] border border-dashed border-rule-strong p-16 text-center">
            <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">
              Sin cupones activos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
