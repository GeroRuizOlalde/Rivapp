# Rivapp 🚀

**Rivapp** es una plataforma SaaS *mobile-first* diseñada para la gestión integral de negocios gastronómicos y de delivery. Funciona como una **Progressive Web App (PWA)**, ofreciendo una experiencia nativa, gestión de pedidos en tiempo real y pagos integrados.

![Rivapp Banner](https://via.placeholder.com/1000x300/d0ff00/000000?text=RIVAPP+SaaS)

## ✨ Características Principales

* **📱 PWA & Mobile-First:** Instalable en iOS y Android, con soporte offline y caché inteligente (Workbox).
* **⚡ Gestión en Tiempo Real:** Actualización instantánea de estados de pedidos (Supabase Realtime).
* **🔔 Notificaciones Sonoras:** Alertas personalizadas (campana, moto) para nuevos pedidos y cambios de estado.
* **💳 Pagos Integrados:** Integración completa con **MercadoPago** (Webhooks, Checkout Pro).
* **📊 Dashboard Analítico:** Visualización de métricas y ventas con gráficos interactivos (Recharts).
* **🛡️ Roles y Seguridad:** Gestión de dueños de tienda y staff mediante Supabase Auth.
* **⚡ Performance:** Construido con Vite para una carga ultra rápida.

## 🛠 Tech Stack

### Frontend (Cliente)
* **Core:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Lenguaje:** TypeScript / JavaScript (ES6+)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
* **Estado Global:** [Redux Toolkit](https://redux-toolkit.js.org/)
* **Animaciones:** [Framer Motion](https://www.framer.com/motion/)
* **Validaciones:** [Zod](https://zod.dev/)
* **Gráficos:** [Recharts](https://recharts.org/)
* **Iconos:** [Lucide React](https://lucide.dev/)
* **PWA:** Workbox (`vite-plugin-pwa`)

### Backend & Servicios (Serverless)
* **BaaS:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime).
* **Edge Functions:** Deno (TypeScript) para lógica de negocio crítica:
    * `create-store-owner`: Gestión de usuarios.
    * `mercadopago-webhook`: Procesamiento de pagos.
    * `send-welcome-email`: Notificaciones transaccionales.

## 🚀 Instalación y Configuración Local

### Prerrequisitos
* Node.js (v18+)
* NPM o Yarn
* Cuenta en Supabase y MercadoPago (para testing).

### Pasos

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/rivapp.git](https://github.com/tu-usuario/rivapp.git)
    cd rivapp/pedido-delivery
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Crea un archivo `.env` en la raíz de `pedido-delivery` basado en el siguiente esquema:

    ```env
    VITE_SUPABASE_URL=tu_supabase_project_url
    VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
    VITE_MERCADOPAGO_PUBLIC_KEY=tu_mp_public_key
    ```

4.  **Correr el entorno de desarrollo:**
    ```bash
    npm run dev
    ```
    La app estará disponible en `http://localhost:5173`.

## ☁️ Supabase Edge Functions

Para desplegar o probar las funciones serverless (webhooks de pagos, emails):

1.  Login en Supabase CLI:
    ```bash
    npx supabase login
    ```
2.  Desplegar funciones:
    ```bash
    npx supabase functions deploy
    ```

## 📦 Scripts Disponibles

* `npm run dev`: Inicia el servidor de desarrollo.
* `npm run build`: Genera la build de producción (dist).
* `npm run preview`: Vista previa local de la build de producción.
* `npm run lint`: Revisa errores de linting (ESLint).

## 📂 Estructura del Proyecto

```text
pedido-delivery/
├── dist/                # Build de producción (PWA assets)
├── src/
│   ├── app/             # Configuración de Redux (store)
│   ├── components/      # Componentes UI reutilizables
│   ├── features/        # Slices de Redux y lógica por funcionalidad
│   ├── hooks/           # Custom hooks
│   ├── services/        # Clientes de API (Supabase, MP)
│   └── styles/          # Tailwind inputs
├── supabase/
│   └── functions/       # Edge Functions (Deno)
└── public/              # Assets estáticos (iconos, sonidos)