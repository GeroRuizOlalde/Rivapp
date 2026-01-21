import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Recibir datos (incluyendo domain_url para redirección dinámica)
    const { store_id, price, title, domain_url } = await req.json()

    // 2. Configurar URLs
    // Si el frontend manda la URL, la usamos. Si no, usamos la de producción por defecto.
    const baseUrl = domain_url || "https://rivapp.com.ar";
    
    // 🟢 ESTA ES LA URL DEL "ESCUCHA" (Tu Webhook)
    // Usé el ID de proyecto que salió en tu error anterior: nnqxvbbrikjtcxbiusrb
    const webhookUrl = "https://nnqxvbbrikjtcxbiusrb.supabase.co/functions/v1/payment-webhook";

    // 3. Validar Token MP
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpAccessToken) {
      throw new Error("Falta configurar el MP_ACCESS_TOKEN en Supabase Secrets")
    }

    // 4. Crear Preferencia en Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpAccessToken}`
      },
      body: JSON.stringify({
        items: [
          {
            title: title || "Suscripción Pro",
            quantity: 1,
            currency_id: "ARS",
            unit_price: Number(price)
          }
        ],
        // Referencia para saber QUIÉN pagó
        external_reference: store_id, 
        
        // A dónde vuelve el usuario (Dinámico)
        back_urls: {
          success: `${baseUrl}/admin?payment=success`, 
          failure: `${baseUrl}/admin?payment=failure`,
          pending: `${baseUrl}/admin?payment=pending`
        },
        auto_return: "approved",

        // 🟢 EL CABLE A TIERRA: Avisar al sistema cuando paguen
        notification_url: webhookUrl
      })
    })

    const data = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error("Error MP API:", data)
      throw new Error(`Error de MercadoPago: ${data.message || 'Desconocido'}`)
    }

    // 5. Devolver link de pago
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error("Error en Function:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})