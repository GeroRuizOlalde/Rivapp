import React from 'react';
import { Star } from 'lucide-react';
import Eyebrow from '../../components/shared/ui/Eyebrow';

export default function ReviewsTab({ reviews, accentColor }) {
  return (
    <div className="anim-rise">
      <header className="mb-8">
        <Eyebrow>Opiniones</Eyebrow>
        <h1 className="display mt-3 text-4xl md:text-5xl">
          <em className="display-italic" style={{ color: accentColor }}>Reseñas</em>
        </h1>
      </header>

      {reviews.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-dashed border-rule-strong p-16 text-center">
          <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">
            Aún no hay reseñas
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= r.rating ? accentColor : 'transparent'}
                        color={s <= r.rating ? accentColor : 'var(--color-text-subtle)'}
                      />
                    ))}
                  </div>
                  <p className="display mt-3 text-lg text-text">{r.customer_name}</p>
                </div>
                <span className="mono text-[10px] uppercase tracking-[0.2em] text-text-subtle">
                  {new Date(r.created_at).toLocaleDateString('es-AR')}
                </span>
              </div>
              <p className="text-sm italic leading-6 text-text-muted text-pretty">
                "{r.review || 'Sin comentario'}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
