import { Check, ChevronRight, Crown, Loader2 } from 'lucide-react';
import Eyebrow from '../../components/shared/ui/Eyebrow';
import { getPlan, isProTier, PLANS, PLAN_IDS } from '../../config/plans';

const formatPrice = (n) => `$${n.toLocaleString('es-AR')}`;

export default function BillingTab({ config, accentColor, onSubscribe, isSubscribing = false }) {
  const currentPlan = getPlan(config.plan_type);
  const onProTier = isProTier(config.plan_type) || config.is_demo;

  return (
    <div className="max-w-4xl anim-rise">
      <header className="mb-8">
        <Eyebrow>Plan</Eyebrow>
        <h1 className="display mt-3 text-4xl md:text-5xl">
          Tu <em className="display-italic" style={{ color: accentColor }}>suscripción</em>
        </h1>
      </header>

      {onProTier ? (
        <div
          className="relative overflow-hidden rounded-[var(--radius-2xl)] border p-10"
          style={{ borderColor: `${accentColor}40`, backgroundColor: `${accentColor}08` }}
        >
          <div className="flex flex-col items-end justify-between gap-6 md:flex-row">
            <div>
              <div className="flex items-center gap-3">
                <Eyebrow style={{ color: accentColor }}>Tu plan actual</Eyebrow>
                <span
                  className="mono inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em]"
                  style={{ backgroundColor: accentColor, color: 'black' }}
                >
                  <Crown className="h-3 w-3" /> Pro
                </span>
              </div>
              <h2 className="display mt-4 text-6xl text-text">{currentPlan?.label || 'Profesional'}</h2>
            </div>
            <div className="text-right">
              <p className="display num text-5xl text-text">
                {formatPrice(currentPlan?.price ?? PLANS[PLAN_IDS.PROFESIONAL].price)}
              </p>
              <p className="mono mt-1 text-[11px] uppercase tracking-[0.22em] text-text-subtle">/ mes</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[var(--radius-2xl)] border border-rule-strong bg-ink-2 p-8">
            <Eyebrow>Tu plan actual</Eyebrow>
            <h2 className="display mt-4 text-4xl text-text">{currentPlan?.label || 'Sin plan'}</h2>
            <ul className="mt-8 space-y-3 text-sm text-text-muted">
              {(currentPlan?.features || []).slice(0, 3).map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-text-subtle" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-[var(--radius-2xl)] p-px"
            style={{ background: `linear-gradient(to bottom right, ${accentColor}, var(--color-ink))` }}
          >
            <div className="rounded-[calc(var(--radius-2xl)-1px)] bg-ink-2 p-8">
              <Eyebrow style={{ color: accentColor }}>{PLANS[PLAN_IDS.PROFESIONAL].label}</Eyebrow>
              <p className="display num mt-4 text-5xl text-text">
                {formatPrice(PLANS[PLAN_IDS.PROFESIONAL].price)}
              </p>
              <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">/ mes</p>
              <button
                onClick={() => onSubscribe?.(PLAN_IDS.PROFESIONAL)}
                disabled={isSubscribing}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] py-4 font-semibold text-ink shadow-[var(--shadow-lift)] disabled:opacity-60"
                style={{ backgroundColor: accentColor }}
              >
                {isSubscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Pasarme a Profesional <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
