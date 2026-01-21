import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useStore } from '../context/StoreContext'; // 🟢 Importamos el contexto

export const useStoreStatus = () => {
  const { store } = useStore(); // 🟢 Obtenemos la tienda actual
  const [isOpen, setIsOpen] = useState(true); // Asumimos abierto al inicio
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no hay tienda cargada aún, esperamos
    if (!store?.id) return;

    const fetchStatus = async () => {
      try {
        // Leemos la fila de la tabla 'config' correspondiente a ESTA tienda
        const { data, error } = await supabase
          .from('config')
          .select('is_open')
          .eq('store_id', store.id) // 🟢 FILTRO CLAVE: Solo la config de este negocio
          .limit(1)
          .single();

        // Ignoramos error si no existe config (PGRST116), asumimos default
        if (error && error.code !== 'PGRST116') throw error;
        
        // Si data existe, actualizamos el estado
        if (data) {
          setIsOpen(data.is_open);
        }
      } catch (error) {
        console.error("Error leyendo estado del local:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
  }, [store]); // 🟢 Agregamos store como dependencia

  return { isOpen, loading };
};