# Rivapp — Smoke Test Guiado

Checklist manual para validar que **toda** la app funciona de punta a punta antes
de cada release. Pensado para correrse en ~30–45 min y dejar Rivapp "como los
mejores": no solo que no crashee, sino que cada flujo se sienta pulido.

## Cómo usar este documento

- Marcá `[x]` lo que pasa, dejá una nota al lado de lo que falla.
- **Prioridades**: `P0` rompe negocio (no se puede vender/cobrar/entrar) ·
  `P1` degrada la experiencia · `P2` pulido.
- Una corrida completa antes de mergear a `main`. Como mínimo, **todos los P0**
  antes de cualquier deploy.

### Preparar el entorno (una vez)

- [ ] **No testear flujos que escriben contra la base de producción con datos
  basura.** Usar una tienda **demo / de prueba** (slug propio) o un entorno de
  staging. Pedidos/turnos/usuarios reales creados en prod hay que borrarlos.
- [ ] `.env` local cargado. Verificar que la app levanta: `npm run dev` →
  abre sin la pantalla "Algo salió mal" ni "supabaseKey is required".
- [ ] Tener a mano: 1 cuenta **owner** de prueba, 1 **manager**, 1 **staff**,
  1 **rider** con PIN, y (si se prueba cobro) credenciales **Mercado Pago de
  test**.
- [ ] Navegador con consola abierta (F12) durante toda la corrida.

---

## 0. Pre-flight automatizado (2 min) · P0

- [ ] `npm run lint` → sin errores.
- [ ] `npm run build` → compila sin errores.
- [ ] `npm run test:e2e` → 13 pasan, 1 skipped (~7s). Si algo falla acá,
  **frenar**: la app no bootea o una ruta crashea.
- [ ] Consola del navegador en el home: sin errores rojos (warnings de React
  toleran, excepciones no).

---

## 1. Onboarding y acceso · P0

- [ ] **Registro** (`/register`): elegir vertical (Gastronomía / Turnos),
  completar nombre, slug, email, password → crea cuenta y tienda, redirige al
  panel. Slug inválido / email repetido → muestra error claro, no crashea.
- [ ] **Login** (`/login`) con owner → entra a `/:slug/admin`.
- [ ] Login con **credenciales inválidas** → "Email o contraseña incorrectos.",
  no navega.
- [ ] Login con cuenta **sin tienda** → redirige a `/create-store`.
- [ ] **Platform admin** → login redirige a `/master-panel`.
- [ ] Login con tienda **suspendida** → mensaje "licencia suspendida".
- [ ] Login con tienda **vencida** → mensaje "licencia venció".
- [ ] **Olvidé contraseña**: pide email, dispara mail de reset, `/update-password`
  permite cambiarla y volver a entrar.
- [ ] Logout limpia sesión (no se puede volver al panel con "atrás").

---

## 2. Vitrina pública — Gastronomía · P0

Ruta: `/:slug` de una tienda con `business_type` gastronomía.

- [ ] La tienda carga: logo, nombre, colores de marca aplicados.
- [ ] Slug inexistente → 404 controlado ("Tienda no encontrada"), nunca el
  ErrorBoundary.
- [ ] **Multi-sucursal**: si hay >1 branch, aparece el selector de sucursal y
  bloquea la vitrina hasta elegir; "Cambiar" vuelve a abrirlo.
- [ ] Menú: categorías y productos visibles, **búsqueda** filtra.
- [ ] `ProductCard`: agregar al carrito, variantes/extras si los hay, suma bien
  el precio.
- [ ] Botón flotante **"Ver Carrito"** muestra cantidad y total correctos;
  oculto si el carrito está vacío.
- [ ] Tienda **cerrada / fuera de horario**: se comunica el estado (no deja
  comprar como si estuviera abierta sin avisar).
- [ ] Producto/categoría inactivo no aparece en la vitrina.

### 2.1 Checkout — Delivery · P0

- [ ] Toggle **Delivery / Retiro** funciona.
- [ ] Modal de ubicación: "Activar ubicación" (geolocalización) **o** "Ingresar
  dirección a mano" → mapa (Leaflet/Google) permite fijar el punto.
- [ ] **Costo de envío** se calcula por distancia (base + por km) y se muestra;
  sin ubicación no deja confirmar delivery.
- [ ] Datos del cliente (nombre, teléfono) requeridos.
- [ ] **Cupón** válido aplica descuento; inválido muestra mensaje y no descuenta.
- [ ] Total final = productos + envío − cupón (verificar números).

