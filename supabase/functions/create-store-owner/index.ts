import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('MASTER_URL') || Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('MASTER_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log("LOG: Iniciando petición...");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("LOG ERROR: Faltan llaves maestras en el servidor");
      return new Response(JSON.stringify({ error: "Configuración incompleta en el servidor" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const body = await req.json()
    console.log("LOG BODY RECIBIDO:", body);

    const { email, password, name } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email y Password requeridos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // INTENTO DE CREACIÓN
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: name, role: 'store_owner' }
    })

    if (createError) {
      console.error("LOG ERROR SUPABASE AUTH:", createError.message);

      // Si el usuario ya existe, buscarlo y devolver su ID
      if (createError.message?.includes('already been registered') || createError.message?.includes('already exists')) {
        console.log("LOG: Usuario ya existe, buscando ID...");
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData?.users?.find((u: any) => u.email === email);
        if (existingUser) {
          console.log("LOG: Usuario existente encontrado:", existingUser.id);
          return new Response(JSON.stringify({ user_id: existingUser.id, existing: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log("LOG: Usuario creado exitosamente!");
    return new Response(JSON.stringify({ user_id: newUser.user.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("LOG ERROR CATCH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})