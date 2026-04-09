import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const APP_BASE_URL = Deno.env.get('APP_BASE_URL');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, '');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { store_id, price, title, domain_url } = await req.json();

    const resolvedBaseUrl = domain_url || APP_BASE_URL;
    if (!resolvedBaseUrl) {
      throw new Error('Falta APP_BASE_URL en Supabase Secrets y tampoco se envio domain_url');
    }

    const baseUrl = normalizeBaseUrl(resolvedBaseUrl);
    const webhookUrl = "https://nnqxvbbrikjtcxbiusrb.supabase.co/functions/v1/payment-webhook";

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      throw new Error('Falta configurar MP_ACCESS_TOKEN en Supabase Secrets');
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: title || 'Suscripcion Pro',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: Number(price),
          },
        ],
        external_reference: store_id,
        back_urls: {
          success: `${baseUrl}/admin?payment=success`,
          failure: `${baseUrl}/admin?payment=failure`,
          pending: `${baseUrl}/admin?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: webhookUrl,
      }),
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Error MP API:', data);
      throw new Error(`Error de MercadoPago: ${data.message || 'Desconocido'}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error en Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
