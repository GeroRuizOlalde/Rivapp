import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client'; 
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ChevronRight, AlertCircle, Loader2, UserPlus, ArrowRight } from 'lucide-react';

export default function GlobalLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 🟢 DETECCIÓN DE INVITACIÓN
  const inviteId = searchParams.get('invite');
  const [isRegistering, setIsRegistering] = useState(!!inviteId);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let user = null;

      // 1. AUTENTICACIÓN (LOGIN O REGISTRO)
      if (isRegistering) {
        // --- MODO REGISTRO ---
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { invited_by_link: !!inviteId }
          }
        });
        if (signUpError) throw signUpError;
        user = data.user;
        
        if (!user && !data.session) {
            throw new Error("Registro iniciado. Por favor verifica tu correo si es necesario.");
        }
      } else {
        // --- MODO LOGIN ---
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (authError) throw authError;
        user = data.user;
      }

      if (!user) throw new Error("No se pudo obtener el usuario.");

      // 2. VERIFICACIÓN: ¿Quién es este usuario?

      // A) Es el Super Admin
      if (user.email === 'admin@rivaestudio.com.ar') {
        navigate('/master-panel');
        return;
      }

      // B) BUSCAR TIENDA ASOCIADA
      let targetStore = null;
      let userRole = 'staff';

      // Intento 1: ¿Es DUEÑO?
      const { data: ownerStore } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ownerStore) {
        targetStore = ownerStore;
        userRole = 'owner';
      } else {
        // Intento 2: ¿Es MIEMBRO DE EQUIPO?
        const { data: memberData } = await supabase
            .from('branch_memberships')
            .select('role, branches(store_id, stores(slug, id, is_active))') 
            .eq('user_id', user.id)
            .maybeSingle();
        
        if (memberData && memberData.branches?.stores) {
            targetStore = memberData.branches.stores;
            targetStore.id = memberData.branches.store_id;
            userRole = memberData.role;
        } else {
            // Intento 3: ¿Es ADMIN DE NEGOCIO?
            const { data: storeMember } = await supabase
                .from('store_memberships')
                .select('role, stores(*)')
                .eq('user_id', user.id)
                .maybeSingle();
            
            if (storeMember && storeMember.stores) {
                targetStore = storeMember.stores;
                userRole = storeMember.role;
            }
        }
      }

      // 🛑 AQUÍ ESTÁ EL CAMBIO CRÍTICO 🛑
      if (!targetStore) {
        // En lugar de dar error, redirigimos a crear la tienda (Onboarding)
        // Guardamos un flag en localStorage por si acaso
        localStorage.setItem('rivapp_session_temp', JSON.stringify({ email: user.email }));
        
        // Asegúrate de que esta ruta '/create-store' exista en tu App.jsx
        navigate('/create-store'); 
        return;
      }

      if (targetStore.is_active === false) {
        throw new Error("Este negocio se encuentra suspendido. Contacta a soporte.");
      }

      // 3. ÉXITO (Usuario con tienda): Guardar sesión y redirigir
      localStorage.setItem('rivapp_session', JSON.stringify({
        store_id: targetStore.id,
        slug: targetStore.slug,
        role: userRole,
        email: user.email
      }));

      navigate(`/${targetStore.slug}/admin`);

    } catch (err) {
      console.error(err);
      setError(err.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if(!formData.email) return alert("Escribe tu email primero.");
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: 'https://rivapp.com.ar/update-password',
    });
    if (error) alert("Error: " + error.message);
    else alert("Revisa tu correo para recuperar la contraseña.");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111] border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {inviteId && (
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#d0ff00] to-transparent"></div>
        )}

        {inviteId && (
          <div className="mb-6 bg-[#d0ff00]/10 border border-[#d0ff00]/30 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <div className="bg-[#d0ff00] text-black rounded-full p-2 shrink-0">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="text-[#d0ff00] font-bold text-sm">¡Invitación Recibida!</h3>
              <p className="text-gray-400 text-xs leading-tight">Crea tu cuenta con el email invitado para acceder.</p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Rivapp<span className="text-[#d0ff00]">.</span></h1>
          <p className="text-gray-500 text-sm">
            {isRegistering ? 'Crea tu cuenta profesional' : 'Gestiona tu negocio desde un solo lugar'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-2 mb-2 block">Email</label>
            <div className="flex items-center bg-black/50 border border-white/10 rounded-2xl p-4 focus-within:border-[#d0ff00] transition-colors">
              <Mail className="text-gray-500 mr-3" size={20}/>
              <input 
                type="email" 
                className="bg-transparent w-full text-white outline-none placeholder-gray-600"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-2 mb-2 block">Contraseña</label>
            <div className="flex items-center bg-black/50 border border-white/10 rounded-2xl p-4 focus-within:border-[#d0ff00] transition-colors">
              <Lock className="text-gray-500 mr-3" size={20}/>
              <input 
                type="password" 
                className="bg-transparent w-full text-white outline-none placeholder-gray-600"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold animate-in fade-in">
              <AlertCircle size={18}/> {error}
            </div>
          )}

          {!isRegistering && (
            <div className="flex justify-end">
                <button type="button" onClick={handleForgotPassword} className="text-xs text-gray-500 hover:text-white transition-colors">
                ¿Olvidaste tu contraseña?
                </button>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#d0ff00] hover:bg-white text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#d0ff00]/20"
          >
            {loading ? <Loader2 className="animate-spin"/> : (
                isRegistering ? <>Crear Cuenta <UserPlus size={20}/></> : <>Ingresar <ChevronRight size={20}/></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-white/5">
          <button 
            onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isRegistering ? (
                <>¿Ya tienes cuenta? <span className="text-[#d0ff00] font-bold ml-1">Inicia Sesión</span></>
            ) : (
                <>¿No tienes cuenta? <span className="text-[#d0ff00] font-bold ml-1">Regístrate</span></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}