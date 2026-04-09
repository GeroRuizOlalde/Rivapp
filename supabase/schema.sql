-- ============================================================
-- RIVAPP - Schema completo para Supabase
-- Ejecutar en el SQL Editor de Supabase (Dashboard > SQL Editor)
-- ============================================================
-- ADVERTENCIA: Este script ELIMINA todas las tablas existentes
-- y las recrea desde cero. Todos los datos se perderán.
-- ============================================================

-- 0. NUCLEAR: Eliminar TODAS las vistas primero
DROP VIEW IF EXISTS stores_public CASCADE;
DROP VIEW IF EXISTS customer_insights CASCADE;
DROP VIEW IF EXISTS public_businesses CASCADE;
DROP VIEW IF EXISTS public_business_services CASCADE;

-- Eliminar TODAS las tablas del proyecto anterior y actual
DROP TABLE IF EXISTS tenant_integrations CASCADE;
DROP TABLE IF EXISTS team_invitations CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS subscription_payments CASCADE;
DROP TABLE IF EXISTS store_secrets CASCADE;
DROP TABLE IF EXISTS store_memberships CASCADE;
DROP TABLE IF EXISTS store_schedules CASCADE;
DROP TABLE IF EXISTS staff_services CASCADE;
DROP TABLE IF EXISTS schedule_exceptions CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_settings CASCADE;
DROP TABLE IF EXISTS product_promotions CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS option_group_items CASCADE;
DROP TABLE IF EXISTS option_groups CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS delivery_zones CASCADE;
DROP TABLE IF EXISTS business_onboarding_settings CASCADE;
DROP TABLE IF EXISTS business_invites CASCADE;
DROP TABLE IF EXISTS branch_memberships CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS store_notifications CASCADE;
DROP TABLE IF EXISTS global_notifications CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS platform_plans CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS riders CASCADE;
DROP TABLE IF EXISTS menu CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- Limpiar funciones existentes
DROP FUNCTION IF EXISTS decrement_stock(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================
-- 1. STORES - Tabla principal de negocios
-- ============================================================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    business_type TEXT NOT NULL DEFAULT 'gastronomia' CHECK (business_type IN ('gastronomia', 'turnos')),

    -- Suscripcion
    plan_type TEXT NOT NULL DEFAULT 'trial' CHECK (plan_type IN ('trial', 'basic', 'premium', 'pro')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'expired')),
    subscription_expiry TIMESTAMPTZ,
    subscription_price NUMERIC DEFAULT 0,

    -- Estado
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_demo BOOLEAN NOT NULL DEFAULT false,

    -- Branding
    color_accent TEXT DEFAULT '#d0ff00',
    logo_url TEXT,
    banner_url TEXT,

    -- Contacto
    phone TEXT,
    address TEXT,
    owner_email TEXT,

    -- Ubicacion
    lat NUMERIC,
    lng NUMERIC,

    -- Pagos
    cbu_alias TEXT,
    enable_payments BOOLEAN DEFAULT false,
    delivery_base_price NUMERIC DEFAULT 500,
    delivery_price_per_km NUMERIC DEFAULT 300,
    charge_delivery_in_mp BOOLEAN DEFAULT true,

    -- Horarios
    schedule_start TIME,
    schedule_end TIME,
    auto_schedule BOOLEAN DEFAULT false,

    -- Turnos/Servicios
    enable_staff_selection BOOLEAN DEFAULT false,
    enable_multislots BOOLEAN DEFAULT false,
    max_concurrent_slots INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_owner ON stores(owner_id);

-- ============================================================
-- 2. STORES_PUBLIC - Vista publica (solo lectura)
-- ============================================================
CREATE VIEW stores_public AS
SELECT
    id, name, slug, business_type,
    plan_type, subscription_status, subscription_expiry,
    is_active, is_demo,
    color_accent, logo_url, banner_url,
    phone, address,
    lat, lng,
    cbu_alias, enable_payments,
    delivery_base_price, delivery_price_per_km, charge_delivery_in_mp,
    schedule_start, schedule_end, auto_schedule,
    enable_staff_selection, enable_multislots, max_concurrent_slots,
    created_at
