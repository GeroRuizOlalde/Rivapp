import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from './supabase/client';
import { StoreProvider } from './context/StoreContext';

// --- PÁGINAS GLOBALES (Carga Diferida / Code Splitting) ---
const Landing = lazy(() => import('./pages/Landing'));
const GlobalLogin = lazy(() => import('./pages/GlobalLogin'));
const Register = lazy(() => import('./pages/Register'));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const CreateStore = lazy(() => import('./pages/CreateStore'));

// --- PÁGINAS DEL SAAS (TIENDAS) ---
const StoreHome = lazy(() => import('./pages/StoreHome')); 
const Tracking = lazy(() => import('./pages/Tracking'));
const Rider = lazy(() => import('./pages/Rider'));

// --- ADMIN ---
const Admin = lazy(() => import('./pages/Admin')); 
import SubscriptionGuard from './components/shared/SubscriptionGuard';

// 🟢 LAYOUT ENVOLTORIO (StoreProvider)
const StoreLayout = () => {
  return (
    <StoreProvider>
      <Outlet /> 
    </StoreProvider>
  );
};

// Componente de carga simple para el Suspense
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-black text-[#d0ff00] font-bold">
    Cargando Rivapp...
  </div>
);

function App() {
  const navigate = useNavigate();

  // 🟢 DETECTAR RECUPERACIÓN DE CONTRASEÑA
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log("Modo recuperación detectado, redirigiendo...");
        navigate('/update-password');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="app-container">
      {/* Suspense es el "paracaídas". Mientras el navegador descarga el pedacito de código 
          de la página a la que vas, muestra el fallback.
      */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          
          {/* 1. RUTAS GLOBALES */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<GlobalLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/update-password" element={<UpdatePassword />} /> 
          <Route path="/master-panel" element={<SuperAdmin />} />

          {/* 2. RUTA DE ONBOARDING */}
          <Route path="/create-store" element={<CreateStore />} />

          {/* 3. RUTA DE TRACKING GLOBAL */}
          <Route path="/tracking/:token" element={<Tracking />} />

          {/* 4. RUTAS DE CLIENTES SAAS (Dinámicas /:slug) */}
          <Route path="/:slug" element={<StoreLayout />}>
            <Route index element={<StoreHome />} />
            
            <Route path="admin" element={
              <SubscriptionGuard>
                <Admin />
              </SubscriptionGuard>
            } />
            
            <Route path="rider" element={<Rider />} />
          </Route>

          {/* 5. FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Suspense>
    </div>
  );
}

export default App;