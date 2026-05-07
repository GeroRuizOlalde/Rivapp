// ============================================================================
// create-team-member — El dueño da acceso directo a un usuario.
// ============================================================================
// Flujo simple sin "aceptación" del invitado:
//   1) Si el email NO existe en auth.users → crear user con password seteado
//      y email_confirm:true (no requiere confirmar mail).
//   2) Si el email YA existe → reutilizar el user (no se le toca el password).
//   3) Crear membership según scope (store completa o branch específica).
//   4) Mandar email al invitado con sus credenciales (si corresponde).
//
// Body: {
//   store_id, email, role,
//   branch_id (opcional — si viene, scope=branch),
//   password (opcional — si viene y es user nuevo, se setea; si user existía
//             se IGNORA por seguridad)
// }
// Respuesta: {
//   success: true,
//   user_id, email,
//   was_new_user: boolean,
//   temp_password (solo si was_new_user, para que el dueño la muestre)
// }
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

function randomPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  for (let i = 0; i < length; i++) out += chars[buf[i] % chars.length];
  return out;
}

async function findUserByEmail(supabase: ReturnType<typeof createClient>, email: string) {
  const target = email.toLowerCase();
  // listUsers es pageado; iteramos hasta encontrarlo o agotarlo.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data?.users?.find((u: { email?: string }) => (u.email || '').toLowerCase() === target);
    if (found) return found;
    if (!data?.users || data.users.length < 200) break;
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { store_id, email, role, branch_id, password: providedPassword } = body || {};

    if (!store_id) return json({ error: 'Falta store_id' }, 400);
    if (!email) return json({ error: 'Falta email' }, 400);
    if (!VALID_ROLES.includes(role)) return json({ error: 'Rol inválido' }, 400);

    const cleanEmail = String(email).trim().toLowerCase();

    // Validar tienda existe
    const { data: store } = await supabase
      .from('stores')
      .select('id, name, slug')
      .eq('id', store_id)
      .maybeSingle();
    if (!store) return json({ error: 'Tienda no encontrada' }, 404);

    // Si se pidió scope branch, validar que la branch sea de esa tienda
    if (branch_id) {
      const { data: branch } = await supabase
        .from('branches')
        .select('id, store_id, name')
        .eq('id', branch_id)
        .maybeSingle();
      if (!branch || branch.store_id !== store_id) {
        return json({ error: 'La sucursal no pertenece a esta tienda' }, 400);
      }
    }

    // ¿El user ya existe?
    let user = await findUserByEmail(supabase, cleanEmail);
    let wasNewUser = false;
    let tempPassword: string | null = null;

    if (!user) {
      // Crear user nuevo. Si el dueño no eligió password, generar uno.
      const pwd = providedPassword && String(providedPassword).length >= 6
        ? String(providedPassword)
        : randomPassword(12);

      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: pwd,
        email_confirm: true, // ya validado por el dueño que invita
      });
      if (createErr) {
        console.error('createUser error:', createErr);
        return json({ error: 'No se pudo crear el usuario: ' + createErr.message }, 500);
      }
      user = created.user;
      wasNewUser = true;
      tempPassword = pwd;
    }

    if (!user?.id) return json({ error: 'No se pudo identificar/crear el usuario' }, 500);

    // No permitir que el dueño se agregue como miembro de su propia tienda
    if (user.id === (await supabase.from('stores').select('owner_id').eq('id', store_id).maybeSingle()).data?.owner_id) {
      return json({ error: 'Esa cuenta ya es la dueña de esta tienda' }, 400);
    }

    // Limpiar memberships previos en esta tienda (idempotente)
    await supabase
      .from('store_memberships')
      .delete()
      .eq('store_id', store_id)
      .eq('user_id', user.id);
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
        .eq('user_id', user.id);
    }

    // Crear membership según scope
    if (branch_id) {
      const { error: insErr } = await supabase
        .from('branch_memberships')
        .insert([{ branch_id, user_id: user.id, role }]);
      if (insErr) {
        console.error('Insert branch_memberships:', insErr);
        return json({ error: insErr.message }, 500);
      }
    } else {
      const { error: insErr } = await supabase
        .from('store_memberships')
        .insert([{ store_id, user_id: user.id, role }]);
      if (insErr) {
        console.error('Insert store_memberships:', insErr);
        return json({ error: insErr.message }, 500);
      }
    }

    // Mandar email con credenciales si era user nuevo (best-effort, no bloquea)
    let emailSent = false;
    let emailError: string | null = null;
    if (wasNewUser && tempPassword) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL');
      if (RESEND_API_KEY && RESEND_FROM_EMAIL) {
        try {
          const origin = req.headers.get('origin') || '';
          const loginUrl = origin ? `${origin}/login` : '';
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: RESEND_FROM_EMAIL,
              to: [cleanEmail],
              subject: `Tenés acceso al equipo de ${store.name}`,
              html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                  <h1 style="font-size: 22px; margin: 0 0 16px;">Bienvenido a Rivapp</h1>
                  <p>Te dieron acceso al panel de <strong>${store.name}</strong> con el rol <strong>${role.toUpperCase()}</strong>.</p>
                  <div style="background: #f6f6f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #666;">Tus credenciales</p>
                    <p style="margin: 0;"><strong>Email:</strong> ${cleanEmail}</p>
                    <p style="margin: 4px 0 0;"><strong>Contraseña temporal:</strong> <code style="background:#fff;padding:4px 8px;border-radius:4px;font-size:14px;">${tempPassword}</code></p>
                  </div>
                  <p>Te recomendamos cambiarla la primera vez que ingreses.</p>
                  ${loginUrl ? `<p style="text-align:center;margin:24px 0;"><a href="${loginUrl}" style="background:#d0ff00;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Ingresar</a></p>` : ''}
                  <p style="font-size: 12px; color: #999; margin-top: 24px;">Si no esperabas este correo, podés ignorarlo.</p>
                </div>
              `,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            console.error('Resend error:', data);
            emailError = data.message || 'Error desconocido';
          } else {
            emailSent = true;
          }
        } catch (e) {
          console.error('Error mandando email:', e);
          emailError = (e as Error).message;
        }
      } else {
        emailError = 'RESEND no configurado';
      }
    }

    return json({
      success: true,
      user_id: user.id,
      email: cleanEmail,
      was_new_user: wasNewUser,
      temp_password: tempPassword, // solo si era nuevo
      email_sent: emailSent,
      email_error: emailError,
    });
  } catch (error) {
    console.error('Error en create-team-member:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