FROM stores;

-- ============================================================
-- 3. BRANCHES - Sucursales
-- ============================================================
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    lat NUMERIC,
    lng NUMERIC,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_main BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_branches_store ON branches(store_id);

-- ============================================================
-- 4. CATEGORIES - Categorias del menu
-- ============================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_store ON categories(store_id);

-- ============================================================
-- 5. MENU - Productos del menu
-- ============================================================
CREATE TABLE menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    category TEXT,
    image TEXT,
    available BOOLEAN NOT NULL DEFAULT true,
    stock INTEGER DEFAULT 100,
    has_infinite_stock BOOLEAN DEFAULT false,
    has_variants BOOLEAN DEFAULT false,
    variants JSONB DEFAULT '[]'::jsonb,
    extras JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_store ON menu(store_id);

-- ============================================================
-- 6. RIDERS - Repartidores
-- ============================================================
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    access_pin TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_riders_store ON riders(store_id);

-- ============================================================
-- 7. ORDERS - Pedidos (gastronomia)
-- ============================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,

    -- Cliente
    customer_name TEXT,
    customer_phone TEXT,

    -- Pedido
    items JSONB DEFAULT '[]'::jsonb,
    total NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmado', 'preparacion', 'listo', 'terminado', 'entregado', 'archivado', 'rechazado')),
    note TEXT,
    rejection_reason TEXT,

    -- Pago
    payment_method TEXT DEFAULT 'efectivo' CHECK (payment_method IN ('efectivo', 'transferencia', 'mercadopago')),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
    payment_id TEXT,
    paid BOOLEAN DEFAULT false,

    -- Delivery
    delivery_type TEXT DEFAULT 'retiro' CHECK (delivery_type IN ('delivery', 'retiro')),
    delivery_cost NUMERIC DEFAULT 0,
    delivery_zone TEXT,
    location_link TEXT,
    lat NUMERIC,
    lng NUMERIC,

    -- Rider
    rider_id UUID REFERENCES riders(id) ON DELETE SET NULL,

    -- Rating
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,

    -- Tracking
    tracking_token UUID DEFAULT gen_random_uuid(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_tracking ON orders(tracking_token);
CREATE INDEX idx_orders_rider ON orders(rider_id);
CREATE INDEX idx_orders_branch ON orders(branch_id);

-- ============================================================
-- 8. SERVICES - Servicios (turnos)
-- ============================================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_store ON services(store_id);

-- ============================================================
-- 9. STAFF - Personal
-- ============================================================
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    avatar_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_store ON staff(store_id);

-- ============================================================
-- 10. STORE_SCHEDULES - Horarios por dia
-- ============================================================
CREATE TABLE store_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME NOT NULL DEFAULT '09:00:00',
    close_time TIME NOT NULL DEFAULT '20:00:00',
    is_closed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (store_id, day_of_week)
);

CREATE INDEX idx_schedules_store ON store_schedules(store_id);

-- ============================================================
-- 11. APPOINTMENTS - Turnos/Citas
-- ============================================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,

    customer_name TEXT,
    customer_phone TEXT,

    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,

    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmado', 'cancelado')),
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('mercadopago', 'cash', 'transfer')),
    payment_id TEXT,
    price_paid NUMERIC DEFAULT 0,
    coupon_code TEXT,
    internal_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_store ON appointments(store_id);
CREATE INDEX idx_appointments_staff ON appointments(staff_id);
CREATE INDEX idx_appointments_start ON appointments(start_time);

-- ============================================================
-- 12. COUPONS - Cupones de descuento
-- ============================================================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount NUMERIC NOT NULL DEFAULT 10 CHECK (discount > 0 AND discount <= 100),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupons_store ON coupons(store_id);
CREATE INDEX idx_coupons_code ON coupons(code);

-- ============================================================
-- 13. STORE_MEMBERSHIPS - Miembros a nivel tienda
-- ============================================================
CREATE TABLE store_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'rider')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (store_id, user_id)
);

