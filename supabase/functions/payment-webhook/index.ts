// ============================================================================
// payment-webhook — Cobros de SUSCRIPCIÓN del SaaS (dueños hacia Rivapp)
// ============================================================================
// Recibe notificaciones de MP por pagos de planes Rivapp hechos por dueños de
// tienda. Usa la cuenta MP MASTER (env MP_ACCESS_TOKEN). El external_reference
// del pago es el store_id que se setea en `create-checkout`. El plan_id se
// recibe vía paymentData.metadata.plan_id (lo manda create-checkout).
//
// Al confirmarse el pago, extiende `subscription_expiry` 30 días y deja la
// tienda activa con el plan correspondiente.
//
// NO confundir con `mercadopago-webhook`, que cobra pedidos a clientes finales.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VALID_PLANS = ['emprendedor', 'profesional'];
const DEFAULT_PLAN = 'profesional';
const SUBSCRIPTION_DAYS = 30;

serve(async (req) => {
  try {
    const url = new URL(req.url);
    // MP a veces manda verificaciones, respondemos OK siempre
    if (req.method === 'POST' && url.searchParams.get('type') !== 'payment') {
      return new Response('OK', { status: 200 });
    }

    const body = await req.json();
    const paymentId = body.data?.id;

    if (!paymentId) {
      return new Response('No payment ID', { status: 200 });
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      console.error('Falta MP_ACCESS_TOKEN');
      return new Response('Server misconfigured', { status: 500 });
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    });
    const paymentData = await mpResponse.json();

    if (paymentData.status !== 'approved') {
      console.log(`Pago ${paymentId} en estado ${paymentData.status} — sin acción`);
      return new Response('OK', { status: 200 });
    }

    const storeId = paymentData.external_reference;
    if (!storeId) throw new Error('Pago sin external_reference (store_id)');

    // plan_id desde metadata; fallback a DEFAULT_PLAN si no vino o es inválido
    const rawPlan = paymentData.metadata?.plan_id?.toLowerCase?.();
    const planType = VALID_PLANS.includes(rawPlan) ? rawPlan : DEFAULT_PLAN;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + SUBSCRIPTION_DAYS);

    const { error } = await supabase
      .from('stores')
      .update({
        plan_type: planType,
        subscription_status: 'active',
        subscription_expiry: newExpiry.toISOString(),
      })
      .eq('id', storeId);

    if (error) {
      console.error('Error actualizando DB:', error);
      throw error;
    }

    // Log del pago para auditoría (no bloquea si falla)
    const { error: logError } = await supabase.from('subscription_payments').insert([
      {
        store_id: storeId,
        amount: paymentData.transaction_amount,
        payment_method: 'mercadopago',
        status: 'completed',
      },
    ]);
    if (logError) console.error('No se pudo loggear el pago:', logError.message);

    console.log(`Tienda ${storeId} actualizada a ${planType} (vence ${newExpiry.toISOString()})`);
    return new Response('Webhook Received', { status: 200 });
  } catch (error) {
    console.error('Error Webhook:', error.message);
    return new Response('Error', { status: 500 });
  }
});
