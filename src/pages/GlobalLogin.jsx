import React, { useState } from 'react';
import { supabase } from '../supabase/client'; 
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

export default function GlobalLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. PASO ÚNICO: Autenticación Segura con Supabase
      // Esto valida la contraseña encriptada (sirve para Admin y para Dueños)
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!user) throw new Error("No se pudo iniciar sesión.");

      // 2. VERIFICACIÓN: ¿Quién es este usuario?

      // A) Es el Super Admin
      if (user.email === 'admin@rivaestudio.com.ar') {
        navigate('/master-panel');
        return;
      }

      // B) Es un Dueño de Negocio -> Buscamos su tienda en la DB
      // 🟢 CORRECCIÓN: Buscamos por 'owner_id' (el ID seguro de Supabase)
      const { data: store, error: dbError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (dbError || !store) {
        // El usuario existe en Auth, pero no tiene tienda asignada en la tabla stores
        throw new Error("Usuario validado, pero no tiene una tienda asignada.");
      }

      if (!store.is_active) {
        throw new Error("Tu negocio se encuentra suspendido. Contacta a soporte.");
      }

      // 3. ÉXITO: Guardamos datos de conveniencia y redirigimos
      // Supabase ya maneja la sesión segura, esto es solo para tu frontend rápido
      localStorage.setItem('rivapp_session', JSON.stringify({
        store_id: store.id,
        slug: store.slug,
        role: 'admin',
        email: user.email
      }));

      navigate(`/${store.slug}/admin`);

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
      redirectTo: 'https://rivapp.com.ar/update-password', // Asegurate que esta URL exista
    });
    
    if (error) alert("Error: " + error.message);
    else alert("Revisa tu correo para recuperar la contraseña.");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111] border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Rivapp</h1>
          <p className="text-gray-500 text-sm">Gestiona tu negocio desde un solo lugar.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold">
              <AlertCircle size={18}/> {error}
            </div>
          )}

          <div className="flex justify-end">
            <button type="button" onClick={handleForgotPassword} className="text-xs text-gray-500 hover:text-white transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-[#d0ff00] hover:bg-white text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin"/> : <>Ingresar <ChevronRight size={20}/></>}
          </button>
        </form>
      </div>
    </div>
  );
}