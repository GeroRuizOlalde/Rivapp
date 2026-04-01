import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Crear cliente Supabase usando la variable CORRECTA
    // CAMBIO AQUÍ: Usamos 'SERVICE_ROLE_KEY' (sin el SUPABASE_)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '' 
    )

    // 3. Obtener los datos que envía el Admin Panel
    const { 
      store_id, 
      mp_access_token, 
      mp_public_key,
      mp_client_id, 
      mp_client_secret 
    } = await req.json()

    if (!store_id) throw new Error('Falta el ID de la tienda')

    // 4. Guardar en la nueva tabla 'store_secrets'
    const { error } = await supabaseClient
      .from('store_secrets')
      .upsert({
        id: store_id,
        mp_access_token,
        mp_public_key,
        mp_client_id,
        mp_client_secret,
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, message: 'Configuración guardada en bóveda segura' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})