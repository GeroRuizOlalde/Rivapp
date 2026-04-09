import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useLocation } from 'react-router-dom';
import { logger } from '../utils/logger';
import { StoreContext } from './store-context';

export const StoreProvider = ({ children }) => {
  const [store, setStore] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [userLocation, setUserLocation] = useState({ address: '', lat: null, lng: null, details: '' });
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);

        const pathParts = location.pathname.split('/');
        const slugIndex = pathParts.findIndex(
          (part) => part !== '' && !['login', 'register', 'dashboard', 'create-store'].includes(part)
        );
        const slug = slugIndex !== -1 ? pathParts[slugIndex] : null;

        if (!slug) {
          setStore(null);
          setBranches([]);
          setSelectedBranch(null);
          setRole(null);
          setLoading(false);
          return;
        }

        logger.debug(`Buscando tienda: ${slug}`);

        const { data: storeData, error: storeError } = await supabase
          .from('stores_public')
          .select('*')
          .eq('slug', slug)
          .single();

        if (storeError) throw storeError;
        setStore(storeData);

        const { data: branchesData, error: branchError } = await supabase
          .from('branches')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('is_active', true);

        let initialBranch = null;

        if (!branchError && branchesData) {
          setBranches(branchesData);

          const savedBranchId = localStorage.getItem(`rivapp_branch_${storeData.id}`);
          const foundSaved = branchesData.find((branch) => branch.id === savedBranchId);

          if (foundSaved) {
            initialBranch = foundSaved;
          } else if (branchesData.length === 1) {
            initialBranch = branchesData[0];
          }
        } else {
          setBranches([]);
        }

        setSelectedBranch(initialBranch);

        if (currentUser && storeData) {
          await determineUserRole(currentUser.id, storeData.id, initialBranch?.id);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error('Error StoreContext:', err.message);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [location.pathname]);

  const determineUserRole = async (userId, storeId, branchId) => {
    const { data: ownerMembership } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .eq('owner_id', userId)
      .maybeSingle();

    if (ownerMembership) {
      logger.debug('Usuario es dueño');
      setRole('owner');
      return;
    }

    const { data: storeMember } = await supabase
      .from('store_memberships')
      .select('role')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (storeMember) {
      logger.debug('Usuario es staff de tienda:', storeMember.role);
      setRole(storeMember.role);
      return;
    }

    if (branchId) {
      const { data: branchMember } = await supabase
        .from('branch_memberships')
        .select('role')
        .eq('branch_id', branchId)
        .eq('user_id', userId)
        .maybeSingle();

      if (branchMember) {
        logger.debug('Usuario es staff de sucursal:', branchMember.role);
        setRole(branchMember.role);
        return;
      }
    }

    setRole('customer');
  };

  const refreshStore = async () => {
    if (!store?.slug) return;
    const { data } = await supabase.from('stores_public').select('*').eq('slug', store.slug).single();
    if (data) setStore(data);
  };

  const selectBranch = async (branch) => {
    setSelectedBranch(branch);

    if (branch && store) {
      localStorage.setItem(`rivapp_branch_${store.id}`, branch.id);
      if (user) {
        await determineUserRole(user.id, store.id, branch.id);
      }
    } else if (store) {
      localStorage.removeItem(`rivapp_branch_${store.id}`);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        store,
        branches,
        selectedBranch,
        userLocation,
        setUserLocation,
        selectBranch,
        refreshStore,
        loading,
        error,
        user,
        role,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
