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
    // 2. Definir URL Base (Fallback seguro)
    let baseUrl = req.headers.get('origin')
    if (!baseUrl || baseUrl === 'null') {
        baseUrl = 'http://localhost:5173'
    }

    // 3. Cliente Supabase (Con llave maestra para leer secrets protegidos por RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '' 
    )

    // 4. Recibir datos
    const { items, store_id, delivery_cost, order_id } = await req.json()

    if (!store_id) throw new Error("Falta store_id")
    if (!order_id) throw new Error("Falta order_id")

    // 5. Buscar credenciales en la Bóveda
    const { data: secrets, error: secretError } = await supabaseClient
      .from('store_secrets')
      .select('mp_access_token')
      .eq('id', store_id)
      .single()

    if (secretError || !secrets?.mp_access_token) {
      throw new Error("El comercio no tiene configurado Mercado Pago.")
    }

    // 6. Construir URL del Webhook (El puente entre MP y tu base de datos)
    // Esto arma: https://tu-proyecto.supabase.co/functions/v1/mercadopago-webhook?store_id=123
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook?store_id=${store_id}`

    // 7. Construir preferencia para Mercado Pago
    const preferenceData = {
      items: items.map((item: any) => ({
        title: item.name,
        quantity: Number(item.quantity),
        currency_id: 'ARS',
        unit_price: Number(item.price)
      })),
      external_reference: String(order_id),
      
      // 🟢 LA LÍNEA CLAVE: Aquí le decimos a MP dónde gritar "¡PAGO APROBADO!"
      notification_url: webhookUrl, 

      back_urls: {
        success: `${baseUrl}/tracking?status=success`,
        failure: `${baseUrl}/tracking?status=failure`,
        pending: `${baseUrl}/tracking?status=pending`
      },
      auto_return: "approved"
    }

    if (delivery_cost > 0) {
      preferenceData.items.push({
        title: "Costo de Envío",
        quantity: 1,
        currency_id: 'ARS',
        unit_price: Number(delivery_cost)
      })
    }

    // 8. Enviar a Mercado Pago (Fetch directo)
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secrets.mp_access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error("Error de MP:", mpData)
      throw new Error(`Mercado Pago rechazó la solicitud: ${mpData.message || JSON.stringify(mpData)}`)
    }

    // 9. Devolver el link de pago al Frontend
    return new Response(
      JSON.stringify({ init_point: mpData.init_point, preference_id: mpData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error("Error creating preference:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Error interno al crear pago" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})