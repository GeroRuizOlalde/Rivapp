-- Agrega max_uses y uses_count a los cupones
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT NULL;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS uses_count INTEGER NOT NULL DEFAULT 0;

-- Función para incrementar el contador de usos de forma atómica
-- Solo incrementa si el cupón sigue activo y no agotó sus usos
CREATE OR REPLACE FUNCTION increment_coupon_uses(p_coupon_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE coupons
  SET uses_count = uses_count + 1
  WHERE id = p_coupon_id
    AND active = true
    AND (max_uses IS NULL OR uses_count < max_uses);
$$;
