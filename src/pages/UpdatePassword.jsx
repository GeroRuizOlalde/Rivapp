import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';
import { Lock, Save, Loader2, AlertCircle } from 'lucide-react';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      // Esta función actualiza la contraseña del usuario ACTUALMENTE logueado
      // (Supabase ya te logueó al hacer clic en el link del mail)
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;

      alert("¡Contraseña actualizada con éxito! 🎉");
      navigate('/'); // O a /superadmin

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111] border border-white/10 p-8 rounded-3xl shadow-2xl">
        <h2 className="text-3xl font-black text-white mb-2">Nueva Contraseña</h2>
        <p className="text-gray-500 text-sm mb-6">Ingresa tu nueva clave para recuperar el acceso.</p>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <div className="flex items-center bg-black/50 border border-white/10 rounded-2xl p-4 focus-within:border-[#d0ff00] transition-colors">
              <Lock className="text-gray-500 mr-3" size={20}/>
              <input 
                type="password" 
                className="bg-transparent w-full text-white outline-none placeholder-gray-600"
                placeholder="Nueva contraseña..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold">
              <AlertCircle size={18}/> {error}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-[#d0ff00] hover:bg-white text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin"/> : <><Save size={20}/> Actualizar Contraseña</>}
          </button>
        </form>
      </div>
    </div>
  );
}