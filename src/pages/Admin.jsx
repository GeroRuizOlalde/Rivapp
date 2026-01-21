import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Loader2, AlertCircle } from 'lucide-react';

// Importamos los dos paneles
import AdminGastronomy from './AdminGastronomy';
import AdminServices from './AdminServices';

export default function Admin() {
  const { store, loading } = useStore();

  // 🔍 Diagnóstico en consola para detectar por qué se ven iguales
  useEffect(() => {
    if (store) {
      console.log("🛠️ SISTEMA DE RUTAS ADMIN:", {
        slug_actual: store.slug,
        rubro_en_db: store.business_type,
        plan: store.plan_type
      });
    }
  }, [store]);

  // 1. Estado de carga con diseño consistente
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={48} className="text-white animate-spin" />
      </div>
    );
  }

  // 2. Si no hay tienda (Slug incorrecto o error de red)
  if (!store) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold">No se encontró la configuración del negocio</h2>
        <p className="text-gray-400">Verifica el nombre en la URL o contacta a soporte.</p>
      </div>
    );
  }

if (store.business_type === 'turnos') {
    return <AdminServices />;
  }

  if (store.business_type === 'gastronomia') {
    return <AdminGastronomy />;
  }

  // 🔴 SALVAVIDAS: Si llega aquí, es porque la DB no tiene el dato correcto
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 text-center">
      <h2 className="text-2xl font-bold text-yellow-500 mb-4">⚠️ Rubro no detectado</h2>
      <p className="text-gray-400">
        La tienda <b>{store.slug}</b> no tiene asignado un rubro en la base de datos.
      </p>
      <div className="mt-4 p-3 bg-white/5 rounded-lg font-mono text-xs">
        Dato recibido: {JSON.stringify(store.business_type) || "null"}
      </div>
      <p className="mt-6 text-sm text-gray-500">
        Revisa la columna 'business_type' en Supabase para este negocio.
      </p>
    </div>
  );
}