// Única fuente de verdad para planes de Rivapp.
// Si necesitás cambiar precios, features o IDs, hacelo acá.
//
// Notas:
// - El ID del plan es lo que va a la columna `stores.plan_type`. Usamos los
//   labels en español como ID porque ya están así en la DB de producción.
// - 'pro' aparece en código viejo como alias de 'profesional'. Tratamos ambos
//   como equivalentes en `normalizePlanId`.

export const PLAN_IDS = {
  TRIAL: 'trial',
  EMPRENDEDOR: 'emprendedor',
  PROFESIONAL: 'profesional',
};

export const PLANS = {
  [PLAN_IDS.TRIAL]: {
    id: PLAN_IDS.TRIAL,
    label: 'Prueba',
    price: 0,
    isPaid: false,
    isProTier: false,
    features: ['Acceso completo durante el trial', 'Sin cargos hasta que decidas'],
  },
  [PLAN_IDS.EMPRENDEDOR]: {
    id: PLAN_IDS.EMPRENDEDOR,
    label: 'Emprendedor',
    price: 30000,
    isPaid: true,
    isProTier: false,
    mpLinkEnvVar: 'VITE_MP_SUBSCRIPTION_LINK_EMPRENDEDOR',
    features: [
      'Menú digital / agenda web',
      'Pedidos WhatsApp ilimitados',
      'Gestión de stock y servicios',
      'QR personalizado',
      'Soporte por email',
    ],
  },
  [PLAN_IDS.PROFESIONAL]: {
    id: PLAN_IDS.PROFESIONAL,
    label: 'Profesional',
    price: 40000,
    isPaid: true,
    isProTier: true,
    mpLinkEnvVar: 'VITE_MP_SUBSCRIPTION_LINK_PROFESIONAL',
    features: [
      'Todo lo de Emprendedor',
      'Integración Mercado Pago (0% com.)',
      'Gestión de staff y riders',
      'Envíos calculados por KM',
      'Cupones y fidelización',
      'Métricas de venta avanzadas',
      'Soporte prioritario WhatsApp',
    ],
  },
};

// Lista ordenada para iteración (trial NO se muestra como opción de compra).
export const PURCHASABLE_PLANS = [PLANS[PLAN_IDS.EMPRENDEDOR], PLANS[PLAN_IDS.PROFESIONAL]];

// Normaliza alias legacy: 'pro' → 'profesional'.
export const normalizePlanId = (planType) => {
  const id = (planType || '').toLowerCase();
  if (id === 'pro') return PLAN_IDS.PROFESIONAL;
  return id;
};

export const getPlan = (planType) => {
  const id = normalizePlanId(planType);
  return PLANS[id] || null;
};

export const isProTier = (planType) => {
  const plan = getPlan(planType);
  return Boolean(plan?.isProTier);
};

export const isPaidPlan = (planType) => {
  const plan = getPlan(planType);
  return Boolean(plan?.isPaid);
};
