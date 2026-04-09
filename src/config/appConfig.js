const rawAppUrl = import.meta.env.VITE_APP_URL?.trim();
const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const baseUrl = normalizeBaseUrl(rawAppUrl || browserOrigin);

export const appConfig = {
  appUrl: baseUrl,
  appDomainLabel:
    import.meta.env.VITE_APP_DOMAIN_LABEL?.trim() ||
    baseUrl.replace(/^https?:\/\//, '') ||
    'localhost:5173',
  supportWhatsApp: import.meta.env.VITE_SUPPORT_WHATSAPP?.trim() || '',
  mpSubscriptionLinks: {
    emprendedor: import.meta.env.VITE_MP_SUBSCRIPTION_LINK_EMPRENDEDOR?.trim() || '',
    profesional: import.meta.env.VITE_MP_SUBSCRIPTION_LINK_PROFESIONAL?.trim() || '',
  },
  enableDebugLogs: import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
};

export const buildAppUrl = (path = '') => {
  if (!path) return appConfig.appUrl;
  if (!appConfig.appUrl) return path;

  return `${appConfig.appUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getWhatsAppUrl = (phone = appConfig.supportWhatsApp, message = '') => {
  if (!phone) return '';

  const cleanPhone = String(phone).replace(/[^\d]/g, '');
  if (!cleanPhone) return '';

  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${cleanPhone}${encodedMessage}`;
};
