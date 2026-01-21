import { useMemo } from 'react';

export const useEntitlements = (store) => {
  return useMemo(() => {
    // Valores por defecto si no hay tienda cargada
    if (!store) {
      return { 
        planName: '', 
        isExpired: false, 
        isDemo: false,
        canAccessAdmin: false,
        features: { hasProTabs: false }
      };
    }

    // 1. Normalización de datos
    const plan = store.plan_type?.toLowerCase() || 'trial';
    const status = store.subscription_status?.toLowerCase() || 'inactive';
    const isDemo = store.is_demo === true;
    
    // 2. Cálculo de Vencimiento (Fin del día)
    let isExpired = false;
    let daysLeft = 0;
    
    if (store.subscription_expiry) {
      const expiryDate = new Date(store.subscription_expiry);
      expiryDate.setHours(23, 59, 59, 999);
      const now = new Date();
      isExpired = now > expiryDate;
      
      // Días restantes (para mostrar avisos)
      const diffTime = expiryDate - now;
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    }

    // 3. Reglas de Negocio (La Verdad Absoluta)

    // A) ¿Es un plan avanzado? (Pro, Profesional, Emprendedor)
    // Nota: El Trial también ve las tabs PRO para probarlas.
    const hasProFeatures = isDemo || ['pro', 'profesional', 'emprendedor', 'trial'].includes(plan);

    // B) ¿Tiene permiso de entrar al panel?
    // Regla: Pasa si es Demo O (si no venció Y (está activo O es plan free/ilimitado))
    // FIX: Si el plan es 'trial' y venció, NO pasa. Si es 'pro' y venció, NO pasa.
    const canAccessAdmin = isDemo || (!isExpired && (status === 'active' || plan === 'free'));

    return {
      planName: plan.toUpperCase(),
      isExpired,
      isDemo,
      daysLeft,
      canAccessAdmin,
      features: {
        hasProTabs: hasProFeatures, // Habilita pestañas extra (Staff, Cupones)
        maxProducts: plan === 'trial' ? 50 : 9999, // Ejemplo de límite futuro
        canRemoveBranding: plan === 'pro' || plan === 'profesional'
      }
    };
  }, [store]);
};