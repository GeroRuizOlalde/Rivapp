import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error('Falta RESEND_API_KEY en Supabase Secrets');
    if (!RESEND_FROM_EMAIL) throw new Error('Falta RESEND_FROM_EMAIL en Supabase Secrets');

    const { email, role, branch_name, store_name, invite_link } = await req.json();

    if (!email || !invite_link) {
      throw new Error('Faltan datos requeridos (email o link)');
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [email],
        subject: `Te invitaron a unirte a ${store_name}`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #000; font-size: 24px; margin: 0;">Rivapp<span style="color: #d0ff00;">.</span></h1>
            </div>

            <p>Hola,</p>
            <p>Te han invitado a formar parte del equipo de <strong>${store_name}</strong>.</p>

            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 5px 0; font-size: 14px; text-transform: uppercase; color: #666;">Rol Asignado</p>
              <p style="font-size: 18px; font-weight: bold; margin: 0;">${String(role || '').toUpperCase()}</p>
              ${branch_name ? `<p style="margin-top: 10px; color: #666;">Sucursal: ${branch_name}</p>` : ''}

              <div style="margin: 20px 0; border-top: 1px solid #ddd;"></div>

              <a href="${invite_link}" style="background-color: #d0ff00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Aceptar Invitacion
              </a>
            </div>

            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">
              Si no esperabas este correo, puedes ignorarlo.
            </p>
          </div>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Error Resend:', data);
      throw new Error(data.message || 'Error enviando email');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error Funcion:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
