// ============================================================================
// payment-webhook — Cobros de SUSCRIPCIÓN del SaaS (dueños hacia Rivapp)
// ============================================================================
// Recibe notificaciones de MP por pagos de planes Rivapp hechos por dueños de
// tienda. Usa la cuenta MP MASTER (env MP_ACCESS_TOKEN). El external_reference
// del pago es el store_id que se setea en `create-checkout`. Al confirmarse,
// extiende `subscription_expiry` 30 días y deja la tienda activa.
//
// NO confundir con `mercadopago-webhook`, que cobra pedidos a clientes finales.
//
// ⚠️ TODO crítico: el plan_type queda hardcodeado en 'profesional'. Cuando se
// vendan ambos planes, `create-checkout` debe poner el plan_id en
// preference.metadata.plan_id, y acá leer paymentData.metadata.plan_id para
// asignar el plan correcto. Hoy la fuente única de planes está en
// src/config/plans.js (frontend) — usar los mismos IDs ('emprendedor' /
// 'profesional').
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    // Mercado Pago a veces manda verificaciones, respondemos OK siempre
    if (req.method === 'POST' && url.searchParams.get('type') !== 'payment') {
      return new Response('OK', { status: 200 })
    }

    // 1. Obtener datos de la notificación
    const body = await req.json()
    const paymentId = body.data?.id

    if (!paymentId) {
        return new Response('No payment ID', { status: 200 })
    }

    // 2. Consultar a Mercado Pago el estado real de ese pago
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${mpAccessToken}` }
    })
    const paymentData = await mpResponse.json()

    // 3. Si está APROBADO, actualizamos la tienda
    if (paymentData.status === 'approved') {
        const storeId = paymentData.external_reference // Aquí viene el ID de la tienda
        
        if (!storeId) throw new Error("Pago sin referencia de tienda")

        // Conectar a Supabase
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Usamos la Service Role para tener permisos de escritura
        )

        // Calcular nueva fecha (Hoy + 30 días)
        const newExpiry = new Date()
        newExpiry.setDate(newExpiry.getDate() + 30)

        // Actualizar la tienda
        const { error } = await supabase
            .from('stores')
            .update({
                plan_type: 'profesional', // O 'pro', según como lo tengas en tu DB
                subscription_status: 'active',
                subscription_expiry: newExpiry.toISOString()
            })
            .eq('id', storeId)

        if (error) {
            console.error("Error actualizando DB:", error)
            throw error
        }
        
        console.log(`Tienda ${storeId} actualizada a PRO exitosamente.`)
    }

    return new Response('Webhook Received', { status: 200 })

  } catch (error) {
    console.error("Error Webhook:", error.message)
    return new Response('Error', { status: 500 })
  }
})