import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/client';

const StoreContext = createContext();

export const useStore = () => {
  return useContext(StoreContext);
};

export const StoreProvider = ({ children }) => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 🟢 AGREGADO: Estado para la sucursal seleccionada (necesario para el Admin)
  const [selectedBranch, setSelectedBranch] = useState(null);

  const isMounted = useRef(true);

  const fetchStore = async () => {
    try {
      // --- 1. LÓGICA DE SLUG MEJORADA ---
      // Detectamos si es ruta (ej: rivapp.com.ar/demo) o subdominio (demo.rivapp.com.ar)
      const hostname = window.location.hostname;
      const pathSegment = window.location.pathname.split('/')[1]; // Obtiene lo que sigue a la barra (ej: "demo")

      let slug = 'demo'; // Valor por defecto

      // Si hay un segmento válido en la URL (y no es una ruta de sistema), lo usamos
      // Esto permite entrar a localhost:5173/rivapp o localhost:5173/hamburgueseria
      if (pathSegment && !['admin', 'login', 'dashboard'].includes(pathSegment)) {
        slug = pathSegment;
      } else if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        // Fallback a subdominios si estás en producción y usas esa estrategia
        slug = hostname.split('.')[0];
      }

      console.log("Cargando tienda para slug:", slug);

      // --- 2. BUSQUEDA BLINDADA EN SUPABASE ---
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        // 🛡️ CORRECCIÓN CLAVE PARA EVITAR PANTALLA NEGRA:
        .limit(1)       // Obliga a traer solo 1, aunque haya duplicados
        .maybeSingle(); // No explota si hay 0 o muchos resultados. Devuelve null si no existe.

      if (error) throw error;

      if (isMounted.current) {
        if (data) {
          setStore(data);
        } else {
          console.warn(`Tienda con slug '${slug}' no encontrada.`);
          // Aquí podrías setear un estado de error o dejar store en null para mostrar 404
          setStore(null);
        }
      }
    } catch (error) {
      console.error("Error crítico cargando tienda:", error.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchStore();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // 🟢 REALTIME: Escuchar cambios en la configuración de la tienda
  useEffect(() => {
    if (!store?.id) return;

    const channel = supabase
      .channel(`store_update_${store.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stores',
          filter: `id=eq.${store.id}`,
        },
        (payload) => {
          console.log('Actualización de tienda en vivo:', payload);
          setStore(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [store?.id]);

  const refreshStore = () => {
    fetchStore();
  };

  const value = {
    store,
    loading,
    refreshStore,
    // Exportamos también el manejo de sucursales para que el Admin funcione bien
    selectedBranch,
    setSelectedBranch
  };

  return (
    <StoreContext.Provider value={value}>
      {!loading && children}
    </StoreContext.Provider>
  );
};