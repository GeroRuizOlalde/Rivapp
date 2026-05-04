import { useMemo } from 'react';
import { getPlan, isProTier, normalizePlanId, PLAN_IDS } from '../config/plans';

export const useEntitlements = (store) => {
  return useMemo(() => {
    // Valores por defecto si no hay tienda cargada
    if (!store) {
      return {
        planName: '',
        planId: '',
        isExpired: false,
        isDemo: false,
        canAccessAdmin: false,
        features: { hasProTabs: false },
      };
    }

    // 1. Normalización
    const planId = normalizePlanId(store.plan_type) || PLAN_IDS.TRIAL;
    const plan = getPlan(planId);
    const status = store.subscription_status?.toLowerCase() || 'inactive';
    const isDemo = store.is_demo === true;

    // 2. Vencimiento (fin del día)
    let isExpired = false;
    let daysLeft = 0;
    if (store.subscription_expiry) {
      const expiryDate = new Date(store.subscription_expiry);
      expiryDate.setHours(23, 59, 59, 999);
      const now = new Date();
      isExpired = now > expiryDate;
      daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    }

    // 3. Reglas de negocio
    // hasProTabs: el trial ve features pro para probarlas; emprendedor también.
    const hasProFeatures = isDemo || [PLAN_IDS.TRIAL, PLAN_IDS.EMPRENDEDOR, PLAN_IDS.PROFESIONAL].includes(planId);

    // canAccessAdmin: demo siempre, o (no vencido AND (status active OR plan free)).
    const canAccessAdmin = isDemo || (!isExpired && (status === 'active' || planId === 'free'));

    return {
      planName: plan?.label || planId.toUpperCase(),
      planId,
      isExpired,
      isDemo,
      daysLeft,
      canAccessAdmin,
      features: {
        hasProTabs: hasProFeatures,
        maxProducts: planId === PLAN_IDS.TRIAL ? 50 : 9999,
        canRemoveBranding: isProTier(planId),
      },
    };
  }, [store]);
};