CREATE INDEX idx_store_memberships_user ON store_memberships(user_id);
CREATE INDEX idx_store_memberships_store ON store_memberships(store_id);

-- ============================================================
-- 14. BRANCH_MEMBERSHIPS - Miembros a nivel sucursal
-- ============================================================
CREATE TABLE branch_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'rider')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (branch_id, user_id)
);

CREATE INDEX idx_branch_memberships_user ON branch_memberships(user_id);
CREATE INDEX idx_branch_memberships_branch ON branch_memberships(branch_id);

-- ============================================================
-- 15. TEAM_INVITATIONS - Invitaciones de equipo
-- ============================================================
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_store ON team_invitations(store_id);

-- ============================================================
-- 16. STORE_SECRETS - Credenciales seguras (MercadoPago)
-- ============================================================
CREATE TABLE store_secrets (
    id UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
    mp_access_token TEXT,
    mp_public_key TEXT,
    mp_client_id TEXT,
    mp_client_secret TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 17. PLATFORM_PLANS - Planes de suscripcion
-- ============================================================
CREATE TABLE platform_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    price NUMERIC NOT NULL DEFAULT 0,
    features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Datos iniciales de planes
INSERT INTO platform_plans (name, price, features) VALUES
    ('trial', 0, '{"max_orders": 50, "max_products": 20, "riders": false, "crm": false, "coupons": false}'::jsonb),
    ('basic', 15000, '{"max_orders": 500, "max_products": 100, "riders": true, "crm": false, "coupons": true}'::jsonb),
    ('premium', 30000, '{"max_orders": -1, "max_products": -1, "riders": true, "crm": true, "coupons": true}'::jsonb),
    ('pro', 40000, '{"max_orders": -1, "max_products": -1, "riders": true, "crm": true, "coupons": true, "multi_branch": true}'::jsonb);

-- ============================================================
-- 18. SUBSCRIPTION_PAYMENTS - Pagos de suscripcion
-- ============================================================
CREATE TABLE subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sub_payments_store ON subscription_payments(store_id);

-- ============================================================
-- 19. GLOBAL_NOTIFICATIONS - Notificaciones del sistema
-- ============================================================
CREATE TABLE global_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target TEXT NOT NULL DEFAULT 'all' CHECK (target IN ('all', 'gastronomia', 'turnos')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 20. STORE_NOTIFICATIONS - Notificaciones internas por tienda
-- ============================================================
CREATE TABLE store_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'new_order', 'order_status', 'new_appointment', 'appointment_status',
        'low_stock', 'new_review', 'new_member', 'payment_received', 'system'
    )),
    title TEXT NOT NULL,
    body TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_store_notifications_store ON store_notifications(store_id, is_read, created_at DESC);

-- ============================================================
-- 21. CUSTOMER_INSIGHTS - Vista de CRM (datos agregados)
-- ============================================================
CREATE VIEW customer_insights AS
SELECT
    gen_random_uuid() AS id,
    o.store_id,
    o.customer_name,
    o.customer_phone,
    COUNT(*) AS total_orders,
    SUM(o.total) AS total_spent,
    MAX(o.created_at) AS last_order
FROM orders o
WHERE o.status NOT IN ('rechazado')
  AND o.customer_phone IS NOT NULL
  AND o.customer_phone != ''
GROUP BY o.store_id, o.customer_name, o.customer_phone;

-- ============================================================
-- 21. FUNCION RPC: decrement_stock
-- ============================================================
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE menu
    SET stock = GREATEST(stock - p_quantity, 0)
    WHERE id = p_product_id
      AND has_infinite_stock = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 22. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 23. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLITICAS RLS
-- ============================================================

-- STORES: Lectura publica, escritura solo owner
CREATE POLICY "stores_select_all" ON stores FOR SELECT USING (true);
CREATE POLICY "stores_insert_auth" ON stores FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "stores_update_owner" ON stores FOR UPDATE USING (
    owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM store_memberships WHERE store_id = id AND user_id = auth.uid() AND role IN ('admin', 'owner')
    )
);
CREATE POLICY "stores_delete_owner" ON stores FOR DELETE USING (owner_id = auth.uid());

