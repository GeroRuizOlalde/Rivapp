// supabase/functions/save-mp-settings/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. Crear cliente Supabase con privilegios de ADMIN (Service Role)
  // Esto es necesario para poder escribir en campos protegidos.
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 2. Obtener el usuario que hace la petición (Seguridad)
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // 3. Obtener datos del body
  const { store_id, mp_public_key, mp_access_token } = await req.json()

  // 4. Validar que el usuario sea el DUEÑO de esa tienda
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('owner_id')
    .eq('id', store_id)
    .single()

  if (!store || store.owner_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden: No sos el dueño.' }), { status: 403 })
  }

  // 5. Guardar los tokens de forma segura
  const { error: updateError } = await supabaseAdmin
    .from('stores')
    .update({ 
      mp_public_key, 
      mp_access_token 
    })
    .eq('id', store_id)

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 400 })
  }

  return new Response(
    JSON.stringify({ message: 'Credenciales guardadas con éxito', success: true }),
    { headers: { "Content-Type": "application/json" } }
  )
})