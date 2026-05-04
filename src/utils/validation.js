// Validaciones reutilizables. Devuelven { ok, error }. Si ok=true, error=null.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'login', 'register', 'registro', 'create-store',
  'master-panel', 'tracking', 'update-password', 'terminos', 'privacidad',
  'rider', 'app', 'www', 'mail', 'support', 'soporte',
]);

const MIN_PASSWORD_LENGTH = 8;
const MIN_NAME_LENGTH = 2;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 40;
const MIN_PHONE_DIGITS = 8;

export const validateEmail = (raw) => {
  const email = String(raw || '').trim().toLowerCase();
  if (!email) return { ok: false, error: 'Escribí tu email.' };
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'El email no parece válido.' };
  return { ok: true, value: email, error: null };
};

export const validatePassword = (raw) => {
  const pwd = String(raw || '');
  if (!pwd) return { ok: false, error: 'Escribí una contraseña.' };
  if (pwd.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  }
  if (!/[a-zA-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
    return { ok: false, error: 'La contraseña debe combinar letras y números.' };
  }
  return { ok: true, value: pwd, error: null };
};

export const validateName = (raw, fieldLabel = 'nombre') => {
  const name = String(raw || '').trim();
  if (!name) return { ok: false, error: `Escribí el ${fieldLabel}.` };
  if (name.length < MIN_NAME_LENGTH) {
    return { ok: false, error: `El ${fieldLabel} es demasiado corto.` };
  }
  return { ok: true, value: name, error: null };
};

export const validateSlug = (raw) => {
  const slug = String(raw || '').trim().toLowerCase();
  if (!slug) return { ok: false, error: 'Falta la URL del negocio.' };
  if (slug.length < MIN_SLUG_LENGTH) {
    return { ok: false, error: `La URL debe tener al menos ${MIN_SLUG_LENGTH} caracteres.` };
  }
  if (slug.length > MAX_SLUG_LENGTH) {
    return { ok: false, error: `La URL no puede superar ${MAX_SLUG_LENGTH} caracteres.` };
  }
  if (!SLUG_RE.test(slug)) {
    return {
      ok: false,
      error: 'La URL solo puede tener letras, números y guiones (sin espacios ni símbolos).',
    };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: 'Esa URL está reservada. Probá con otra.' };
  }
  return { ok: true, value: slug, error: null };
};

export const validatePhone = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return { ok: false, error: 'Escribí un teléfono.' };
  if (digits.length < MIN_PHONE_DIGITS) {
    return { ok: false, error: 'El teléfono parece corto. Incluí el código de área.' };
  }
  return { ok: true, value: digits, error: null };
};

// Helper: corre varias validaciones y devuelve la primera con error.
// Cada validator es { run: () => ({ ok, error, value }), key: string }.
export const runValidators = (validators) => {
  for (const v of validators) {
    const result = v.run();
    if (!result.ok) return { ok: false, key: v.key, error: result.error };
  }
  return { ok: true, error: null };
};
