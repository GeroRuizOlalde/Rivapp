// ============================================================================
// get-mp-settings-status — Devuelve qué credenciales MP están cargadas para
// una tienda, sin exponer los valores. Usado por el admin para mostrar
// "configurado / sin configurar" sin requerir leer secrets desde el cliente.
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

    const { data: row, error } = await supabase
      .from('store_secrets')
      .select('mp_access_token, mp_public_key, mp_client_id, mp_client_secret')
      .eq('id', store_id)
      .maybeSingle();

    if (error) {
      console.error('Error leyendo store_secrets:', error);
      return json({ error: error.message }, 500);
    }

    return json({
      has: {
        mp_access_token: Boolean(row?.mp_access_token),
        mp_public_key: Boolean(row?.mp_public_key),
        mp_client_id: Boolean(row?.mp_client_id),
        mp_client_secret: Boolean(row?.mp_client_secret),
      },
    });
  } catch (error) {
    console.error('Error en get-mp-settings-status:', error);
    return json({ error: error.message }, 500);
  }
});
