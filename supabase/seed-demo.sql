-- ============================================================
-- RIVAPP - Datos de demostración
-- Ejecutar DESPUES de schema.sql y de crear las tiendas demo
-- ============================================================

-- ============================================================
-- 0. SUCURSALES PRINCIPALES (necesarias para que el admin funcione)
-- ============================================================
INSERT INTO branches (store_id, name, address, phone, lat, lng, is_active, is_main)
SELECT s.id, 'Local Principal', 'Av. Libertador 1234, San Juan', '2646620024', -31.5375, -68.5364, true, true
FROM stores s WHERE s.slug = 'demo';

INSERT INTO branches (store_id, name, address, phone, lat, lng, is_active, is_main)
SELECT s.id, 'Sede Central', 'Calle Sarmiento 567, San Juan', '2646620024', -31.5375, -68.5364, true, true
FROM stores s WHERE s.slug = 'demo-turnos';

-- ============================================================
-- 1. CATEGORIAS - Demo Delivery
-- ============================================================
INSERT INTO categories (store_id, name, active, sort_order)
SELECT s.id, c.name, true, c.sort_order
FROM stores s,
(VALUES
    ('Hamburguesas', 1),
    ('Pizzas', 2),
    ('Empanadas', 3),
    ('Bebidas', 4),
    ('Postres', 5),
    ('Promociones', 6)
) AS c(name, sort_order)
WHERE s.slug = 'demo';

-- ============================================================
-- 2. MENU - Demo Delivery
-- ============================================================
INSERT INTO menu (store_id, name, description, price, category, image, available, stock, has_infinite_stock, has_variants, variants, extras)
SELECT s.id, m.name, m.description, m.price, m.category, m.image, true, 100, m.infinite, m.has_variants, m.variants::jsonb, m.extras::jsonb
FROM stores s,
(VALUES
    -- Hamburguesas
    ('Smash Clasica', 'Doble medallon smash, cheddar, cebolla caramelizada, salsa de la casa', 5500, 'Hamburguesas',
     'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', true, false, '[]', '[{"name":"Extra Cheddar","price":"800"},{"name":"Bacon","price":"1000"},{"name":"Huevo","price":"600"}]'),

    ('Burger BBQ', 'Medallon 200g, bacon crocante, cheddar, aros de cebolla, salsa BBQ', 6200, 'Hamburguesas',
     'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400', true, false, '[]', '[{"name":"Extra Bacon","price":"1000"},{"name":"Jalapenos","price":"500"}]'),

    ('Veggie Burger', 'Medallon de lentejas y hongos, rucula, tomate asado, salsa de palta', 5800, 'Hamburguesas',
     'https://images.unsplash.com/photo-1520072959219-c595e6cdc07d?w=400', true, false, '[]', '[]'),

    ('Triple Smash', 'Triple medallon smash, triple cheddar, pickles, mostaza americana', 7500, 'Hamburguesas',
     'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400', true, false, '[]', '[{"name":"Extra Cheddar","price":"800"}]'),

    -- Pizzas
    ('Muzzarella', 'Pizza clasica con muzzarella premium y oregano', 6000, 'Pizzas',
     'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', true, true,
     '[{"name":"Grande","price":"6000"},{"name":"Chica","price":"4000"}]', '[]'),

    ('Napolitana', 'Tomate fresco, ajo, muzzarella y albahaca', 6500, 'Pizzas',
     'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400', true, true,
     '[{"name":"Grande","price":"6500"},{"name":"Chica","price":"4500"}]', '[]'),

    ('Fugazzeta', 'Doble queso rellena con cebolla caramelizada', 7200, 'Pizzas',
     'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', true, true,
     '[{"name":"Grande","price":"7200"},{"name":"Chica","price":"5000"}]', '[]'),

    -- Empanadas
    ('Empanada de Carne', 'Carne cortada a cuchillo, cebolla, huevo y aceituna', 1200, 'Empanadas',
     'https://images.unsplash.com/photo-1604467707321-70d009801bf4?w=400', true, false, '[]', '[]'),

    ('Empanada JyQ', 'Jamon y queso cremoso', 1100, 'Empanadas',
     'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', true, false, '[]', '[]'),

    ('Empanada Caprese', 'Tomate, muzzarella y albahaca fresca', 1200, 'Empanadas',
     'https://images.unsplash.com/photo-1604467707321-70d009801bf4?w=400', true, false, '[]', '[]'),

    -- Bebidas
    ('Coca-Cola 500ml', 'Coca-Cola linea regular', 1800, 'Bebidas',
     'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400', true, false, '[]', '[]'),

    ('Agua Mineral 500ml', 'Agua mineral sin gas', 1200, 'Bebidas',
     'https://images.unsplash.com/photo-1560023907-5f339617ea55?w=400', true, false, '[]', '[]'),

    ('Cerveza Artesanal', 'IPA de la casa 500ml', 3500, 'Bebidas',
     'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400', true, true,
     '[{"name":"IPA","price":"3500"},{"name":"Honey","price":"3500"},{"name":"Stout","price":"3800"}]', '[]'),

    -- Postres
    ('Brownie con Helado', 'Brownie tibio con helado de crema americana y salsa de chocolate', 4200, 'Postres',
     'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400', true, false, '[]', '[]'),

    ('Flan Casero', 'Flan de huevo con crema y dulce de leche', 3500, 'Postres',
     'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', true, false, '[]', '[]'),

    -- Promociones
    ('Combo Smash x2', '2 Smash Clasicas + Papas grandes + 2 Coca-Cola', 12500, 'Promociones',
     'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400', true, false, '[]', '[]'),

    ('Promo Empanadas x12', 'Docena de empanadas surtidas a eleccion', 12000, 'Promociones',
     'https://images.unsplash.com/photo-1604467707321-70d009801bf4?w=400', true, false, '[]', '[]')

) AS m(name, description, price, category, image, infinite, has_variants, variants, extras)
WHERE s.slug = 'demo';