### 2.2 Checkout — pago Efectivo · P0

- [ ] Pagar en efectivo → crea la orden, abre **WhatsApp** al local con el
  resumen, redirige a `/tracking/:token`.
- [ ] La orden aparece en el panel admin (tab Pedidos) en tiempo real.

### 2.3 Checkout — pago Mercado Pago · P0

> Requiere `store_secrets` MP configuradas en la tienda (ver §7).

- [ ] Pagar con MP → invoca `create-order-preference`, redirige al checkout de
  Mercado Pago.
- [ ] Pago **aprobado** (tarjeta de test) → la orden queda paga / confirmada en
  el panel (webhook `mp-webhook`).
- [ ] Pago **rechazado / abandonado** → la orden no queda como pagada; el
  usuario puede reintentar.
- [ ] Tienda **sin MP configurado**: la opción MP no rompe el checkout (se
  comunica o se oculta).

### 2.4 Retiro en local · P1

- [ ] Modo "Retiro": no pide dirección ni cobra envío; total sin costo de envío.

---

## 3. Tracking del pedido (`/tracking/:token`) · P0

- [ ] Token válido → muestra estado del pedido y barra de progreso.
- [ ] Al cambiar el estado desde el panel/rider, el tracking **se actualiza en
  vivo** (realtime).
- [ ] Pedido **entregado** → aparece modal de **calificación + reseña**;
  enviarla guarda la reseña (visible luego en admin → Reseñas).
- [ ] Token inválido → estado vacío/elegante, sin crashear.

---

## 4. Panel Rider (`/:slug/rider`) · P0

- [ ] Login por **PIN**: PIN correcto de un rider `active` entra; PIN incorrecto
  o rider inactivo → "PIN incorrecto o usuario inactivo".
- [ ] Lista de pedidos asignados al rider de esa tienda.
- [ ] Entra un pedido nuevo → suena el aviso (toggle de sonido moto on/off).
- [ ] Cambiar estado del pedido (en camino / entregado) → se refleja en panel y
  tracking.
- [ ] Botón de **navegación / mapa** abre la dirección del cliente.
- [ ] Logout limpia la sesión del rider.

---

## 5. Vitrina pública — Turnos · P0

Ruta: `/:slug` de una tienda `business_type` turnos/services.

- [ ] Paso **1 Servicio**: lista de servicios con precio/duración; seleccionar
  avanza.
- [ ] Paso **2 Profesional**: aparece solo si la tienda tiene staff; se puede
  elegir profesional.
- [ ] Paso **3 Fecha**: calendario respeta `store_schedules` (no ofrece días/horas
  fuera de horario ni slots ocupados).
- [ ] Paso **4 Confirmar**: datos del cliente + medio de pago → crea el turno
  (`appointments`); aparece en admin → Solicitudes.
- [ ] Pago MP / efectivo en turnos se comporta igual que en gastronomía (§2.3).
- [ ] No permite reservar un slot ya tomado (probar doble reserva del mismo
  horario).

---

## 6. Panel Admin

Entrar como **owner** salvo que se indique. Para cada tab: carga sin error de
consola, muestra estado de carga, estado **vacío** elegante si no hay datos, y
las acciones persisten (recargar y verificar).

### 6.1 Admin Gastronomía (`/:slug/admin`) · P0/P1

- [ ] **Panel** (dashboard): métricas/gráficos cargan con datos reales. `P1`
- [ ] **Pedidos**: pedidos en vivo; cambiar estado, asignar **rider**, sonido de
  campana en pedido nuevo; filtros. `P0`
- [ ] **Menu**: crear / editar / eliminar producto y categoría; subir imagen;
  activar/desactivar; cambios visibles en la vitrina. `P0`
- [ ] **Equipo** (pro): invitar miembro por email (`invite-user`), asignar rol y
  sucursal; el invitado puede entrar. `P1`
- [ ] **Clientes / CRM** (pro): lista de clientes, export CSV. `P2`
- [ ] **Riders** (pro): crear rider con PIN y sucursal; activar/desactivar. `P0`
- [ ] **Cupones** (pro): crear cupón; se aplica en el checkout (§2.1). `P1`
- [ ] **Reseñas** (pro): se ven las reseñas dejadas en tracking. `P2`
- [ ] **Historial** (pro): pedidos pasados, filtros. `P2`
- [ ] **Suscripción** (billing): muestra plan/estado/vencimiento y links de
  pago MP. `P1`
