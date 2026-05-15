import { createClient } from '@supabase/supabase-js';
import { appConfig } from '../config/appConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Acepta el nombre histórico (VITE_SUPABASE_ANON_KEY, usado en Vercel) o el
// nombre nuevo de la key publishable de Supabase. Evita que un `.env` con el
// nombre alternativo deje la app sin arrancar en local.
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan las variables de entorno de Supabase. Revisa `.env` o `.env.example`.');
}

if (!appConfig.appUrl) {
  console.error('No se pudo resolver `VITE_APP_URL` y tampoco hay origen del navegador disponible.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
