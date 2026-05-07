// ============================================================================
// accept-invitation — Convierte una team_invitations en una membership real
// (store o branch) cuando el usuario invitado se registra y entra al link.
//
// Body: { invite_id, user_id, user_email }
// Respuesta: { success: true, store: { id, slug }, role }
//
// Validaciones:
//   - La invitación existe y está en estado 'pending'
//   - El email del user coincide con el email de la invitación (case insensitive)
//   - Si ya hay un membership previo para ese (store, user), no duplica
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

    const { invite_id, user_id: clientUserId, user_email, password } = await req.json();
    if (!invite_id) return json({ error: 'Falta invite_id' }, 400);
    if (!user_email) return json({ error: 'Falta user_email' }, 400);

    // 1) Cargar invitación
    const { data: invite, error: invErr } = await supabase
      .from('team_invitations')
      .select('id, store_id, email, role, branch_id, status, stores(id, slug)')
      .eq('id', invite_id)
      .maybeSingle();

    if (invErr) {
      console.error('Error leyendo invitación:', invErr);
      return json({ error: invErr.message }, 500);
    }
    if (!invite) {
      return json({ error: 'Invitación no encontrada o expirada' }, 404);
    }
    if (invite.status !== 'pending') {
      return json({ error: 'Esta invitación ya fue usada' }, 400);
    }
    if (String(invite.email).toLowerCase() !== String(user_email).toLowerCase()) {
      return json(
        { error: 'El email de tu cuenta no coincide con el de la invitación' },
        403
      );
    }

    // 2) Resolver el user_id REAL desde auth.users por email.
    // Esto evita el bug de anti-enumeration de Supabase: cuando signUp se hace
    // con un email que ya existía, devuelve un user_id obfuscado que NO existe
    // en auth.users → el insert de membership tira FK violation. Buscando por
    // email obtenemos siempre el user real.
    let user_id = clientUserId;
    try {
      const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (listErr) {
        console.error('listUsers error:', listErr);
      } else {
        const realUser = usersData?.users?.find(
          (u: { email?: string }) =>
            (u.email || '').toLowerCase() === String(user_email).toLowerCase()
        );
        if (realUser?.id) {
          user_id = realUser.id;
        } else {
          console.error('No encontré user real para email:', user_email);
        }
      }
    } catch (e) {
      console.error('Error resolviendo user_id:', e);
    }

    if (!user_id) return json({ error: 'No se pudo identificar tu cuenta' }, 400);

    // 3) Crear membership según scope
    if (invite.branch_id) {
      // Validar que la branch siga existiendo
      const { data: branch } = await supabase
        .from('branches')
        .select('id')
        .eq('id', invite.branch_id)
        .maybeSingle();
      if (!branch) {
        return json({ error: 'La sucursal de esta invitación ya no existe' }, 400);
      }
      const { error: insErr } = await supabase
        .from('branch_memberships')
        .upsert(
          { branch_id: invite.branch_id, user_id, role: invite.role },
          { onConflict: 'branch_id,user_id' }
        );
      if (insErr) {
        console.error('Insert branch_memberships:', insErr);
        return json({ error: insErr.message }, 500);
      }
    } else {
      // Scope tienda completa
      const { error: insErr } = await supabase
        .from('store_memberships')
        .upsert(
          { store_id: invite.store_id, user_id, role: invite.role },
          { onConflict: 'store_id,user_id' }
        );
      if (insErr) {
        console.error('Insert store_memberships:', insErr);
        return json({ error: insErr.message }, 500);
      }
    }

    // 4) Marcar invitación como aceptada
    const { error: updErr } = await supabase
      .from('team_invitations')
      .update({ status: 'accepted' })
      .eq('id', invite_id);
    if (updErr) {
      console.error('Update team_invitations:', updErr);
      // No bloqueamos por esto, el membership ya quedó creado.
    }

    // 5) Auto-confirmar email + sincronizar password.
    // - Email: el link ya llegó a esa dirección, el email está validado de hecho.
    //   Sin esto, signIn posterior tira "Email not confirmed".
    // - Password: si el email YA existía en auth.users (de un signUp viejo),
    //   el signUp del invitado NO actualiza el password (anti-enumeration de
    //   Supabase). Entonces el password que el invitado puso en el form NUNCA
    //   queda guardado y al hacer logout no puede volver. Lo seteamos acá.
    try {
      const updates: { email_confirm: boolean; password?: string } = {
        email_confirm: true,
      };
      if (password) updates.password = password;
      await supabase.auth.admin.updateUserById(user_id, updates);
    } catch (confirmErr) {
      console.error('No se pudo auto-confirmar/actualizar:', confirmErr);
      // No bloqueamos: el membership ya quedó creado.
    }

    return json({
      success: true,
      // @ts-expect-error supabase devuelve relación
      store: { id: invite.stores?.id, slug: invite.stores?.slug },
      role: invite.role,
    });
  } catch (error) {
    console.error('Error en accept-invitation:', error);
    return json({ error: error.message }, 500);
  }
});
