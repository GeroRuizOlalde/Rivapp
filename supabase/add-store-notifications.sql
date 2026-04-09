-- ============================================================
-- MIGRACIÓN: Sistema de notificaciones internas por tienda
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. CREAR TABLA
CREATE TABLE IF NOT EXISTS store_notifications (
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
CREATE INDEX IF NOT EXISTS idx_store_notifications_store ON store_notifications(store_id, is_read, created_at DESC);

-- 2. RLS
ALTER TABLE store_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_notif_select" ON store_notifications;
DROP POLICY IF EXISTS "store_notif_insert" ON store_notifications;
DROP POLICY IF EXISTS "store_notif_update" ON store_notifications;
DROP POLICY IF EXISTS "store_notif_delete" ON store_notifications;

CREATE POLICY "store_notif_select" ON store_notifications FOR SELECT USING (is_store_admin(store_id));
CREATE POLICY "store_notif_insert" ON store_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "store_notif_update" ON store_notifications FOR UPDATE USING (is_store_admin(store_id));
CREATE POLICY "store_notif_delete" ON store_notifications FOR DELETE USING (is_store_admin(store_id));

-- 3. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE store_notifications;

-- 4. TRIGGERS: Generar notificaciones automáticas

-- 4a. Nuevo pedido → notificación
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO store_notifications (store_id, type, title, body, metadata)
    VALUES (
        NEW.store_id,
        'new_order',
        'Nuevo pedido recibido',
        'Pedido de ' || COALESCE(NEW.customer_name, 'Cliente') || ' por $' || COALESCE(NEW.total::text, '0'),
        jsonb_build_object('order_id', NEW.id, 'customer_name', COALESCE(NEW.customer_name, ''), 'total', COALESCE(NEW.total, 0))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_order ON orders;
CREATE TRIGGER trg_notify_new_order
    AFTER INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- 4b. Nuevo turno → notificación
CREATE OR REPLACE FUNCTION notify_new_appointment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO store_notifications (store_id, type, title, body, metadata)
    VALUES (
        NEW.store_id,
        'new_appointment',
        'Nuevo turno reservado',
        COALESCE(NEW.customer_name, 'Cliente') || ' reservó un turno para ' || TO_CHAR(NEW.start_time, 'DD/MM HH24:MI'),
        jsonb_build_object('appointment_id', NEW.id, 'customer_name', COALESCE(NEW.customer_name, ''))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_appointment ON appointments;
CREATE TRIGGER trg_notify_new_appointment
    AFTER INSERT ON appointments
    FOR EACH ROW EXECUTE FUNCTION notify_new_appointment();

-- 4c. Nueva reseña (cuando un pedido recibe rating) → notificación
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.rating IS NULL AND NEW.rating IS NOT NULL THEN
        INSERT INTO store_notifications (store_id, type, title, body, metadata)
        VALUES (
            NEW.store_id,
            'new_review',
            'Nueva reseña (' || NEW.rating || '★)',
            COALESCE(NEW.customer_name, 'Cliente') || ' dejó una reseña de ' || NEW.rating || ' estrellas',
            jsonb_build_object('order_id', NEW.id, 'rating', NEW.rating, 'customer_name', COALESCE(NEW.customer_name, ''))
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_review ON orders;
CREATE TRIGGER trg_notify_new_review
    AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION notify_new_review();

-- 4d. Stock bajo (cuando stock baja de 5 unidades)
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT NEW.has_infinite_stock AND NEW.stock <= 5 AND NEW.stock < OLD.stock THEN
        INSERT INTO store_notifications (store_id, type, title, body, metadata)
        VALUES (
            NEW.store_id,
            'low_stock',
            'Stock bajo: ' || NEW.name,
            'Quedan solo ' || NEW.stock || ' unidades de "' || NEW.name || '"',
            jsonb_build_object('menu_id', NEW.id, 'stock', NEW.stock, 'product_name', NEW.name)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_low_stock ON menu;
CREATE TRIGGER trg_notify_low_stock
    AFTER UPDATE ON menu
    FOR EACH ROW EXECUTE FUNCTION notify_low_stock();

-- ============================================================
-- LISTO! Las notificaciones se generan automaticamente
-- ============================================================
