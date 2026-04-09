import { createClient } from '@supabase/supabase-js';
import { appConfig } from '../config/appConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan las variables de entorno de Supabase. Revisa `.env` o `.env.example`.');
}

if (!appConfig.appUrl) {
  console.error('No se pudo resolver `VITE_APP_URL` y tampoco hay origen del navegador disponible.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
