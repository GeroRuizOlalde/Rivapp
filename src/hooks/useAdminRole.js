import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export function useAdminRole(storeId) {
  const [role, setRole] = useState(null); // 'owner', 'admin', 'manager', 'staff'
  const [scope, setScope] = useState(null); // 'store' (Global) o 'branch' (Local)
  const [assignedBranchId, setAssignedBranchId] = useState(null); // Si es manager, de qué sucursal
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    const fetchRole = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
          setLoading(false);
          return;
      }

      // 1. ¿Soy Dueño/Admin Global?
      const { data: storeMem } = await supabase
        .from('store_memberships')
        .select('role')
        .eq('store_id', storeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (storeMem) {
        setRole(storeMem.role); // 'owner'
        setScope('store'); // Veo todo
        setLoading(false);
        return;
      }

      // 2. Si no, ¿Soy Gerente/Staff de Sucursal?
      // (Aquí buscamos en todas las branches de este store)
      const { data: branchMem } = await supabase
        .from('branch_memberships')
        .select('role, branch_id, branches!inner(store_id)')
        .eq('branches.store_id', storeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (branchMem) {
        setRole(branchMem.role); // 'manager' o 'staff'
        setScope('branch'); // Veo solo mi sucursal
        setAssignedBranchId(branchMem.branch_id);
      }

      setLoading(false);
    };

    fetchRole();
  }, [storeId]);

  // Helpers visuales para tu UI
  const isOwner = role === 'owner';
  const canEditMenu = ['owner', 'admin', 'manager'].includes(role);
  const canViewMetrics = ['owner', 'admin'].includes(role);

  return { role, scope, assignedBranchId, loading, isOwner, canEditMenu, canViewMetrics };
}