import { Check, ChevronRight, Crown, Loader2, Star } from 'lucide-react';
import Eyebrow from '../../components/shared/ui/Eyebrow';
import Rule from '../../components/shared/ui/Rule';
import { getPlan, isProTier, PURCHASABLE_PLANS, PLANS, PLAN_IDS } from '../../config/plans';

const formatPrice = (n) => `$${n.toLocaleString('es-AR')}`;

export default function BillingTab({ config, accentColor, onSubscribe, isSubscribing = false }) {
  const currentPlan = getPlan(config.plan_type);
  const onProTier = isProTier(config.plan_type) || config.is_demo;

  return (
    <div className="mx-auto max-w-5xl pb-20 anim-rise">
      <header className="mb-8">
        <Eyebrow>Plan</Eyebrow>
        <h1 className="display mt-3 text-4xl md:text-5xl">
          Tu <em className="display-italic" style={{ color: accentColor }}>suscripción</em>
        </h1>
      </header>

      {onProTier ? (
        <div
          className="relative overflow-hidden rounded-[var(--radius-2xl)] border p-6 md:p-10"
          style={{ borderColor: `${accentColor}40`, backgroundColor: `${accentColor}08` }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
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
              <h2 className="display mt-3 text-3xl text-text md:mt-4 md:text-6xl">
                {currentPlan?.label || 'Profesional'}
              </h2>
            </div>
            <div className="md:text-right">
              <p className="display num text-3xl text-text md:text-5xl">
                {formatPrice(currentPlan?.price ?? PLANS[PLAN_IDS.PROFESIONAL].price)}
              </p>
              <p className="mono mt-1 text-[11px] uppercase tracking-[0.22em] text-text-subtle">/ mes</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {currentPlan && (
            <div className="mb-8 rounded-[var(--radius-2xl)] border border-rule-strong bg-ink-2 p-6">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <Eyebrow>Tu plan actual</Eyebrow>
                  <h2 className="display mt-2 text-3xl text-text">{currentPlan.label}</h2>
                </div>
                <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                  Elegí el plan que mejor te quede
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {PURCHASABLE_PLANS.map((plan) => {
              const isRecommended = plan.id === PLAN_IDS.PROFESIONAL;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-[var(--radius-2xl)] ${
                    isRecommended ? 'p-px' : ''
                  }`}
                  style={
                    isRecommended
                      ? { background: `linear-gradient(to bottom right, ${accentColor}, var(--color-ink))` }
                      : undefined
                  }
                >
                  <div
                    className={`flex flex-1 flex-col rounded-[calc(var(--radius-2xl)-1px)] bg-ink-2 p-6 md:p-8 ${
                      isRecommended ? '' : 'border border-rule-strong'
                    }`}
                  >
                    {isRecommended && (
                      <span
                        className="mono absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-ink"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Star className="h-3 w-3" fill="currentColor" /> Recomendado
                      </span>
                    )}

                    <Eyebrow style={isRecommended ? { color: accentColor } : undefined}>
                      {plan.label}
                    </Eyebrow>

                    <div className="mt-4 flex items-baseline gap-2">
                      <p className="display num text-4xl text-text md:text-5xl">{formatPrice(plan.price)}</p>
                      <span className="mono text-xs text-text-subtle">/ mes</span>
                    </div>

                    <Rule className="my-6" />

                    <ul className="flex-1 space-y-3 text-sm text-text-muted">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0"
                            style={{ color: isRecommended ? accentColor : 'var(--color-text-subtle)' }}
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => onSubscribe?.(plan.id)}
                      disabled={isSubscribing}
                      className={`mono mt-8 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] py-4 text-[11px] font-semibold uppercase tracking-[0.22em] disabled:opacity-60 ${
                        isRecommended
                          ? 'text-ink shadow-[var(--shadow-lift)]'
                          : 'border border-rule-strong bg-white/5 text-text hover:bg-white/10'
                      }`}
                      style={isRecommended ? { backgroundColor: accentColor } : undefined}
                    >
                      {isSubscribing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Elegir {plan.label} <ChevronRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
