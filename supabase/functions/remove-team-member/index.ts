// ============================================================================
// remove-team-member — Saca un miembro de la tienda. Borra todas sus
// membresías (store-level y branch-level) en esa tienda. NO borra la cuenta
// de auth — el user puede seguir existiendo, simplemente no tiene acceso.
//
// Body: { store_id, user_id }
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { store_id, user_id } = await req.json();
    if (!store_id) return json({ error: 'Falta store_id' }, 400);
    if (!user_id) return json({ error: 'Falta user_id' }, 400);

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
      return json({ error: 'No se puede quitar al dueño de su propia tienda' }, 400);
    }

    // Resolver rol del caller
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
      return json({ error: 'No tenés permiso para quitar miembros' }, 403);
    }

    // Manager: solo quita miembros que son de SU sucursal
    if (callerRole === 'manager') {
      if (!callerBranchId) {
        return json({ error: 'Tu cuenta no tiene sucursal asignada' }, 403);
      }
      const { data: targetBranchMember } = await supabase
        .from('branch_memberships')
        .select('branch_id')
        .eq('user_id', user_id)
        .eq('branch_id', callerBranchId)
        .maybeSingle();
      if (!targetBranchMember) {
        return json({ error: 'Solo podés quitar miembros de tu propia sucursal' }, 403);
      }
    }

    // Borrar store-level memberships
    const { error: storeErr } = await supabase
      .from('store_memberships')
      .delete()
      .eq('store_id', store_id)
      .eq('user_id', user_id);
    if (storeErr) {
      console.error('Delete store_memberships:', storeErr);
      return json({ error: storeErr.message }, 500);
    }

    // Borrar branch-level memberships en sucursales de esta tienda
    const { data: storeBranches } = await supabase
      .from('branches')
      .select('id')
      .eq('store_id', store_id);
    const branchIds = (storeBranches || []).map((b) => b.id);
    if (branchIds.length > 0) {
      const { error: branchErr } = await supabase
        .from('branch_memberships')
        .delete()
        .in('branch_id', branchIds)
        .eq('user_id', user_id);
      if (branchErr) {
        console.error('Delete branch_memberships:', branchErr);
        return json({ error: branchErr.message }, 500);
      }
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error en remove-team-member:', error);
    return json({ error: error.message }, 500);
  }
});