- [ ] **Ajustes**: editar datos del negocio, horarios, sucursales, colores;
  cambios se reflejan en la vitrina. `P0`

### 6.2 Admin Turnos (`/:slug/admin`) · P0/P1

- [ ] **Resumen**: métricas del negocio cargan. `P1`
- [ ] **Solicitudes** (inbox): confirmar / rechazar turno → notifica al cliente
  y libera/ocupa el slot. `P0`
- [ ] **Agenda**: vistas Día / Semana / Mes correctas; se ven los turnos. `P0`
- [ ] **Servicios**: crear / editar / eliminar servicio (precio, duración);
  visible en la vitrina. `P0`
- [ ] **Equipo** (pro): alta de staff/profesionales. `P1`
- [ ] **Marketing** (pro): la sección carga y opera. `P2`
- [ ] **Usuarios** (pro): gestión de usuarios. `P2`
- [ ] **Mi negocio** (profile): datos del negocio, edición persiste. `P1`
- [ ] **Suscripción**: plan/estado/vencimiento. `P1`
- [ ] **Horarios** (config): definir horarios; la vitrina (paso 3) los respeta. `P0`

---

## 7. Pagos y suscripción (Mercado Pago) · P0

- [ ] **Configurar MP de la tienda**: en admin guardar access token / public
  key → `save-mp-settings` persiste en `store_secrets` (no expone el secreto en
  el cliente).
- [ ] Quitar credenciales MP → la tienda vuelve a estado "sin MP".
- [ ] **Cobro de pedido** end-to-end (§2.3) con webhook actualizando la orden.
- [ ] **Suscripción SaaS**: desde "Suscripción" el link MP
  (emprendedor/profesional) abre el checkout correcto.
- [ ] Tras pagar la suscripción, el estado del plan se actualiza
  (`subscription_payments` / webhook) y se levanta el bloqueo.

---

## 8. Roles, permisos y guards · P0

- [ ] **Staff** en admin gastronomía: solo ve **Panel** y **Pedidos**.
- [ ] **Manager**: ve todo **menos Suscripción**.
- [ ] **Owner**: ve todo.
- [ ] Usuario **sin rol** en una tienda → redirige a la vitrina `/:slug`, no
  entra al admin.
- [ ] **Sin sesión** en `/:slug/admin` → redirige a `/login`.
- [ ] Plan **expirado** y no demo → pantalla "Tu suscripción expiró" con planes;
  `is_demo` / trial / plan activo entran normal.
- [ ] **Aislamiento de tenant (RLS)**: con sesión de la tienda A, no se pueden
  leer pedidos/clientes/servicios de la tienda B (probar cambiando el slug en
  la URL del admin). `P0` — crítico de seguridad.
- [ ] `/master-panel` solo accesible para platform admin.

---

## 9. Calidad transversal — "como los mejores" · P1/P2

- [ ] **Mobile-first**: probar vitrina, checkout y admin en viewport de celular
  (375px). Sidebar admin colapsa a bottom-nav / drawer "Más". `P1`
- [ ] **PWA**: la app ofrece instalarse; funciona offline el shell básico. `P2`
- [ ] **Estados**: cada lista tiene loading, vacío y error decentes (no spinner
  infinito ni pantalla en blanco). `P1`
- [ ] **Consola limpia**: recorrer los flujos P0 sin una sola excepción JS. `P1`
- [ ] **Sentry**: forzar un error de prueba y verificar que llega a Sentry. `P2`
- [ ] **Performance**: Lighthouse mobile en la vitrina ≥ 80 en Performance;
  imágenes no gigantes, sin layout shift grosero. `P2`
- [ ] **SEO/meta**: la vitrina tiene `<title>` y meta description con el nombre
  del negocio (`useDocumentMeta`). `P2`
- [ ] **Accesibilidad básica**: foco visible, inputs con label, navegación por
  teclado en login y checkout. `P2`
- [ ] **Copys/i18n**: textos en español rioplatense, sin placeholders ni
  "lorem", sin `Configurá VITE_...` visibles en producción. `P1`
- [ ] **Doble submit**: clickear "Confirmar pedido" / "Reservar" dos veces
  rápido no crea duplicados (botón se deshabilita). `P0`

---

## Registro de la corrida

| Fecha | Versión / commit | Quién | P0 OK | Bugs abiertos |
|-------|------------------|-------|-------|---------------|
|       |                  |       |       |               |

> Regla de oro: **no se deploya con un P0 en rojo.** Cada bug encontrado acá
> debería convertirse, cuando se pueda, en un test automatizado en `e2e/`.
