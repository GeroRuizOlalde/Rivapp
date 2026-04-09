import { Check, ChevronRight, Crown } from 'lucide-react';

export default function BillingTab({ config, accentColor, onSubscribe }) {
  const hasProPlan =
    config.plan_type === 'pro' ||
    config.plan_type === 'profesional' ||
    config.subscription_status === 'active' ||
    config.is_demo;

  return (
    <div className="animate-in fade-in max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Suscripcion Rivapp</h1>
      </header>

      {hasProPlan ? (
        <div className="bg-gradient-to-br from-blue-900/40 to-[#111] p-8 rounded-3xl border border-blue-500/50 relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-blue-400 text-sm font-bold uppercase tracking-widest">TU PLAN ACTUAL</h3>
                <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                  <Crown size={10} /> PRO
                </span>
              </div>
              <h2 className="text-5xl font-bold text-white mb-2">Profesional</h2>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-3xl font-bold text-white">$40.000</div>
              <div className="text-sm text-gray-500">/ mes</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#111] p-8 rounded-3xl border border-white/10">
            <h3 className="text-gray-400 text-sm font-bold uppercase mb-2">TU PLAN ACTUAL</h3>
            <h2 className="text-4xl font-bold text-white mb-6">Plan Emprendedor</h2>
            <ul className="space-y-3 mb-8 text-gray-400 text-sm">
              <li className="flex items-center gap-2">
                <Check size={16} /> Menu Digital & Pedidos
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} /> Gestion Basica
              </li>
            </ul>
          </div>

          <div className="p-1 rounded-3xl shadow-2xl" style={{ background: `linear-gradient(to bottom right, ${accentColor}, #0a0a0a)` }}>
            <div className="bg-[#0f0f0f] h-full w-full rounded-[22px] p-8">
              <h3 className="text-sm font-bold uppercase mb-2" style={{ color: accentColor }}>
                PLAN PRO
              </h3>
              <div className="flex items-end gap-2 mb-6">
                <h2 className="text-5xl font-bold text-white">$40.000</h2>
              </div>
              <button
                onClick={onSubscribe}
                className="w-full py-4 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                Pasarme a PRO <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
