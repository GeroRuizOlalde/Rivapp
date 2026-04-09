import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL');
const APP_BASE_URL = Deno.env.get('APP_BASE_URL');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  email: string;
  storeName: string;
  slug: string;
  type: string;
}

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, '');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error('Falta RESEND_API_KEY en Supabase Secrets');
    if (!RESEND_FROM_EMAIL) throw new Error('Falta RESEND_FROM_EMAIL en Supabase Secrets');
    if (!APP_BASE_URL) throw new Error('Falta APP_BASE_URL en Supabase Secrets');

    const { email, storeName, slug, type } = (await req.json()) as WelcomeEmailRequest;

    if (!email || !storeName || !slug || !type) {
      throw new Error('Faltan datos requeridos');
    }

    const baseUrl = normalizeBaseUrl(APP_BASE_URL);
    const publicUrl = `${baseUrl}/${slug}`;
    const adminUrl = `${publicUrl}/admin`;
    const publicLabel = publicUrl.replace(/^https?:\/\//, '');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [email],
        subject: `Bienvenido a Rivapp - ${storeName}`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #000; font-size: 24px; margin: 0;">Rivapp<span style="color: #d0ff00;">.</span></h1>
            </div>

            <p>Hola <strong>${storeName}</strong>,</p>
            <p>Gracias por confiar en Rivapp para digitalizar tu negocio de <strong>${type}</strong>.</p>
            <p>Tu tienda ya esta creada y lista para configurarse. Aqui tienes tus accesos directos:</p>

            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #666; text-transform: uppercase;">Tu Enlace Publico</p>
              <a href="${publicUrl}" style="font-size: 18px; font-weight: bold; color: #2563eb; text-decoration: none;">${publicLabel}</a>

              <div style="margin: 20px 0; border-top: 1px solid #ddd;"></div>

              <p style="margin: 0 0 10px 0; font-size: 12px; color: #666; text-transform: uppercase;">Tu Panel de Administracion</p>
              <a href="${adminUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ir al Admin</a>
            </div>

            <p style="font-size: 14px; color: #666;">Si tienes alguna duda, responde a este correo o contactanos por WhatsApp.</p>

            <p style="margin-top: 40px; font-size: 12px; color: #999; text-align: center;">
              &copy; ${new Date().getFullYear()} Rivapp Estudio. San Juan, Argentina.
            </p>
          </div>
        `,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: res.ok ? 200 : 400,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
