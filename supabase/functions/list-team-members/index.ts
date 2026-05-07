// ============================================================================
// list-team-members — Devuelve los miembros activos de una tienda combinando
// store_memberships + branch_memberships + email de auth.users (que no es
// accesible desde el cliente por RLS).
//
// Body: { store_id }
// Respuesta: { members: [{ id, user_id, email, role, scope, branch_id, branch_name, source }] }
//   - scope: 'store' (acceso a toda la tienda) | 'branch' (sucursal específica)
//   - source: 'store_memberships' | 'branch_memberships' (para edit/delete)
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

    const { store_id } = await req.json();
    if (!store_id) return json({ error: 'Falta store_id' }, 400);

    // 1) Memberships a nivel TIENDA
    const { data: storeRows, error: storeErr } = await supabase
      .from('store_memberships')
      .select('id, user_id, role, created_at')
      .eq('store_id', store_id);
    if (storeErr) {
      console.error('store_memberships:', storeErr);
      return json({ error: storeErr.message }, 500);
    }

    // 2) Memberships a nivel SUCURSAL — solo de las branches de esta tienda
    const { data: branchRows, error: branchErr } = await supabase
      .from('branch_memberships')
      .select('id, user_id, role, branch_id, created_at, branches(id, name, store_id)')
      .eq('branches.store_id', store_id);
    if (branchErr) {
      console.error('branch_memberships:', branchErr);
      return json({ error: branchErr.message }, 500);
    }

    // 3) Owner de la tienda (no aparece en memberships)
    const { data: storeRow } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', store_id)
      .maybeSingle();

    // 4) Resolver emails desde auth.users (admin API)
    const allUserIds = Array.from(
      new Set([
        ...(storeRows?.map((r) => r.user_id) ?? []),
        ...(branchRows?.map((r) => r.user_id) ?? []),
        ...(storeRow?.owner_id ? [storeRow.owner_id] : []),
      ])
    );

    const emailByUserId: Record<string, string> = {};
    for (const userId of allUserIds) {
      try {
        const { data } = await supabase.auth.admin.getUserById(userId);
        if (data?.user?.email) emailByUserId[userId] = data.user.email;
      } catch (e) {
        console.error(`No pude resolver email de ${userId}:`, e);
      }
    }

    const members: Array<Record<string, unknown>> = [];

    // Owner siempre primero (no editable, sin source)
    if (storeRow?.owner_id) {
      members.push({
        id: `owner-${storeRow.owner_id}`,
        user_id: storeRow.owner_id,
        email: emailByUserId[storeRow.owner_id] || '(dueño)',
        role: 'owner',
        scope: 'store',
        branch_id: null,
        branch_name: null,
        source: 'owner',
        editable: false,
      });
    }

    // Memberships a nivel tienda
    (storeRows || []).forEach((r) => {
      // No duplicar el owner si por algún motivo está en store_memberships
      if (r.user_id === storeRow?.owner_id) return;
      members.push({
        id: r.id,
        user_id: r.user_id,
        email: emailByUserId[r.user_id] || '—',
        role: r.role,
        scope: 'store',
        branch_id: null,
        branch_name: null,
        source: 'store_memberships',
        editable: true,
      });
    });

    // Memberships a nivel sucursal
    (branchRows || []).forEach((r) => {
      members.push({
        id: r.id,
        user_id: r.user_id,
        email: emailByUserId[r.user_id] || '—',
        role: r.role,
        scope: 'branch',
        branch_id: r.branch_id,
        // @ts-expect-error supabase devuelve relación
        branch_name: r.branches?.name ?? null,
        source: 'branch_memberships',
        editable: true,
      });
    });

    return json({ members });
  } catch (error) {
    console.error('Error en list-team-members:', error);
    return json({ error: error.message }, 500);
  }
});
