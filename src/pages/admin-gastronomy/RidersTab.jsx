import React from 'react';
import { Plus, Bike, Trash2, MapPin } from 'lucide-react';
import Button from '../../components/shared/ui/Button';
import Eyebrow from '../../components/shared/ui/Eyebrow';

export default function RidersTab({ riders, onCreateRider, onDeleteRider }) {
  return (
    <div className="anim-rise">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <Eyebrow>Flota</Eyebrow>
          <h1 className="display mt-3 text-4xl md:text-5xl">
            Tus <em className="display-italic text-acid">repartidores</em>
          </h1>
        </div>
        <Button onClick={onCreateRider} variant="acid" size="md">
          <Plus className="h-4 w-4" /> Nuevo rider
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {riders.map((r) => (
          <div
            key={r.id}
            className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-5 transition-colors hover:border-text-muted"
          >
            {r.branches?.name && (
              <div className="mono absolute right-0 top-0 inline-flex items-center gap-1 rounded-bl-[var(--radius-sm)] bg-acid/10 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-acid">
                <MapPin className="h-2.5 w-2.5" /> {r.branches.name}
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-rule-strong bg-ink-3 text-acid">
                <Bike className="h-5 w-5" />
              </div>
              <div>
                <p className="display text-lg text-text">{r.name}</p>
                <p className="mono mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                  PIN:{' '}
                  <span className="mono rounded-sm bg-white/5 px-1.5 py-0.5 font-semibold text-text">
                    {r.access_pin}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => onDeleteRider(r.id)}
              className="rounded-[var(--radius-sm)] border border-signal/30 bg-signal/10 p-2.5 text-signal opacity-0 transition-opacity hover:bg-signal hover:text-white group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {riders.length === 0 && (
          <div className="col-span-full rounded-[var(--radius-xl)] border border-dashed border-rule-strong p-16 text-center">
            <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">Sin riders activos</p>
          </div>
        )}
      </div>
    </div>
  );
}
