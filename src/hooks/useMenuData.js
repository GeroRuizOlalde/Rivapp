import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useStore } from '../context/useStore';

export function useMenuData() {
  const { store } = useStore();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Obtener Categorías Activas
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('store_id', store.id)
          .eq('active', true)
          .order('sort_order', { ascending: true });

        if (catError) throw catError;

        // 2. Obtener Productos Activos
        const { data: menuData, error: menuError } = await supabase
          .from('menu')
          .select('*')
          .eq('store_id', store.id)
          .eq('available', true);

        if (menuError) throw menuError;

        // 3. Organizar datos
        setCategories(catData.map(c => c.name));
        setMenuItems(menuData);

      } catch (error) {
        console.error("Error cargando menú:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 🟢 REALTIME: Escuchar cambios en el menú o categorías
    const channel = supabase
      .channel('menu_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu', filter: `store_id=eq.${store.id}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `store_id=eq.${store.id}` }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [store?.id]);

  return { menuItems, categories, loading };
}
