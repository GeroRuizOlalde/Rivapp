import React, { useEffect } from 'react';
import { useStore } from '../context/useStore';
import { Loader2, AlertCircle } from 'lucide-react';
import { logger } from '../utils/logger';

import AdminGastronomy from './AdminGastronomy';
import AdminServices from './AdminServices';

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={48} className="text-white animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold">No se encontro la configuracion</h2>
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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 text-center">
      <h2 className="text-2xl font-bold text-yellow-500 mb-4">Rubro no detectado</h2>
      <p className="text-gray-400">
        La tienda <b>{store.slug}</b> tiene un tipo de negocio desconocido.
      </p>
      <div className="mt-4 p-3 bg-white/5 rounded-lg font-mono text-xs text-[#d0ff00]">
        Dato recibido: "{store.business_type}"
      </div>
      <p className="mt-6 text-sm text-gray-500 max-w-md">
        Valores aceptados: <em>gastronomy, gastronomia, restaurant, turnos, services</em>.
      </p>
    </div>
  );
}
