import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS (por si acaso)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Configurar Cliente Supabase (Admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '' // ⚠️ Usa SERVICE_ROLE_KEY, no la anónima
    )

    // 2. Leer datos de la URL y del Body
    const requestUrl = new URL(req.url)
    const store_id = requestUrl.searchParams.get('store_id') // <--- EL DATO CLAVE
    
    // MP a veces manda datos por Query y a veces por Body
    let body = {}
    try { body = await req.json() } catch (_) {}
    
    const type = body.type || requestUrl.searchParams.get('type') || body.topic
    const paymentId = body.data?.id || requestUrl.searchParams.get('data.id') || body.id

    // Solo nos interesa si es una notificación de pago
    if (type !== 'payment' || !paymentId) {
       return new Response('OK', { status: 200 })
    }

    console.log(`🔔 Webhook recibido. Store: ${store_id}, Payment ID: ${paymentId}`)

    // 3. Obtener el Token CORRECTO (Dinámico)
    let accessToken = Deno.env.get('MASTER_SERVICE_KEY') // Por defecto, el tuyo

    if (store_id) {
        // Si viene un ID de tienda, buscamos SUS credenciales
        const { data: secret, error } = await supabaseAdmin
            .from('store_secrets')
            .select('mp_access_token')
            .eq('id', store_id)
            .single()
        
        if (!error && secret?.mp_access_token) {
            accessToken = secret.mp_access_token
            console.log(`🔑 Usando credenciales del Store ID ${store_id}`)
        } else {
            console.error(`❌ No se encontraron credenciales para Store ID ${store_id}`)
            return new Response('Store credentials not found', { status: 400 })
        }
    }

    // 4. Consultar a Mercado Pago con la llave correcta
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    })
    
    if (!mpResponse.ok) {
        console.error("❌ Error consultando MP:", await mpResponse.text())
        return new Response('Error fetching payment', { status: 400 })
    }

    const paymentData = await mpResponse.json()

    // 5. Si está aprobado, actualizamos la base de datos
    if (paymentData.status === 'approved') {
        const orderId = paymentData.external_reference // Este es el ID de tu orden o turno
        const amount = paymentData.transaction_amount

        console.log(`✅ Pago Aprobado! ID Ref: ${orderId}, Monto: ${amount}`)

        // A. Intentamos actualizar GASTRONOMÍA (orders)
        const { error: orderError, data: orderData } = await supabaseAdmin
            .from('orders')
            .update({ status: 'confirmado', payment_status: 'paid', payment_id: paymentId })
            .eq('id', orderId)
            .select()

        // B. Si no era una orden, intentamos actualizar TURNOS (appointments)
        if (!orderData || orderData.length === 0) {
             const { error: aptError } = await supabaseAdmin
                .from('appointments')
                .update({ status: 'confirmado', payment_method: 'mercadopago', payment_id: paymentId })
                .eq('id', orderId)
            
             if (!aptError) console.log("✂️ Turno actualizado correctamente")
        } else {
             console.log("🍔 Pedido actualizado correctamente")
        }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error("❌ Error CRÍTICO Webhook:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})