import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Obtener los datos que envía Mercado Pago
    const url = new URL(req.url)
    const body = await req.json()
    
    // MP envía el ID del pago en body.data.id o en el query string
    const paymentId = body.data?.id || url.searchParams.get('data.id')
    const type = body.type || url.searchParams.get('type')

    console.log(`🔔 Recibida notificación de MP: Tipo ${type}, ID: ${paymentId}`)

    if (type === 'payment' && paymentId) {
      // 2. Consultar el estado real del pago en la API de Mercado Pago
      // Nota: Aquí necesitarías el access_token del comercio. 
      // Por simplicidad, buscamos el pedido que coincida con el external_reference que MP devuelve
      
      // Consultamos a MP (usando tu token maestro o el del local)
      // Para esta versión, vamos a buscar el pago y validar su estado
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${Deno.env.get('MASTER_SERVICE_KEY')}` } // Usamos el token que guardamos
      })
      
      const paymentData = await mpResponse.json()

      if (paymentData.status === 'approved') {
        const orderId = paymentData.external_reference // El ID que enviamos al crear la preferencia

        // 3. Actualizar el pedido en la DB
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({ paid: true, status: 'confirmado' }) // Lo marcamos como pagado y confirmado automáticamente
          .eq('id', orderId)

        if (updateError) throw updateError
        console.log(`✅ Pedido #${orderId} marcado como PAGADO automáticamente.`)
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error("❌ Error Webhook:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})