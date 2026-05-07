// ============================================================================
// update-team-member — Cambia el rol y/o el scope (tienda/sucursal) de un
// miembro existente. Si cambia entre scopes, mueve la fila entre
// store_memberships y branch_memberships.
//
// Body: { store_id, user_id, new_role, new_scope ('store' | 'branch'),
//         new_branch_id (si scope='branch') }
// Respuesta: { success: true }
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const VALID_ROLES = ['admin', 'manager', 'staff', 'rider'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { store_id, user_id, new_role, new_scope, new_branch_id } = await req.json();

    if (!store_id) return json({ error: 'Falta store_id' }, 400);
    if (!user_id) return json({ error: 'Falta user_id' }, 400);
    if (!VALID_ROLES.includes(new_role)) return json({ error: 'Rol inválido' }, 400);
    if (!['store', 'branch'].includes(new_scope)) return json({ error: 'Scope inválido' }, 400);
    if (new_scope === 'branch' && !new_branch_id) {
      return json({ error: 'Falta new_branch_id para scope branch' }, 400);
    }

    // === AUTHZ ===
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Falta autenticación' }, 401);
    const { data: callerData, error: callerErr } = await supabase.auth.getUser(token);
    if (callerErr || !callerData?.user?.id) return json({ error: 'Sesión inválida' }, 401);
    const callerId = callerData.user.id;

    const { data: storeRow } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', store_id)
      .maybeSingle();
    if (storeRow?.owner_id === user_id) {
      return json({ error: 'El dueño no se puede editar desde acá' }, 400);
    }

    // Resolver rol del caller en esta tienda
    let callerRole: string | null = null;
    let callerBranchId: string | null = null;
    if (storeRow?.owner_id === callerId) {
      callerRole = 'owner';
    } else {
      const { data: storeMembership } = await supabase
        .from('store_memberships')
        .select('role')
        .eq('store_id', store_id)
        .eq('user_id', callerId)
        .maybeSingle();
      if (storeMembership) {
        callerRole = storeMembership.role;
      } else {
        const { data: storeBranches } = await supabase
          .from('branches')
          .select('id')
          .eq('store_id', store_id);
        const branchIds = (storeBranches || []).map((b) => b.id);
        if (branchIds.length > 0) {
          const { data: branchMembership } = await supabase
            .from('branch_memberships')
            .select('role, branch_id')
            .in('branch_id', branchIds)
            .eq('user_id', callerId)
            .maybeSingle();
          if (branchMembership) {
            callerRole = branchMembership.role;
            callerBranchId = branchMembership.branch_id;
          }
        }
      }
    }

    if (!callerRole || !['owner', 'admin', 'manager'].includes(callerRole)) {
      return json({ error: 'No tenés permiso para editar miembros' }, 403);
    }

    // Manager: solo edita staff/rider de SU sucursal
    if (callerRole === 'manager') {
      if (!['staff', 'rider'].includes(new_role)) {
        return json({ error: 'Como gerente solo podés asignar staff o rider' }, 403);
      }
      if (new_scope !== 'branch' || new_branch_id !== callerBranchId) {
        return json({ error: 'Solo podés modificar miembros de tu propia sucursal' }, 403);
      }
    }

    // Si scope='branch', validar que la branch sea de esta tienda
    if (new_scope === 'branch') {
      const { data: branch } = await supabase
        .from('branches')
        .select('id, store_id')
        .eq('id', new_branch_id)
        .maybeSingle();
      if (!branch || branch.store_id !== store_id) {
        return json({ error: 'La sucursal no pertenece a esta tienda' }, 400);
      }
    }

    // Limpiar TODAS las membresías previas del usuario en esta tienda
    // (tanto store-level como branch-level de cualquier sucursal de la tienda)
    await supabase
      .from('store_memberships')
      .delete()
      .eq('store_id', store_id)
      .eq('user_id', user_id);

    const { data: storeBranches } = await supabase
      .from('branches')
      .select('id')
      .eq('store_id', store_id);
    const branchIds = (storeBranches || []).map((b) => b.id);
    if (branchIds.length > 0) {
      await supabase
        .from('branch_memberships')
        .delete()
        .in('branch_id', branchIds)
        .eq('user_id', user_id);
    }

    // Insertar la nueva
    if (new_scope === 'store') {
      const { error } = await supabase
        .from('store_memberships')
        .insert([{ store_id, user_id, role: new_role }]);
      if (error) {
        console.error('Insert store_memberships:', error);
        return json({ error: error.message }, 500);
      }
    } else {
      const { error } = await supabase
        .from('branch_memberships')
        .insert([{ branch_id: new_branch_id, user_id, role: new_role }]);
      if (error) {
        console.error('Insert branch_memberships:', error);
        return json({ error: error.message }, 500);
      }
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error en update-team-member:', error);
    return json({ error: error.message }, 500);
  }
});
