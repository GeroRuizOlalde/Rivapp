import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Loader2, AlertCircle } from 'lucide-react';

// Importamos los dos paneles
import AdminGastronomy from './AdminGastronomy';
import AdminServices from './AdminServices';

export default function Admin() {
  const { store, loading } = useStore();

  // 🔍 Diagnóstico
  useEffect(() => {
    if (store) {
      console.log("🛠️ ADMIN ROUTER:", {
        slug: store.slug,
        rubro: store.business_type,
        plan: store.plan_type
      });
    }
  }, [store]);

  // 1. Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={48} className="text-white animate-spin" />
      </div>
    );
  }

  // 2. Si no hay tienda
  if (!store) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold">No se encontró la configuración</h2>
      </div>
    );
  }

  // 3. EL CEREBRO DE ENRUTAMIENTO (Ahora entiende Inglés y Español) 🧠
  const type = store.business_type ? store.business_type.toLowerCase().trim() : '';

  // A. Servicios (Barbería, Consultorio, Turnos)
  if (['turnos', 'services', 'service', 'agenda', 'booking'].includes(type)) {
    return <AdminServices />;
  }

  // B. Gastronomía (Restaurante, Delivery, Comida)
  // Aquí agregamos 'gastronomy' que es lo que viene de tu BD
  if (['gastronomia', 'gastronomy', 'restaurant', 'comida', 'food'].includes(type)) {
    return <AdminGastronomy />;
  }

  // 🔴 C. RUBRO DESCONOCIDO (Pero intentamos salvarlo)
  // Si llegamos aquí, es un valor raro. Por seguridad mostramos el error para que lo corrijas,
  // O podrias descomentar la linea de abajo para forzar uno por defecto.
  
  // return <AdminGastronomy />; // <--- Descomenta esto si quieres forzar Gastronomía siempre

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 text-center">
      <h2 className="text-2xl font-bold text-yellow-500 mb-4">⚠️ Rubro no detectado</h2>
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