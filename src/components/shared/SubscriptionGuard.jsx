import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/useStore';
import { useEntitlements } from '../../hooks/useEntitlements';
import { supabase } from '../../supabase/client';
import { Navigate, useLocation } from 'react-router-dom';
import { Star, Crown, Lock, Check, Loader2, ArrowUpRight } from 'lucide-react';
import { appConfig, getWhatsAppUrl } from '../../config/appConfig';
import { logger } from '../../utils/logger';
import Eyebrow from './ui/Eyebrow';
import Rule from './ui/Rule';

export default function SubscriptionGuard({ children }) {
  const { store, loading: storeLoading, role } = useStore();
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const location = useLocation();

  const { canAccessAdmin, planName } = useEntitlements(store);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setAuthLoading(false);
    });
  }, []);

  if (storeLoading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="h-10 w-10 animate-spin text-acid" />
      </div>
    );
  }

  if (!store) return null;

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasAdminRole = ['owner', 'admin', 'manager', 'staff'].includes(role);

  if (!hasAdminRole) {
    logger.warn('Acceso admin denegado para usuario sin rol válido.', {
      slug: store.slug,
      role,
      userId: session.user.id,
    });
    return <Navigate to={`/${store.slug}`} replace />;
  }

  if (canAccessAdmin) {
    return children;
  }

  const supportUrl = getWhatsAppUrl(
    appConfig.supportWhatsApp,
    'Hola, ya realicé el pago de Rivapp y necesito reactivar mi suscripción.'
  );
  const emprendedorLink = appConfig.mpSubscriptionLinks.emprendedor;
  const profesionalLink = appConfig.mpSubscriptionLinks.profesional;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink p-6 text-text">
      <div className="pointer-events-none absolute inset-0 z-0 grain" aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute left-[-10%] top-[-20%] h-[60vw] w-[60vw] rounded-full bg-signal/[0.05] blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[50vw] w-[50vw] rounded-full bg-acid/[0.04] blur-[140px]" />
      </div>

      <div className="relative z-10 mb-12 w-full max-w-4xl text-center anim-rise">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-signal/40 bg-signal/10 text-signal shadow-[0_0_40px_-10px_rgba(255,59,31,0.35)]">
          <Lock className="h-6 w-6" />
        </div>
        <Eyebrow className="justify-center">Acceso bloqueado</Eyebrow>
        <h1 className="display mt-4 text-5xl leading-[0.95] md:text-6xl">
          Tu suscripción<br />
          <em className="display-italic text-acid">expiró.</em>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-text-muted md:text-lg">
          El periodo de tu plan{' '}
          <span className="text-text">{planName}</span> finalizó el{' '}
          <span className="mono text-text">
            {new Date(store.subscription_expiry).toLocaleDateString('es-AR')}
          </span>
          .
        </p>
      </div>

      <div className="relative z-10 grid w-full max-w-4xl gap-6 md:grid-cols-2 md:gap-8">
        {/* Emprendedor */}
        <div className="group relative flex flex-col rounded-[var(--radius-2xl)] border border-rule-strong bg-ink-2 p-8 transition-colors hover:border-text-muted">
          <div className="mono absolute right-0 top-0 rounded-bl-[var(--radius-sm)] bg-white/5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-text-muted">
            Inicial
          </div>
          <Eyebrow>
            <Star className="h-3 w-3" fill="currentColor" /> Emprendedor
          </Eyebrow>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="display num text-5xl text-text">$30.000</span>
            <span className="mono text-xs text-text-subtle">/ mes</span>
          </div>
          <Rule className="my-6" />
          <ul className="flex-1 space-y-3 text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-acid" /> Hasta 100 turnos mensuales
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-acid" /> Agenda básica
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-acid" /> Link personalizado
            </li>
          </ul>
          {emprendedorLink ? (
            <a
              href={emprendedorLink}
              target="_blank"
              rel="noreferrer"
              className="mono mt-8 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-rule-strong bg-white/5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-text transition-colors hover:border-text hover:bg-white/10"
            >
              Reactivar Emprendedor <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <div className="mono mt-8 rounded-[var(--radius-md)] border border-rule bg-ink-3 py-4 text-center text-[10px] uppercase tracking-[0.22em] text-text-subtle">
              Configurá `VITE_MP_SUBSCRIPTION_LINK_EMPRENDEDOR`
            </div>
          )}
        </div>

        {/* Profesional */}
        <div className="relative flex flex-col rounded-[var(--radius-2xl)] border border-acid/50 bg-ink-2 p-8 shadow-[var(--shadow-acid)] md:-translate-y-4">
          <div
            className="mono absolute left-0 right-0 top-0 h-1 rounded-t-[var(--radius-2xl)]"
            style={{ background: 'linear-gradient(90deg, var(--color-acid), transparent)' }}
          />
          <div className="absolute right-4 top-4 text-acid">
            <Crown className="h-5 w-5" fill="currentColor" />
          </div>
          <Eyebrow tone="acid">
            <Star className="h-3 w-3" fill="currentColor" /> Profesional
          </Eyebrow>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="display num text-6xl text-text">$40.000</span>
            <span className="mono text-xs text-text-subtle">/ mes</span>
          </div>
          <p className="mono mt-4 rounded-[var(--radius-sm)] border border-acid/20 bg-acid/[0.05] p-3 text-[10px] uppercase tracking-[0.22em] text-acid">
            Ideal para crecer sin límites
          </p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-text">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-acid" />{' '}
              <span className="font-semibold">Turnos ilimitados</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-acid" />{' '}
              <span className="font-semibold">Gestión de equipo</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-acid" />{' '}
              <span className="font-semibold">Cupones y marketing</span>
            </li>
          </ul>
          {profesionalLink ? (
            <a
              href={profesionalLink}
              target="_blank"
              rel="noreferrer"
              className="mono mt-8 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-acid py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink shadow-[var(--shadow-lift)] transition-transform hover:scale-[1.01]"
            >
              Reactivar Pro <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <div className="mono mt-8 rounded-[var(--radius-md)] border border-acid/20 bg-acid/[0.05] py-4 text-center text-[10px] uppercase tracking-[0.22em] text-acid">
              Configurá `VITE_MP_SUBSCRIPTION_LINK_PROFESIONAL`
            </div>
          )}
        </div>
      </div>

      <p className="mono relative z-10 mt-12 text-[11px] uppercase tracking-[0.22em] text-text-subtle">
        ¿Ya pagaste?{' '}
        {supportUrl ? (
          <a href={supportUrl} target="_blank" rel="noreferrer" className="text-acid hover:underline">
            Avisanos por WhatsApp →
          </a>
        ) : (
          <span className="text-text-muted">Configurá `VITE_SUPPORT_WHATSAPP`</span>
        )}
      </p>
    </div>
  );
}
