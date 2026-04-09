import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/useStore';
import { useEntitlements } from '../../hooks/useEntitlements';
import { supabase } from '../../supabase/client';
import { Navigate, useLocation } from 'react-router-dom';
import { Star, Crown, Lock, Check, Loader2 } from 'lucide-react';
import { appConfig, getWhatsAppUrl } from '../../config/appConfig';
import { logger } from '../../utils/logger';

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );
  }

  if (!store) return null;

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasAdminRole = ['owner', 'admin', 'manager', 'staff'].includes(role);

  if (!hasAdminRole) {
    logger.warn('Acceso admin denegado para usuario sin rol valido.', {
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
    'Hola, ya realice el pago de Rivapp y necesito reactivar mi suscripcion.'
  );
  const emprendedorLink = appConfig.mpSubscriptionLinks.emprendedor;
  const profesionalLink = appConfig.mpSubscriptionLinks.profesional;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
      <div className="max-w-4xl w-full text-center space-y-4 mb-12">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
          <Lock size={40} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
          Tu suscripcion ha expirado
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          El periodo de tu plan <strong>{planName}</strong> finalizo el{' '}
          {new Date(store.subscription_expiry).toLocaleDateString()}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 hover:border-blue-500/30 transition-all group relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 bg-white/5 px-4 py-2 rounded-bl-2xl text-xs font-bold text-gray-400">
            INICIAL
          </div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Star className="text-blue-500" fill="currentColor" /> Emprendedor
          </h3>
          <div className="flex items-end gap-1 mb-6">
            <span className="text-4xl font-bold text-white">$30.000</span>
            <span className="text-gray-500 mb-1">/ mes</span>
          </div>
          <ul className="space-y-3 mb-8 text-sm text-gray-400 flex-1">
            <li className="flex gap-2">
              <Check size={16} className="text-blue-500" /> Hasta 100 turnos mensuales
            </li>
            <li className="flex gap-2">
              <Check size={16} className="text-blue-500" /> Agenda basica
            </li>
            <li className="flex gap-2">
              <Check size={16} className="text-blue-500" /> Link personalizado
            </li>
          </ul>
          {emprendedorLink ? (
            <a
              href={emprendedorLink}
              target="_blank"
              rel="noreferrer"
              className="block w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-center transition-colors border border-white/10"
            >
              Reactivar Emprendedor
            </a>
          ) : (
            <div className="block w-full py-4 rounded-xl bg-white/5 text-gray-500 font-bold text-center border border-white/10">
              Configura `VITE_MP_SUBSCRIPTION_LINK_EMPRENDEDOR`
            </div>
          )}
        </div>

        <div className="bg-gradient-to-b from-blue-900/20 to-[#111] border border-blue-500/50 rounded-3xl p-8 relative shadow-2xl shadow-blue-900/20 transform md:-translate-y-4 flex flex-col">
          <div className="absolute top-0 left-0 right-0 bg-blue-600 h-1.5"></div>
          <div className="absolute top-4 right-4 text-blue-400 animate-pulse">
            <Crown size={24} fill="currentColor" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Profesional</h3>
          <div className="flex items-end gap-1 mb-6">
            <span className="text-5xl font-bold text-white">$40.000</span>
            <span className="text-gray-400 mb-1">/ mes</span>
          </div>
          <p className="text-xs text-blue-200 bg-blue-500/10 p-3 rounded-lg mb-6 border border-blue-500/20">
            Ideal para crecer sin limites.
          </p>
          <ul className="space-y-3 mb-8 text-sm text-white flex-1">
            <li className="flex gap-2">
              <Check size={16} className="text-green-400" /> <strong>Turnos ILIMITADOS</strong>
            </li>
            <li className="flex gap-2">
              <Check size={16} className="text-green-400" /> <strong>Gestion de Equipo</strong>
            </li>
            <li className="flex gap-2">
              <Check size={16} className="text-green-400" /> <strong>Cupones y Marketing</strong>
            </li>
          </ul>
          {profesionalLink ? (
            <a
              href={profesionalLink}
              target="_blank"
              rel="noreferrer"
              className="block w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-center transition-all shadow-lg hover:shadow-blue-500/25 scale-105"
            >
              Reactivar PRO
            </a>
          ) : (
            <div className="block w-full py-4 rounded-xl bg-blue-950/40 text-blue-200 font-bold text-center border border-blue-500/20">
              Configura `VITE_MP_SUBSCRIPTION_LINK_PROFESIONAL`
            </div>
          )}
        </div>
      </div>

      <p className="mt-12 text-gray-600 text-sm">
        Ya pagaste?{' '}
        {supportUrl ? (
          <a href={supportUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
            Avisanos por WhatsApp
          </a>
        ) : (
          <span className="text-gray-500">Configura `VITE_SUPPORT_WHATSAPP`.</span>
        )}
      </p>
    </div>
  );
}