-- HELPER: Funcion para verificar si el usuario es owner o admin de la tienda
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

-- BRANCHES: Lectura publica, escritura owner/admin
CREATE POLICY "branches_select_all" ON branches FOR SELECT USING (true);
CREATE POLICY "branches_insert" ON branches FOR INSERT WITH CHECK (is_store_admin(store_id));
CREATE POLICY "branches_update" ON branches FOR UPDATE USING (is_store_admin(store_id));
CREATE POLICY "branches_delete" ON branches FOR DELETE USING (is_store_admin(store_id));

-- CATEGORIES: Lectura publica, escritura owner/admin
CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_modify" ON categories FOR ALL USING (is_store_admin(store_id));

-- MENU: Lectura publica, escritura owner/admin
CREATE POLICY "menu_select_all" ON menu FOR SELECT USING (true);
CREATE POLICY "menu_insert" ON menu FOR INSERT WITH CHECK (is_store_admin(store_id));
CREATE POLICY "menu_update" ON menu FOR UPDATE USING (is_store_admin(store_id));
CREATE POLICY "menu_delete" ON menu FOR DELETE USING (is_store_admin(store_id));

-- RIDERS: Lectura publica (para login por PIN), escritura owner/admin
CREATE POLICY "riders_select_all" ON riders FOR SELECT USING (true);
CREATE POLICY "riders_insert" ON riders FOR INSERT WITH CHECK (is_store_admin(store_id));
CREATE POLICY "riders_update" ON riders FOR UPDATE USING (is_store_admin(store_id));
CREATE POLICY "riders_delete" ON riders FOR DELETE USING (is_store_admin(store_id));

-- ORDERS: Lectura y escritura abierta (clientes anon crean pedidos, admin actualiza)
CREATE POLICY "orders_select_all" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_insert_all" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_update_all" ON orders FOR UPDATE USING (true);
CREATE POLICY "orders_delete_auth" ON orders FOR DELETE USING (auth.uid() IS NOT NULL);

-- SERVICES: Lectura publica, escritura owner/admin
CREATE POLICY "services_select_all" ON services FOR SELECT USING (true);
CREATE POLICY "services_modify" ON services FOR ALL USING (is_store_admin(store_id));

-- STAFF: Lectura publica, escritura owner/admin
CREATE POLICY "staff_select_all" ON staff FOR SELECT USING (true);
CREATE POLICY "staff_modify" ON staff FOR ALL USING (is_store_admin(store_id));

-- STORE_SCHEDULES: Lectura publica, escritura owner/admin
CREATE POLICY "schedules_select_all" ON store_schedules FOR SELECT USING (true);
CREATE POLICY "schedules_modify" ON store_schedules FOR ALL USING (is_store_admin(store_id));

-- APPOINTMENTS: Lectura y escritura abierta (clientes anon crean turnos)
CREATE POLICY "appointments_select_all" ON appointments FOR SELECT USING (true);
CREATE POLICY "appointments_insert_all" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "appointments_update_all" ON appointments FOR UPDATE USING (true);
CREATE POLICY "appointments_delete_auth" ON appointments FOR DELETE USING (auth.uid() IS NOT NULL);

-- COUPONS: Lectura publica (validacion client-side), escritura owner/admin
CREATE POLICY "coupons_select_all" ON coupons FOR SELECT USING (true);
CREATE POLICY "coupons_insert" ON coupons FOR INSERT WITH CHECK (is_store_admin(store_id));
CREATE POLICY "coupons_update" ON coupons FOR UPDATE USING (is_store_admin(store_id));
CREATE POLICY "coupons_delete" ON coupons FOR DELETE USING (is_store_admin(store_id));

-- STORE_MEMBERSHIPS: Lectura por miembro, escritura por owner
CREATE POLICY "memberships_select" ON store_memberships FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid())
);
CREATE POLICY "memberships_modify" ON store_memberships FOR ALL USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid())
);

