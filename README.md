# Rivapp

**Rivapp** es una plataforma SaaS mobile-first para la gestion integral de negocios gastronomicos y de servicios/turnos. Funciona como **Progressive Web App (PWA)** con pedidos en tiempo real y pagos integrados con Mercado Pago.

## Tech Stack

### Frontend
- **React 19** + **Vite 6**
- **Tailwind CSS 4**
- **Zustand** (estado global)
- **Framer Motion** (animaciones)
- **Recharts** (graficos)
- **Lucide React** (iconos)
- **React Leaflet** (mapas)
- **vite-plugin-pwa** (PWA/Workbox)

### Backend (Serverless)
- **Supabase** (PostgreSQL, Auth, Storage, Realtime)
- **Edge Functions** (Deno/TypeScript): webhooks de pago, creacion de usuarios, emails

## Instalacion

```bash
npm install
```

Copia `.env.example` a `.env` y completa los valores:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_APP_URL=http://localhost:5173
VITE_APP_DOMAIN_LABEL=localhost:5173
VITE_SUPPORT_WHATSAPP=5491100000000
VITE_MP_SUBSCRIPTION_LINK_EMPRENDEDOR=
VITE_MP_SUBSCRIPTION_LINK_PROFESIONAL=
VITE_ENABLE_DEBUG_LOGS=false
```

Iniciar desarrollo:

```bash
npm run dev
```

## Seguridad y plataforma

Para habilitar el panel master sin hardcodear emails en el frontend:

1. Ejecuta `supabase/platform-admin-hardening.sql` en el SQL Editor de Supabase.
2. Asigna `raw_app_meta_data.rivapp_role = "platform_admin"` al usuario que administrara la plataforma.

El script tambien restringe `global_notifications` para que ya no pueda escribir cualquier usuario autenticado.

Secrets recomendados en Supabase para Edge Functions:

- `APP_BASE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `MP_ACCESS_TOKEN`

## Scripts

| Comando | Descripcion |
|---------|------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de produccion |
| `npm run preview` | Preview local del build |
| `npm run lint` | Linting con ESLint |

## Estructura

```text
src/
|- components/    # Componentes reutilizables
|- config/        # Configuracion publica centralizada
|- context/       # StoreContext (tienda, sucursales, roles)
|- hooks/         # Custom hooks
|- pages/         # Paginas principales
|- store/         # Zustand stores
|- supabase/      # Cliente Supabase
`- utils/         # Utilidades y helpers
supabase/
|- functions/     # Edge Functions
|- platform-admin-hardening.sql
`- schema.sql     # Schema completo de la base de datos
```
