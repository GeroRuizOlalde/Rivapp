// ============================================================================
// save-mp-settings — Guarda credenciales MP de la TIENDA en store_secrets.
// ============================================================================
// Llamada desde el admin al guardar Ajustes → MP. Solo guarda los campos no
// vacíos (no pisa con strings vacíos los que ya están cargados — útil cuando
// el frontend muestra bullets y el usuario no los re-escribe).
//
// Devuelve `has` con flags de qué credenciales quedaron cargadas (útil para
// que la UI muestre estado de "configurado" sin exponer los valores).
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

    const body = await req.json();
    const { store_id, mp_access_token, mp_public_key, mp_client_id, mp_client_secret } = body || {};

    if (!store_id) return json({ error: 'Falta el ID de la tienda' }, 400);

    // Solo persistimos los campos que vinieron con valor — esto evita pisar
    // con string vacío credenciales ya cargadas si el form solo cambió uno.
    const updatePayload: Record<string, unknown> = {
      id: store_id,
      updated_at: new Date().toISOString(),
    };
    if (mp_access_token) updatePayload.mp_access_token = mp_access_token;
    if (mp_public_key) updatePayload.mp_public_key = mp_public_key;
    if (mp_client_id) updatePayload.mp_client_id = mp_client_id;
    if (mp_client_secret) updatePayload.mp_client_secret = mp_client_secret;

    const { error } = await supabase.from('store_secrets').upsert(updatePayload);
    if (error) {
      console.error('Error en upsert store_secrets:', error);
      return json({ error: error.message }, 500);
    }

    // Releemos el row para devolver flags de qué quedó cargado.
    const { data: row } = await supabase
      .from('store_secrets')
      .select('mp_access_token, mp_public_key, mp_client_id, mp_client_secret')
      .eq('id', store_id)
      .maybeSingle();

    return json(
      {
        success: true,
        message: 'Configuración guardada',
        has: {
          mp_access_token: Boolean(row?.mp_access_token),
          mp_public_key: Boolean(row?.mp_public_key),
          mp_client_id: Boolean(row?.mp_client_id),
          mp_client_secret: Boolean(row?.mp_client_secret),
        },
      },
      200
    );
  } catch (error) {
    console.error('Error en save-mp-settings:', error);
    return json({ error: error.message }, 500);
  }
});
