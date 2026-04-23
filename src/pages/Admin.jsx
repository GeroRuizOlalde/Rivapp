import React, { useEffect } from 'react';
import { useStore } from '../context/useStore';
import { Loader2, AlertCircle } from 'lucide-react';
import { logger } from '../utils/logger';

import AdminGastronomy from './AdminGastronomy';
import AdminServices from './AdminServices';
import Eyebrow from '../components/shared/ui/Eyebrow';

export default function Admin() {
  const { store, loading } = useStore();

  useEffect(() => {
    if (store) {
      logger.debug('Admin router:', {
        slug: store.slug,
        rubro: store.business_type,
        plan: store.plan_type,
      });
    }
  }, [store]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-acid" />
          <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-muted">Cargando panel</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-text">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-signal/40 bg-signal/10 text-signal">
          <AlertCircle className="h-6 w-6" />
        </div>
        <Eyebrow className="mt-6">Configuración</Eyebrow>
        <h2 className="display mt-3 text-4xl">
          No se <em className="display-italic text-acid">encontró</em>
        </h2>
        <p className="mt-3 text-sm text-text-muted">No pudimos cargar la configuración de tu tienda.</p>
      </div>
    );
  }

  const type = store.business_type ? store.business_type.toLowerCase().trim() : '';

  if (['turnos', 'services', 'service', 'agenda', 'booking'].includes(type)) {
    return <AdminServices />;
  }

  if (['gastronomia', 'gastronomy', 'restaurant', 'comida', 'food'].includes(type)) {
    return <AdminGastronomy />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-text">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-acid/40 bg-acid/10 text-acid">
        <AlertCircle className="h-6 w-6" />
      </div>
      <Eyebrow className="mt-6">Rubro</Eyebrow>
      <h2 className="display mt-3 text-4xl md:text-5xl">
        Rubro <em className="display-italic text-acid">no detectado</em>
      </h2>
      <p className="mt-4 max-w-md text-sm text-text-muted">
        La tienda <span className="text-text">{store.slug}</span> tiene un tipo de negocio desconocido.
      </p>
      <div className="mono mt-6 rounded-[var(--radius-sm)] border border-rule bg-ink-2 px-3 py-2 text-xs text-acid">
        business_type = "{store.business_type}"
      </div>
      <p className="mt-6 max-w-md text-xs text-text-subtle">
        Valores aceptados: <em className="display-italic">gastronomy, gastronomia, restaurant, turnos, services</em>.
      </p>
    </div>
  );
}