-- ============================================================
-- 3. CUPONES - Demo Delivery
-- ============================================================
INSERT INTO coupons (store_id, code, discount, active)
SELECT s.id, c.code, c.discount, true
FROM stores s,
(VALUES ('BIENVENIDO', 15), ('RIVAPP10', 10), ('PROMO20', 20)) AS c(code, discount)
WHERE s.slug = 'demo';

-- ============================================================
-- 4. RIDERS - Demo Delivery
-- ============================================================
INSERT INTO riders (store_id, branch_id, name, phone, access_pin, active)
SELECT s.id, b.id, r.name, r.phone, r.pin, true
FROM stores s
JOIN branches b ON b.store_id = s.id AND b.is_main = true,
(VALUES
    ('Carlos Gomez', '5492641234567', '1234'),
    ('Maria Lopez', '5492647654321', '5678'),
    ('Juan Perez', '5492649876543', '9012')
) AS r(name, phone, pin)
WHERE s.slug = 'demo';

-- ============================================================
-- 5. SERVICES - Demo Turnos
-- ============================================================
INSERT INTO services (store_id, name, price, duration_minutes, active)
SELECT s.id, sv.name, sv.price, sv.duration, true
FROM stores s,
(VALUES
    ('Corte de Pelo', 5000, 30),
    ('Corte + Barba', 7500, 45),
    ('Barba Completa', 4000, 20),
    ('Tintura', 12000, 60),
    ('Alisado Keratina', 18000, 90),
    ('Tratamiento Capilar', 8000, 40),
    ('Corte Infantil', 3500, 20)
) AS sv(name, price, duration)
WHERE s.slug = 'demo-turnos';

-- ============================================================
-- 6. STAFF - Demo Turnos
-- ============================================================
INSERT INTO staff (store_id, name, role, active)
SELECT s.id, st.name, st.role, true
FROM stores s,
(VALUES
    ('Luciana Martinez', 'Estilista Senior'),
    ('Martin Rodriguez', 'Barbero'),
    ('Sofia Fernandez', 'Colorista'),
    ('Diego Alvarez', 'Barbero')
) AS st(name, role)
WHERE s.slug = 'demo-turnos';

-- ============================================================
-- 7. HORARIOS - Demo Turnos (Lunes a Sabado 9-20, Domingo cerrado)
-- ============================================================
INSERT INTO store_schedules (store_id, day_of_week, open_time, close_time, is_closed)
SELECT s.id, sch.dow, sch.open_t::time, sch.close_t::time, sch.closed
FROM stores s,
(VALUES
    (0, '09:00:00', '20:00:00', true),   -- Domingo: cerrado
    (1, '09:00:00', '20:00:00', false),   -- Lunes
    (2, '09:00:00', '20:00:00', false),   -- Martes
    (3, '09:00:00', '20:00:00', false),   -- Miercoles
    (4, '09:00:00', '20:00:00', false),   -- Jueves
    (5, '09:00:00', '20:00:00', false),   -- Viernes
    (6, '09:00:00', '14:00:00', false)    -- Sabado: medio dia
) AS sch(dow, open_t, close_t, closed)
WHERE s.slug = 'demo-turnos';

-- ============================================================
-- 8. CUPONES - Demo Turnos
-- ============================================================
INSERT INTO coupons (store_id, code, discount, active)
SELECT s.id, c.code, c.discount, true
FROM stores s,
(VALUES ('TURNO10', 10), ('PRIMERA', 20)) AS c(code, discount)
WHERE s.slug = 'demo-turnos';

-- ============================================================
-- FIN SEED
-- ============================================================
