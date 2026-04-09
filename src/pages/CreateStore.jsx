import { useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';
import { Store, Utensils, Scissors, Globe, ArrowRight, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { appConfig } from '../config/appConfig';

export default function CreateStore() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', type: 'gastronomia' });

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setForm({ ...form, name, slug });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!form.name.trim() || !form.slug.trim()) throw new Error('Completa el nombre de tu negocio.');

      const { data: existing } = await supabase.from('stores').select('id').eq('slug', form.slug).single();
      if (existing) throw new Error('Esa URL ya esta en uso. Prueba con otro nombre.');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesion expirada. Vuelve a iniciar sesion.');

      const { error: storeError } = await supabase.from('stores').insert([{
        owner_id: session.user.id,
        name: form.name,
        slug: form.slug,
        business_type: form.type,
        plan_type: 'trial',
        subscription_status: 'active',
        subscription_expiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        owner_email: session.user.email,
      }]);

      if (storeError) throw storeError;

      localStorage.setItem('rivapp_session', JSON.stringify({
        id: session.user.id,
        email: session.user.email,
        slug: form.slug,
      }));

      navigate(`/${form.slug}/admin`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#d0ff00]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store size={32} className="text-[#d0ff00]" />
          </div>
          <h1 className="text-3xl font-black">Crea tu negocio</h1>
          <p className="text-gray-400 mt-2">Configura tu tienda en menos de un minuto.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Nombre */}
          <div>
            <label className="text-sm font-bold text-gray-400 mb-2 block">Nombre del negocio</label>
            <input
              type="text"
              value={form.name}
              onChange={handleNameChange}
              placeholder="Ej: Pizzeria Don Juan"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:border-[#d0ff00]/50 focus:outline-none transition"
              required
            />
          </div>

          {/* URL Preview */}
          {form.slug && (
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3">
              <Globe size={16} className="text-gray-500 shrink-0" />
              <span className="text-gray-500 text-sm">{appConfig.appDomainLabel}/</span>
              <span className="text-[#d0ff00] text-sm font-bold">{form.slug}</span>
            </div>
          )}

          {/* Tipo de negocio */}
          <div>
            <label className="text-sm font-bold text-gray-400 mb-3 block">Tipo de negocio</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'gastronomia' })}
                className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${form.type === 'gastronomia' ? 'border-[#d0ff00] bg-[#d0ff00]/5' : 'border-white/10 bg-[#1a1a1a]'}`}
              >
                <Utensils size={28} className={form.type === 'gastronomia' ? 'text-[#d0ff00]' : 'text-gray-500'} />
                <span className={`text-sm font-bold ${form.type === 'gastronomia' ? 'text-white' : 'text-gray-500'}`}>Gastronomia</span>
                <span className="text-[10px] text-gray-500">Pedidos y delivery</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'turnos' })}
                className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${form.type === 'turnos' ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 bg-[#1a1a1a]'}`}
              >
                <Scissors size={28} className={form.type === 'turnos' ? 'text-blue-500' : 'text-gray-500'} />
                <span className={`text-sm font-bold ${form.type === 'turnos' ? 'text-white' : 'text-gray-500'}`}>Turnos</span>
                <span className="text-[10px] text-gray-500">Reservas y agenda</span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <AlertTriangle size={18} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d0ff00] text-black py-4 rounded-2xl font-bold text-lg hover:bg-[#e1ff55] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 size={22} className="animate-spin" /> : <><CheckCircle size={22} /> Crear Negocio</>}
          </button>

          <p className="text-center text-xs text-gray-500">
            14 dias de prueba gratis. Sin tarjeta de credito.
          </p>
        </form>
      </div>
    </div>
  );
}
