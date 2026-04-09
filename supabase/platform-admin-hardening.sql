-- ============================================================
-- RIVAPP - Platform Admin hardening
-- Ejecutar una vez en Supabase SQL Editor
-- ============================================================

-- 1. Helper para detectar platform admins desde app_metadata
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'rivapp_role') IN ('platform_admin', 'superadmin', 'master_admin'), false)
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'platform_role') IN ('platform_admin', 'superadmin', 'master_admin'), false)
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_platform_admin') = 'true', false);
$$;

-- 2. Permisos de platform admin sobre stores
DROP POLICY IF EXISTS "stores_update_platform_admin" ON stores;
CREATE POLICY "stores_update_platform_admin"
ON stores
FOR UPDATE
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "stores_delete_platform_admin" ON stores;
CREATE POLICY "stores_delete_platform_admin"
ON stores
FOR DELETE
USING (is_platform_admin());

-- 3. Permisos de platform admin sobre pagos de suscripcion
DROP POLICY IF EXISTS "payments_select_platform_admin" ON subscription_payments;
CREATE POLICY "payments_select_platform_admin"
ON subscription_payments
FOR SELECT
USING (is_platform_admin());

DROP POLICY IF EXISTS "payments_modify_platform_admin" ON subscription_payments;
CREATE POLICY "payments_modify_platform_admin"
ON subscription_payments
FOR ALL
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- 4. Restringir global_notifications: ya no cualquier usuario autenticado
DROP POLICY IF EXISTS "notifications_modify_auth" ON global_notifications;
DROP POLICY IF EXISTS "notifications_modify_platform_admin" ON global_notifications;
CREATE POLICY "notifications_modify_platform_admin"
ON global_notifications
FOR ALL
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- 5. Ejemplo de asignacion del rol a tu usuario platform admin
-- Reemplaza el email por el real antes de ejecutar.
-- UPDATE auth.users
-- SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"rivapp_role":"platform_admin"}'::jsonb
-- WHERE email = 'tu-email@dominio.com';
