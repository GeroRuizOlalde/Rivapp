// Estado COMERCIAL / de licencia de una tienda — derivado de subscription_status,
// subscription_expiry y plan_type. Independiente del estado OPERATIVO del local
// (is_active = "abierto/cerrado al público hoy"), que el dueño controla desde su admin.

const isExpired = (store) => {
  if (!store?.subscription_expiry) return false;
  const expiry = new Date(store.subscription_expiry);
  expiry.setHours(23, 59, 59, 999);
  return Date.now() > expiry.getTime();
};

export const getLicenseState = (store) => {
  if (!store) return { key: 'unknown', label: 'Sin datos', tone: 'muted' };
  if (store.is_demo) return { key: 'demo', label: 'Demo', tone: 'acid' };

  const status = (store.subscription_status || '').toLowerCase();

  if (status === 'suspended') return { key: 'suspended', label: 'Suspendido', tone: 'signal' };
  if (status === 'expired' || isExpired(store)) {
    return { key: 'expired', label: 'Vencido', tone: 'signal' };
  }
  if (status === 'active') return { key: 'active', label: 'Activo', tone: 'acid' };

  return { key: 'inactive', label: 'Sin plan', tone: 'muted' };
};

export const isLicensed = (store) => {
  const { key } = getLicenseState(store);
  return key === 'active' || key === 'demo';
};
