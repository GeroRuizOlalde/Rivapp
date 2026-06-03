-- ============================================================
-- MIGRACIÓN: Corregir constraint de plan_type en stores
-- Fecha: 2026-06-03
-- Objetivo: Reemplazar los valores legacy ('basic', 'premium', 'pro')
--           por los nombres actuales ('emprendedor', 'profesional').
--           Se conserva 'pro' como alias legacy para no romper filas
--           existentes que puedan tenerlo.
-- ============================================================

ALTER TABLE stores
  DROP CONSTRAINT IF EXISTS stores_plan_type_check;

ALTER TABLE stores
  ADD CONSTRAINT stores_plan_type_check
    CHECK (plan_type IN ('trial', 'emprendedor', 'profesional', 'pro'));