-- BRANCH_MEMBERSHIPS: Lectura por miembro, escritura por owner
CREATE POLICY "branch_memberships_select" ON branch_memberships FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM branches b JOIN stores s ON s.id = b.store_id
        WHERE b.id = branch_id AND s.owner_id = auth.uid()
    )
);
CREATE POLICY "branch_memberships_modify" ON branch_memberships FOR ALL USING (
    EXISTS (
        SELECT 1 FROM branches b JOIN stores s ON s.id = b.store_id
        WHERE b.id = branch_id AND s.owner_id = auth.uid()
    )
);

-- TEAM_INVITATIONS: Lectura y escritura por owner
CREATE POLICY "invitations_select" ON team_invitations FOR SELECT USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid())
);
CREATE POLICY "invitations_insert" ON team_invitations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid())
);
CREATE POLICY "invitations_delete" ON team_invitations FOR DELETE USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid())
);

-- STORE_SECRETS: Solo owner de la tienda
CREATE POLICY "secrets_select_owner" ON store_secrets FOR SELECT USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_secrets.id AND stores.owner_id = auth.uid())
);
CREATE POLICY "secrets_modify_owner" ON store_secrets FOR ALL USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_secrets.id AND stores.owner_id = auth.uid())
);

-- PLATFORM_PLANS: Lectura publica
CREATE POLICY "plans_select_all" ON platform_plans FOR SELECT USING (true);

-- SUBSCRIPTION_PAYMENTS: Lectura por owner de la tienda
CREATE POLICY "payments_select" ON subscription_payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid())
);
CREATE POLICY "payments_insert" ON subscription_payments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- GLOBAL_NOTIFICATIONS: Lectura publica, escritura solo service_role
CREATE POLICY "notifications_select_all" ON global_notifications FOR SELECT USING (true);
CREATE POLICY "notifications_modify_auth" ON global_notifications FOR ALL USING (auth.uid() IS NOT NULL);

-- STORE_NOTIFICATIONS: Lectura/escritura owner/admin, insercion abierta (triggers internos)
CREATE POLICY "store_notif_select" ON store_notifications FOR SELECT USING (is_store_admin(store_id));
CREATE POLICY "store_notif_insert" ON store_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "store_notif_update" ON store_notifications FOR UPDATE USING (is_store_admin(store_id));
CREATE POLICY "store_notif_delete" ON store_notifications FOR DELETE USING (is_store_admin(store_id));

-- ============================================================
-- 24. STORAGE POLICIES
-- ============================================================

-- Limpiar politicas anteriores de storage
DROP POLICY IF EXISTS "menu_images_select" ON storage.objects;
DROP POLICY IF EXISTS "menu_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "menu_images_update" ON storage.objects;
DROP POLICY IF EXISTS "menu_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "store_assets_select" ON storage.objects;
DROP POLICY IF EXISTS "store_assets_insert" ON storage.objects;
DROP POLICY IF EXISTS "store_assets_update" ON storage.objects;
DROP POLICY IF EXISTS "store_assets_delete" ON storage.objects;

-- menu-images: Lectura publica, subida auth
CREATE POLICY "menu_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "menu_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "menu_images_update" ON storage.objects FOR UPDATE USING (bucket_id = 'menu-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "menu_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'menu-images' AND auth.uid() IS NOT NULL);

-- store-assets: Lectura publica, subida auth
CREATE POLICY "store_assets_select" ON storage.objects FOR SELECT USING (bucket_id = 'store-assets');
CREATE POLICY "store_assets_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'store-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "store_assets_update" ON storage.objects FOR UPDATE USING (bucket_id = 'store-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "store_assets_delete" ON storage.objects FOR DELETE USING (bucket_id = 'store-assets' AND auth.uid() IS NOT NULL);

-- ============================================================
-- 25. REALTIME - Habilitar publicaciones
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE global_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE menu;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE store_notifications;

-- ============================================================
-- FIN DEL SCHEMA
-- ============================================================