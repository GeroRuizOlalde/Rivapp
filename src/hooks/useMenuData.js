import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export const useMenuData = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        // Pedimos los productos que tengan stock (available = true)
        const { data, error } = await supabase
          .from('menu')
          .select('*')
          .eq('available', true) 
          .order('category', { ascending: true });

        if (error) throw error;

        setMenuItems(data);

        // Extraer categorías únicas de los productos cargados
        const uniqueCategories = ["Todos", ...new Set(data.map(item => item.category))];
        setCategories(uniqueCategories);
        
      } catch (error) {
        console.error("Error cargando menú:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  return { menuItems, categories, loading };
};