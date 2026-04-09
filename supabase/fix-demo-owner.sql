-- ============================================================
-- FIX: Asignar tiendas demo a tu usuario + actualizar RLS
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- Reemplaza el email placeholder antes de correrlo.
-- ============================================================

-- 1. ASIGNAR TIENDAS DEMO A TU USUARIO
UPDATE stores
SET owner_id = (SELECT id FROM auth.users WHERE email = 'tu-email@dominio.com' LIMIT 1),
    owner_email = 'tu-email@dominio.com'
WHERE slug IN ('demo', 'demo-turnos');

-- 2. CREAR FUNCION HELPER PARA POLITICAS RLS
CREATE OR REPLACE FUNCTION is_store_admin(p_store_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM stores WHERE id = p_store_id AND owner_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM store_memberships WHERE store_id = p_store_id AND user_id = auth.uid() AND role IN ('admin', 'owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ACTUALIZAR POLITICAS RLS (DROP + CREATE para evitar conflictos)

-- STORES
DROP POLICY IF EXISTS "stores_update_owner" ON stores;
CREATE POLICY "stores_update_owner" ON stores FOR UPDATE USING (
    owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM store_memberships WHERE store_id = id AND user_id = auth.uid() AND role IN ('admin', 'owner')
    )
);

-- BRANCHES
DROP POLICY IF EXISTS "branches_insert" ON branches;
DROP POLICY IF EXISTS "branches_update" ON branches;
DROP POLICY IF EXISTS "branches_delete" ON branches;
CREATE POLICY "branches_insert" ON branches FOR INSERT WITH CHECK (is_store_admin(store_id));
CREATE POLICY "branches_update" ON branches FOR UPDATE USING (is_store_admin(store_id));
CREATE POLICY "branches_delete" ON branches FOR DELETE USING (is_store_admin(store_id));

-- CATEGORIES
DROP POLICY IF EXISTS "categories_modify" ON categories;
CREATE POLICY "categories_modify" ON categories FOR ALL USING (is_store_admin(store_id));

-- MENU
DROP POLICY IF EXISTS "menu_insert" ON menu;
DROP POLICY IF EXISTS "menu_update" ON menu;
DROP POLICY IF EXISTS "menu_delete" ON menu;
CREATE POLICY "menu_insert" ON menu FOR INSERT WITH CHECK (is_store_admin(store_id));
CREATE POLICY "menu_update" ON menu FOR UPDATE USING (is_store_admin(store_id));
CREATE POLICY "menu_delete" ON menu FOR DELETE USING (is_store_admin(store_id));

-- RIDERS
DROP POLICY IF EXISTS "riders_insert" ON riders;
DROP POLICY IF EXISTS "riders_update" ON riders;
DROP POLICY IF EXISTS "riders_delete" ON riders;
CREATE POLICY "riders_insert" ON riders FOR INSERT WITH CHECK (is_store_admin(store_id));
CREATE POLICY "riders_update" ON riders FOR UPDATE USING (is_store_admin(store_id));
CREATE POLICY "riders_delete" ON riders FOR DELETE USING (is_store_admin(store_id));

-- SERVICES
DROP POLICY IF EXISTS "services_modify" ON services;
CREATE POLICY "services_modify" ON services FOR ALL USING (is_store_admin(store_id));

-- STAFF
DROP POLICY IF EXISTS "staff_modify" ON staff;
CREATE POLICY "staff_modify" ON staff FOR ALL USING (is_store_admin(store_id));

-- STORE_SCHEDULES
DROP POLICY IF EXISTS "schedules_modify" ON store_schedules;
CREATE POLICY "schedules_modify" ON store_schedules FOR ALL USING (is_store_admin(store_id));

-- COUPONS
DROP POLICY IF EXISTS "coupons_insert" ON coupons;
DROP POLICY IF EXISTS "coupons_update" ON coupons;
DROP POLICY IF EXISTS "coupons_delete" ON coupons;
CREATE POLICY "coupons_insert" ON coupons FOR INSERT WITH CHECK (is_store_admin(store_id));
CREATE POLICY "coupons_update" ON coupons FOR UPDATE USING (is_store_admin(store_id));
CREATE POLICY "coupons_delete" ON coupons FOR DELETE USING (is_store_admin(store_id));

-- ============================================================
-- LISTO! Ahora podras modificar los datos de las demos
-- y cualquier admin invitado via store_memberships tambien
-- ============================================================
