import { useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Store, Utensils, Scissors, Globe, ArrowRight, Loader2, CheckCircle2, AlertTriangle, Sparkles,
} from 'lucide-react';
import { appConfig } from '../config/appConfig';
import Button from '../components/shared/ui/Button';
import Field from '../components/shared/ui/Field';
import Eyebrow from '../components/shared/ui/Eyebrow';
import Rule from '../components/shared/ui/Rule';

export default function CreateStore() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', type: 'gastronomia' });

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
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
      if (!form.name.trim() || !form.slug.trim()) throw new Error('Completá el nombre de tu negocio.');

      const { data: existing } = await supabase.from('stores').select('id').eq('slug', form.slug).single();
      if (existing) throw new Error('Esa URL ya está en uso. Probá con otro nombre.');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesión expirada. Iniciá sesión de nuevo.');

      const { error: storeError } = await supabase.from('stores').insert([
        {
          owner_id: session.user.id,
          name: form.name,
          slug: form.slug,
          business_type: form.type,
          plan_type: 'trial',
          subscription_status: 'active',
          subscription_expiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          owner_email: session.user.email,
        },
      ]);

      if (storeError) throw storeError;

      localStorage.setItem(
        'rivapp_session',
        JSON.stringify({
          id: session.user.id,
          email: session.user.email,
          slug: form.slug,
        })
      );

      navigate(`/${form.slug}/admin`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6 py-16 text-text">
      <div className="pointer-events-none absolute inset-0 z-0 grain" aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute left-[-10%] top-[-20%] h-[60vw] w-[60vw] rounded-full bg-acid/[0.04] blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[50vw] w-[50vw] rounded-full bg-ml/[0.06] blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-acid text-ink">
            <Sparkles className="h-5 w-5" />
          </div>
          <Eyebrow className="mt-6 justify-center">Paso final</Eyebrow>
          <h1 className="display mt-3 text-4xl text-text md:text-5xl">
            Creá tu <em className="display-italic text-acid">negocio</em>
          </h1>
          <p className="mt-3 max-w-sm text-sm text-text-muted">
            Configurá tu tienda en menos de un minuto — ya tenés sesión abierta.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-8 md:p-10 anim-rise"
        >
          {/* 01 · Nombre */}
          <fieldset>
            <legend className="flex items-baseline gap-3">
              <span className="num text-xl text-text-muted">01</span>
              <span className="display text-xl text-text md:text-2xl">
                Nombre del <em className="display-italic text-acid">negocio</em>
              </span>
            </legend>
            <div className="mt-5">
              <Field
                icon={Store}
                placeholder="Ej: Pizzería Don Juan"
                value={form.name}
                onChange={handleNameChange}
                required
              />
              {form.slug && (
                <div className="mt-3 flex items-center gap-3 rounded-[var(--radius-md)] border border-acid/20 bg-acid/5 p-3">
                  <Globe className="h-4 w-4 shrink-0 text-acid" />
                  <div className="min-w-0">
                    <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                      Tu URL pública
                    </p>
                    <p className="mono mt-0.5 truncate text-sm text-text">
                      {appConfig.appDomainLabel}/<span className="text-acid">{form.slug}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </fieldset>

          <Rule className="my-8" />

          {/* 02 · Tipo */}
          <fieldset>
            <legend className="flex items-baseline gap-3">
              <span className="num text-xl text-text-muted">02</span>
              <span className="display text-xl text-text md:text-2xl">
                Tipo de <em className="display-italic text-acid">negocio</em>
              </span>
            </legend>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { key: 'gastronomia', icon: Utensils, label: 'Gastronomía', hint: 'Pedidos · Delivery', accent: 'acid' },
                { key: 'turnos', icon: Scissors, label: 'Turnos', hint: 'Reservas · Agenda', accent: 'ml' },
              ].map((opt) => {
                const active = form.type === opt.key;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setForm({ ...form, type: opt.key })}
                    className={`group flex flex-col items-start gap-3 rounded-[var(--radius-lg)] border p-5 text-left transition-all ${
                      active
                        ? opt.accent === 'acid'
                          ? 'border-acid bg-acid/8'
                          : 'border-ml bg-ml/8'
                        : 'border-rule-strong bg-ink-3 hover:border-text-muted'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        active
                          ? opt.accent === 'acid'
                            ? 'bg-acid text-ink'
                            : 'bg-ml text-white'
                          : 'border border-rule-strong text-text-muted'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="display text-xl text-text">{opt.label}</p>
                      <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                        {opt.hint}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-[var(--radius-md)] border border-signal/40 bg-signal/10 p-4 text-sm text-signal-soft">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} variant="acid" size="xl" className="mt-8 w-full">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Crear negocio <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>

          <p className="mono mt-6 text-center text-[10px] uppercase tracking-[0.22em] text-text-subtle">
            14 días de prueba · sin tarjeta
          </p>
        </form>
      </div>
    </div>
  );
}
