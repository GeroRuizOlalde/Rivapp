import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from './supabase/client';
import { StoreProvider } from './context/StoreContext';

// --- PÁGINAS GLOBALES ---
import Landing from './pages/Landing';
import GlobalLogin from './pages/GlobalLogin';
import Register from './pages/Register';
import SuperAdmin from './pages/SuperAdmin';
import UpdatePassword from './pages/UpdatePassword';

// --- PÁGINAS DEL SAAS (TIENDAS) ---
import StoreHome from './pages/StoreHome'; 
import Tracking from './pages/Tracking';
import Rider from './pages/Rider';

// --- ADMIN ---
import Admin from './pages/Admin'; 
import SubscriptionGuard from './components/shared/SubscriptionGuard';

// 🟢 LAYOUT ENVOLTORIO (StoreProvider)
// Envuelve todas las rutas que dependen del SLUG del negocio (/:slug)
const StoreLayout = () => {
  return (
    <StoreProvider>
      <Outlet /> 
    </StoreProvider>
  );
};

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
      <Routes>
        
        {/* 1. RUTAS GLOBALES (Plataforma Rivapp) */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GlobalLogin />} />
        <Route path="/update-password" element={<UpdatePassword />} /> 
        <Route path="/master-panel" element={<SuperAdmin />} />

        {/* 2. RUTA DE TRACKING GLOBAL (Segura y Directa) */}
        {/* URL: rivapp.com.ar/tracking/uuid-largo-seguro */}
        <Route path="/tracking/:token" element={<Tracking />} />

        {/* 3. RUTAS DE CLIENTES SAAS (rivapp.com.ar/nombre-local) */}
        {/* Todo aquí dentro tiene acceso al contexto de la tienda */}
        <Route path="/:slug" element={<StoreLayout />}>
          
          {/* Home del negocio (Menú o Servicios) */}
          <Route index element={<StoreHome />} />
          
          {/* Panel de Administración (Protegido) */}
          <Route path="admin" element={
            <SubscriptionGuard>
              <Admin />
            </SubscriptionGuard>
          } />
          
          {/* Vista para Repartidores */}
          <Route path="rider" element={<Rider />} />
          
        </Route>

        {/* 4. FALLBACK (Cualquier ruta desconocida va al inicio) */}
        <Route path="*" element={<Navigate to="/" replace />} />

        <Route path="/register" element={<Register />} />
        <Route path="/registro" element={<Register />} />

      </Routes>
    </div>
  );
}

export default App;