import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 🟢 Agregamos 'type' a los parámetros recibidos
    const { store_id, items, order_id, domain_url, type } = await req.json()

    // Validación URL Localhost
    let baseUrl = domain_url || "https://rivapp.com.ar";
    if (baseUrl.includes("localhost")) {
        console.log("⚠️ Localhost: Usando URL producción para MP");
        baseUrl = "https://rivapp.com.ar"; 
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const preference = {
      items: [...],
      external_reference: order_id.toString(), // 👈 ESTO ES VITAL
        back_urls: {
          success: `${domain_url}/status=success`,
  }
}

    const { data: store, error } = await supabase
      .from('stores')
      .select('mp_access_token, slug, name')
      .eq('id', store_id)
      .single()

    if (error || !store?.mp_access_token) {
      throw new Error("El comercio no tiene configurado Mercado Pago.")
    }

    const totalPrice = items.reduce((acc: number, item: any) => {
        const price = Number(item.finalPrice || item.price) || 0;
        const quantity = Number(item.quantity) || 1;
        return acc + (price * quantity);
    }, 0);

    // 🟢 LÓGICA DE TEXTO DINÁMICO
    // Si mandamos type='appointment', dice "Reserva". Si no, "Pedido".
    const actionText = type === 'appointment' ? 'Reserva en' : 'Pedido de';
    
    const mpItem = {
        title: `${actionText} ${store.name || 'Rivapp'}`, // Ej: "Reserva en Barbería X" o "Pedido de Burger X"
        quantity: 1,
        currency_id: "ARS",
        unit_price: totalPrice > 0 ? totalPrice : 1 
    };

    const storePath = store.slug ? `/${store.slug}` : ''; 
    const returnBaseUrl = `${baseUrl}${storePath}`;

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${store.mp_access_token}`
      },
      body: JSON.stringify({
        items: [mpItem],
        external_reference: `${order_id}`,
        back_urls: {
          success: `${returnBaseUrl}?status=success`,
          failure: `${returnBaseUrl}?status=failure`,
          pending: `${returnBaseUrl}?status=pending`
        },
        auto_return: "approved",
        shipments: { mode: "not_specified" }
      })
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error("❌ Error Respuesta MP:", JSON.stringify(mpData))
      throw new Error(`MP: ${mpData.message || mpData.error || 'Error desconocido'}`)
    }

    return new Response(
      JSON.stringify({ init_point: mpData.init_point }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error("❌ Error General:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})