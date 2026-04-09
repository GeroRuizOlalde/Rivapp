import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Store, Mail, Lock, ArrowRight, Loader2, CheckCircle, 
  AlertTriangle, Utensils, Scissors, Globe 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { appConfig } from '../config/appConfig';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [error, setError] = useState(null);

  // Formulario
  const [form, setForm] = useState({
    storeName: '',
    slug: '',
    type: 'gastronomia', // 'gastronomia' o 'turnos'
    email: '',
    password: ''
  });

  // Generador automático de URL (Slug)
  const handleNameChange = (e) => {
    const name = e.target.value;
    const generatedSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    
    setForm({ ...form, storeName: name, slug: generatedSlug });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Verificar si el SLUG ya existe
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', form.slug)
        .single();

      if (existingStore) {
        throw new Error("⚠️ Esa URL (slug) ya está en uso. Prueba con otro nombre.");
      }

      // 2. Crear Usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario.");

      // 3. Crear la Tienda en la Base de Datos
      const { error: storeError } = await supabase.from('stores').insert([
        {
          owner_id: authData.user.id,
          name: form.storeName,
          slug: form.slug,
          business_type: form.type,
          plan_type: 'trial', 
          subscription_status: 'active',
          subscription_expiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días gratis
          is_active: true
        }
      ]);

      if (storeError) throw storeError;

      // 4. Guardar sesión local
      localStorage.setItem('rivapp_session', JSON.stringify({
        id: authData.user.id,
        email: authData.user.email,
        slug: form.slug
      }));

      // 🟢 5. ENVIAR MAIL DE BIENVENIDA (Sin bloquear si falla)
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: { 
            email: form.email, 
            storeName: form.storeName,
            slug: form.slug,
            type: form.type === 'gastronomia' ? 'Gastronomía' : 'Turnos y Servicios'
          }
        });
      } catch (mailError) {
        console.warn("⚠️ El usuario se creó, pero falló el envío del mail:", mailError);
      }

      // 6. Redirigir al Admin correcto
      alert("¡Cuenta creada con éxito! Te enviamos un correo de confirmación. 🚀");
      navigate(`/${form.slug}/admin`);

    } catch (err) {
      console.error(err);
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Fondo Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#d0ff00]/10 rounded-full blur-[100px]"/>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"/>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
              <Store size={32} className="text-white"/>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Crea tu Cuenta</h1>
          <p className="text-gray-400 mt-2">Empieza a digitalizar tu negocio hoy.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[#111] border border-white/10 p-8 rounded-[2rem] shadow-2xl"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertTriangle size={18}/>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Paso 1: Tipo de Negocio */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">1. ¿Qué tipo de negocio tienes?</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button" 
                  onClick={() => setForm({...form, type: 'gastronomia'})}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${form.type === 'gastronomia' ? 'bg-[#d0ff00] border-[#d0ff00] text-black' : 'bg-[#1a1a1a] border-white/10 text-gray-400 hover:border-white/30'}`}
                >
                  <Utensils size={24}/>
                  <span className="font-bold text-sm">Gastronomía</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setForm({...form, type: 'turnos'})}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${form.type === 'turnos' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#1a1a1a] border-white/10 text-gray-400 hover:border-white/30'}`}
                >
                  <Scissors size={24}/>
                  <span className="font-bold text-sm">Turnos / Servicios</span>
                </button>
              </div>
            </div>

            {/* Paso 2: Datos del Negocio */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">2. Nombre del Local</label>
              <div className="relative group">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={20}/>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Burger King" 
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-white/30 transition-all placeholder:text-gray-600"
                  value={form.storeName}
                  onChange={handleNameChange}
                />
              </div>
              {form.slug && (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-500 bg-white/5 p-2 rounded-lg">
                  <Globe size={12}/>
                  <span>{appConfig.appDomainLabel}/<strong>{form.slug}</strong></span>
                </div>
              )}
            </div>

            {/* Paso 3: Datos de Acceso */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 block">3. Tus Datos de Acceso</label>
              
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={20}/>
                <input 
                  type="email" 
                  required
                  placeholder="tu@email.com" 
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-white/30 transition-all placeholder:text-gray-600"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={20}/>
                <input 
                  type="password" 
                  required
                  placeholder="Contraseña segura" 
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-white/30 transition-all placeholder:text-gray-600"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
              style={{
                backgroundColor: form.type === 'gastronomia' ? '#d0ff00' : '#2563eb',
                color: form.type === 'gastronomia' ? 'black' : 'white'
              }}
            >
              {loading ? <Loader2 className="animate-spin"/> : <>Crear Tienda <ArrowRight size={20}/></>}
            </button>

          </form>
        </motion.div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            ¿Ya tienes cuenta? <Link to="/login" className="text-white font-bold hover:underline">Iniciar Sesión</Link>
          </p>
        </div>

      </div>
    </div>
  );
}
