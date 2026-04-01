import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useStore } from '../context/StoreContext';

export function useStoreStatus() {
  const { store } = useStore();
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription;

    const fetchStatus = async () => {
      // Si no hay ID de tienda, esperamos (pero quitamos loading para no trabar)
      if (!store?.id) {
          setLoading(false);
          return;
      }
      
      try {
        // 🟢 CAMBIO CLAVE: Leemos de 'stores_public' (la vista segura)
        // en lugar de 'stores' (la tabla privada que bloqueaba la carga).
        const { data, error } = await supabase
          .from('stores_public') 
          .select('is_active')
          .eq('id', store.id)
          .single();

        if (error) {
            console.warn("No se pudo leer estado, asumiendo abierto:", error.message);
            setIsOpen(true);
        } else {
            setIsOpen(data?.is_active ?? true); 
        }
      } catch (err) {
        console.error("Error crítico en status:", err);
        setIsOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // 🟢 REALTIME: Escuchar cambios en la tabla original 'stores'
    // (Esto suele funcionar aunque no tengas permiso de lectura directa, 
    // siempre que la publicación de Supabase esté activa)
    subscription = supabase
      .channel('store_status_changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'stores', 
          filter: `id=eq.${store?.id}` 
        }, 
        (payload) => {
          if (payload.new && typeof payload.new.is_active !== 'undefined') {
            setIsOpen(payload.new.is_active);
          }
        }
      )
      .subscribe();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [store?.id]);

  return { isOpen, loading };
}