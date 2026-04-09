# Rivapp

**Rivapp** es una plataforma SaaS *mobile-first* para la gestion integral de negocios gastronomicos y de servicios/turnos. Funciona como **Progressive Web App (PWA)** con gestion de pedidos en tiempo real y pagos integrados con Mercado Pago.

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

Crear `.env` en la raiz:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

Iniciar desarrollo:
```bash
npm run dev
```

## Scripts

| Comando | Descripcion |
|---------|------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de produccion |
| `npm run preview` | Preview local del build |
| `npm run lint` | Linting con ESLint |

## Estructura

```
src/
├── components/    # Componentes reutilizables
├── context/       # StoreContext (tienda, sucursales, roles)
├── hooks/         # Custom hooks (useMenuData, useStoreStatus, useAdminRole)
├── pages/         # Paginas principales
├── store/         # Zustand stores (carrito)
├── supabase/      # Cliente Supabase
└── utils/         # Utilidades
supabase/
├── functions/     # Edge Functions
└── schema.sql     # Schema completo de la base de datos
```
