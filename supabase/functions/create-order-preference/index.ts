// ============================================================================
// create-order-preference — Genera la preferencia MP para que un CLIENTE FINAL
// pague un PEDIDO o TURNO de una tienda específica (multi-tenant).
// ============================================================================
// Usa el access_token de la tienda guardado en `store_secrets`. El webhook que
// confirma el pago es `mercadopago-webhook` (recibe ?store_id=... en query).
//
// Body esperado:
//   - store_id (UUID, requerido)
//   - order_id (UUID, requerido)
//   - tracking_token (string, opcional) - para back_urls del cliente
//   - items: [{ name, price, quantity }]
//   - delivery_cost (number, opcional)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const origin = req.headers.get('origin');
    const baseUrl = normalizeBaseUrl(origin && origin !== 'null' ? origin : 'http://localhost:5173');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let parsedBody: Record<string, unknown> = {};
    try {
      parsedBody = await req.json();
    } catch (err) {
      console.error('Body inválido (no JSON):', err);
      return json({ error: 'Body inválido. Esperado JSON.' }, 400);
    }
    console.log('create-order-preference body:', JSON.stringify(parsedBody));

    const { items, store_id, delivery_cost, order_id, tracking_token } = parsedBody as {
      items?: { name: string; price: number; quantity: number }[];
      store_id?: string;
      delivery_cost?: number;
      order_id?: string;
      tracking_token?: string;
    };

    if (!store_id) {
      console.error('Falta store_id');
      return json({ error: 'Falta store_id' }, 400);
    }
    if (!order_id) {
      console.error('Falta order_id');
      return json({ error: 'Falta order_id' }, 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      console.error('Faltan items');
      return json({ error: 'Faltan items del pedido' }, 400);
    }

    const { data: secrets, error: secretError } = await supabase
      .from('store_secrets')
      .select('mp_access_token')
      .eq('id', store_id)
      .maybeSingle();

    if (secretError) {
      console.error('Error leyendo store_secrets:', secretError);
      return json({ error: `Error de DB: ${secretError.message}` }, 500);
    }
    if (!secrets?.mp_access_token) {
      console.error(`store_secrets sin mp_access_token para store_id=${store_id}`);
      return json(
        {
          error:
            'El comercio aún no configuró Mercado Pago. El dueño debe cargar sus credenciales MP desde el admin (Ajustes → Mercado Pago).',
        },
        400
      );
    }

    // Webhook scoped por store_id (multi-tenant)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) return json({ error: 'Falta SUPABASE_URL en el entorno' }, 500);
    const webhookUrl = `${normalizeBaseUrl(supabaseUrl)}/functions/v1/mercadopago-webhook?store_id=${store_id}`;

    // back_urls van al tracking del cliente (con token si se mandó)
    const trackingPath = tracking_token ? `/tracking/${tracking_token}` : '/';

    const preferenceData: Record<string, unknown> = {
      items: items.map((item: { name: string; price: number; quantity: number }) => ({
        title: item.name,
        quantity: Number(item.quantity),
        currency_id: 'ARS',
        unit_price: Number(item.price),
      })),
      external_reference: String(order_id),
      metadata: { store_id, order_id },
      notification_url: webhookUrl,
      back_urls: {
        success: `${baseUrl}${trackingPath}?status=success`,
        failure: `${baseUrl}${trackingPath}?status=failure`,
        pending: `${baseUrl}${trackingPath}?status=pending`,
      },
      auto_return: 'approved',
    };

    if (delivery_cost && Number(delivery_cost) > 0) {
      (preferenceData.items as unknown[]).push({
        title: 'Costo de Envío',
        quantity: 1,
        currency_id: 'ARS',
        unit_price: Number(delivery_cost),
      });
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secrets.mp_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Error MP API:', mpData);
      return json(
        { error: `Mercado Pago rechazó la solicitud: ${mpData.message || JSON.stringify(mpData)}` },
        400
      );
    }

    return json({ init_point: mpData.init_point, preference_id: mpData.id }, 200);
  } catch (error) {
    console.error('Error creating preference:', error);
    return json({ error: error.message || 'Error interno al crear pago' }, 500);
  }
});
