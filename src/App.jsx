import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from './supabase/client';
import { StoreProvider } from './context/StoreContext';
import { logger } from './utils/logger';
import AppErrorBoundary from './components/shared/AppErrorBoundary';

// --- PAGINAS GLOBALES (Carga Diferida / Code Splitting) ---
const Landing = lazy(() => import('./pages/Landing'));
const GlobalLogin = lazy(() => import('./pages/GlobalLogin'));
const Register = lazy(() => import('./pages/Register'));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const CreateStore = lazy(() => import('./pages/CreateStore'));

// --- PAGINAS DEL SAAS (TIENDAS) ---
const StoreHome = lazy(() => import('./pages/StoreHome'));
const Tracking = lazy(() => import('./pages/Tracking'));
const Rider = lazy(() => import('./pages/rider.jsx'));

// --- ADMIN ---
const Admin = lazy(() => import('./pages/Admin'));
import SubscriptionGuard from './components/shared/SubscriptionGuard';

const StoreLayout = () => {
  return (
    <StoreProvider>
      <Outlet />
    </StoreProvider>
  );
};

const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-black text-[#d0ff00] font-bold">
    Cargando Rivapp...
  </div>
);

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        logger.debug('Modo recuperación detectado, redirigiendo...');
        navigate('/update-password');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="app-container">
      <AppErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<GlobalLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/master-panel" element={<SuperAdmin />} />

            <Route path="/create-store" element={<CreateStore />} />

            <Route path="/tracking/:token" element={<Tracking />} />

            <Route path="/:slug" element={<StoreLayout />}>
              <Route index element={<StoreHome />} />
              <Route
                path="admin"
                element={
                  <SubscriptionGuard>
                    <Admin />
                  </SubscriptionGuard>
                }
              />
              <Route path="rider" element={<Rider />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </div>
  );
}

export default App;
