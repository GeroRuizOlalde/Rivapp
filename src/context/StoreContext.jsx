import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useLocation } from 'react-router-dom';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [store, setStore] = useState(null);
  const [branches, setBranches] = useState([]); 
  const [selectedBranch, setSelectedBranch] = useState(null); 
  
  // 🟢 NUEVO: Estados para Usuario y Rol
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'owner', 'admin', 'staff', 'rider', o null
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  // 1. Efecto Principal: Cargar Tienda, Sucursales y Usuario
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        setError(null);

        // A. Obtener Usuario Actual (Si existe)
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // B. Detectar SLUG
        const pathParts = location.pathname.split('/');
        const slugIndex = pathParts.findIndex(p => p !== '' && !['login', 'register', 'dashboard', 'create-store'].includes(p));
        const slug = slugIndex !== -1 ? pathParts[slugIndex] : null;

        if (!slug) {
            setLoading(false);
            return;
        }

        console.log(`🔍 Buscando tienda: ${slug}`);

        // C. Buscar la Tienda
        const { data: storeData, error: storeError } = await supabase
          .from('stores_public') 
          .select('*')
          .eq('slug', slug)
          .single();

        if (storeError) throw storeError;
        setStore(storeData);

        // D. Buscar Sucursales
        const { data: branchesData, error: branchError } = await supabase
            .from('branches')
            .select('*')
            .eq('store_id', storeData.id)
            .eq('is_active', true);
        
        let initialBranch = null;

        if (!branchError && branchesData) {
            setBranches(branchesData);
            
            // Lógica de Selección de Sucursal
            const savedBranchId = localStorage.getItem(`rivapp_branch_${storeData.id}`);
            const foundSaved = branchesData.find(b => b.id === savedBranchId);

            if (foundSaved) {
                initialBranch = foundSaved;
            } else if (branchesData.length === 1) {
                initialBranch = branchesData[0];
            }
            // Nota: Si hay muchas y no hay guardada, queda null para que el selector obligue a elegir
        }
        
        setSelectedBranch(initialBranch);

        // E. 🚀 LÓGICA DE ROLES (Aquí sucede la magia)
        if (currentUser && storeData) {
            await determineUserRole(currentUser.id, storeData.id, initialBranch?.id);
        }

      } catch (err) {
        console.error("Error StoreContext:", err.message);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [location.pathname]);

  // 2. Función auxiliar para calcular el ROL exacto
  const determineUserRole = async (userId, storeId, branchId) => {
      // Prioridad 1: ¿Es el DUEÑO de la tienda?
      const { data: ownerMembership } = await supabase
          .from('stores') // Tabla real, no pública, para chequear owner_id
          .select('owner_id')
          .eq('id', storeId)
          .eq('owner_id', userId)
          .maybeSingle();

      if (ownerMembership) {
          console.log("👑 Usuario es DUEÑO");
          setRole('owner');
          return;
      }

      // Prioridad 2: ¿Es Staff de la tienda (Store Membership)?
      const { data: storeMember } = await supabase
          .from('store_memberships')
          .select('role')
          .eq('store_id', storeId)
          .eq('user_id', userId)
          .maybeSingle();

      if (storeMember) {
          console.log("👔 Usuario es Staff de Tienda:", storeMember.role);
          setRole(storeMember.role);
          return;
      }

      // Prioridad 3: ¿Es Staff de una SUCURSAL específica?
      if (branchId) {
          const { data: branchMember } = await supabase
              .from('branch_memberships')
              .select('role')
              .eq('branch_id', branchId)
              .eq('user_id', userId)
              .maybeSingle();

          if (branchMember) {
              console.log("🏪 Usuario es Staff de Sucursal:", branchMember.role);
              setRole(branchMember.role);
              return;
          }
      }

      // Si no encontró nada
      setRole('customer'); // O null
  };

  // 3. Recalcular rol si cambia la sucursal manual
  const selectBranch = async (branch) => {
      setSelectedBranch(branch);
      if (branch && store) {
          localStorage.setItem(`rivapp_branch_${store.id}`, branch.id);
          // Si cambia de sucursal, re-chequeamos permisos (un usuario puede ser Admin en A pero Cajero en B)
          if (user) await determineUserRole(user.id, store.id, branch.id);
      } else if (store) {
          localStorage.removeItem(`rivapp_branch_${store.id}`);
      }
  };

  return (
    <StoreContext.Provider value={{ 
        store, 
        branches, 
        selectedBranch, 
        selectBranch, 
        loading, 
        error,
        // 🟢 Exportamos User y Role para usarlo en los componentes
        user,
        role 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);