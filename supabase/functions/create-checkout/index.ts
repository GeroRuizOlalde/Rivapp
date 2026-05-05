// ============================================================================
// create-checkout — Genera la preferencia de MP para SUSCRIPCIÓN del SaaS
// ============================================================================
// Llamada desde el admin (AdminGastronomy / AdminServices) cuando el dueño
// quiere pagar el plan Rivapp. Usa la cuenta MP MASTER (env MP_ACCESS_TOKEN).
// El webhook que confirma el pago es payment-webhook.
//
// Body esperado:
//   - store_id (UUID, requerido)
//   - slug (string, requerido) - usado para armar back_urls correctas
//   - plan_id ('emprendedor' | 'profesional', opcional) - va al metadata
//   - price (number, requerido)
//   - title (string, requerido)
//   - domain_url (string, opcional) - fallback a APP_BASE_URL
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, '');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { store_id, slug, plan_id, price, title, domain_url } = body;

    if (!store_id) return json({ error: 'Falta store_id' }, 400);
    if (!slug) return json({ error: 'Falta slug' }, 400);
    if (!price) return json({ error: 'Falta price' }, 400);

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      return json(
        { error: 'Configuración de pagos pendiente. El admin de Rivapp debe cargar MP_ACCESS_TOKEN.' },
        500
      );
    }

    // Webhook desde el entorno — no más URL hardcodeada
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) return json({ error: 'Falta SUPABASE_URL en el entorno' }, 500);
    const webhookUrl = `${normalizeBaseUrl(supabaseUrl)}/functions/v1/payment-webhook`;

    // Base URL para back_urls: prioriza domain_url del cliente, fallback APP_BASE_URL
    const resolvedBase = domain_url || Deno.env.get('APP_BASE_URL');
    if (!resolvedBase) {
      return json({ error: 'Falta domain_url o APP_BASE_URL' }, 400);
    }
    const baseUrl = normalizeBaseUrl(resolvedBase);
    const adminUrl = `${baseUrl}/${slug}/admin`;

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: title || 'Suscripción Rivapp',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: Number(price),
          },
        ],
        external_reference: store_id,
        metadata: {
          store_id,
          plan_id: plan_id || 'profesional',
        },
        back_urls: {
          success: `${adminUrl}?payment=success`,
          failure: `${adminUrl}?payment=failure`,
          pending: `${adminUrl}?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: webhookUrl,
      }),
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Error MP API:', data);
      return json(
        { error: `Error de MercadoPago: ${data.message || JSON.stringify(data)}` },
        400
      );
    }

    return json(data, 200);
  } catch (error) {
    console.error('Error en create-checkout:', error.message);
    return json({ error: error.message }, 500);
  }
});
