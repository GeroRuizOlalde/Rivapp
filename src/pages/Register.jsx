import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { logger } from '../utils/logger';
import {
  Store, Mail, Lock, ArrowRight, ArrowLeft, Loader2, AlertTriangle,
  Utensils, Scissors, Globe, Sparkles, Hash, Check,
} from 'lucide-react';
import { appConfig } from '../config/appConfig';
import Button from '../components/shared/ui/Button';
import Field from '../components/shared/ui/Field';
import Eyebrow from '../components/shared/ui/Eyebrow';
import Rule from '../components/shared/ui/Rule';

const verticalOptions = [
  {
    key: 'gastronomia',
    icon: Utensils,
    label: 'Gastronomía',
    subtitle: 'Pedidos · Delivery · Retiro',
    features: ['Menú digital', 'Checkout público', 'Delivery propio'],
  },
  {
    key: 'turnos',
    icon: Scissors,
    label: 'Turnos & Servicios',
    subtitle: 'Agenda · Staff · Reservas',
    features: ['Reserva pública', 'Staff y horarios', 'Confirmación clara'],
  },
];

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    storeName: '',
    slug: '',
    type: 'gastronomia',
    email: '',
    password: '',
  });

  const handleNameChange = (e) => {
    const name = e.target.value;
    const generatedSlug = name
      .toLowerCase()
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
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', form.slug)
        .single();

      if (existingStore) {
        throw new Error('Esa URL (slug) ya está en uso. Probá con otro nombre.');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario.');

      const { error: storeError } = await supabase.from('stores').insert([
        {
          owner_id: authData.user.id,
          name: form.storeName,
          slug: form.slug,
          business_type: form.type,
          plan_type: 'trial',
          subscription_status: 'active',
          subscription_expiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          is_active: true,
        },
      ]);

      if (storeError) throw storeError;

      localStorage.setItem(
        'rivapp_session',
        JSON.stringify({
          id: authData.user.id,
          email: authData.user.email,
          slug: form.slug,
        })
      );

      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: form.email,
            storeName: form.storeName,
            slug: form.slug,
            type: form.type === 'gastronomia' ? 'Gastronomía' : 'Turnos y Servicios',
          },
        });
      } catch (mailError) {
        logger.warn('El usuario se creó, pero falló el envío del mail:', mailError);
      }

      alert('¡Cuenta creada con éxito! Te enviamos un correo de confirmación.');
      navigate(`/${form.slug}/admin`);
    } catch (err) {
      logger.error(err);
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const activeAccent = form.type === 'gastronomia' ? 'acid' : 'ml';

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-text">
      <div className="pointer-events-none absolute inset-0 z-0 grain" aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute left-[-10%] top-[-20%] h-[60vw] w-[60vw] rounded-full bg-acid/[0.04] blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[50vw] w-[50vw] rounded-full bg-ml/[0.06] blur-[140px]" />
      </div>

      <header className="relative z-20 border-b border-rule">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-acid text-ink">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="display text-2xl">Rivapp</span>
          </Link>
          <Link
            to="/login"
            className="mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-text-muted hover:text-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Ya tengo cuenta
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[0.45fr_0.55fr] lg:gap-20 lg:py-24">
        {/* Left · editorial */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>
            <Hash className="h-3 w-3" /> Alta · Prueba gratis {14} días
          </Eyebrow>
          <h1 className="display mt-6 text-[clamp(3rem,7vw,6rem)] leading-[0.92]">
            Encendé<br />
            tu <em className="display-italic text-acid">negocio</em><br />
            online.
          </h1>
          <p className="mt-8 max-w-md text-base leading-7 text-text-muted text-pretty md:text-lg">
            En menos de una tarde tenés tu URL pública, panel interno y cobros directos a tu cuenta. Sin
            comisiones por venta. Sin intermediarios.
          </p>

          <Rule className="mt-10" label="Lo que obtenés" />

          <ul className="mt-8 grid gap-4">
            {[
              'URL pública en 1 minuto',
              'Panel interno listo para operar',
              'Cobros directos · Mercado Pago',
              'Soporte WhatsApp del equipo',
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-text">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 grid grid-cols-2 gap-6 border-t border-rule pt-8">
            <div>
              <p className="num text-3xl text-text">0%</p>
              <p className="mono mt-1 text-[10px] uppercase tracking-[0.2em] text-text-subtle">
                Comisión por venta
              </p>
            </div>
            <div>
              <p className="num text-3xl text-text">14d</p>
              <p className="mono mt-1 text-[10px] uppercase tracking-[0.2em] text-text-subtle">
                Sin tarjeta
              </p>
            </div>
          </div>
        </aside>

        {/* Right · form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-8 md:p-12"
        >
          {error && (
            <div className="mb-8 flex items-center gap-3 rounded-[var(--radius-md)] border border-signal/40 bg-signal/10 p-4 text-sm text-signal-soft">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="grid gap-10">
            {/* 01 · Vertical */}
            <fieldset>
              <legend className="flex items-baseline gap-3">
                <span className="num text-2xl text-text-muted">01</span>
                <span className="display text-2xl text-text md:text-3xl">
                  ¿Qué <em className="display-italic text-acid">tipo</em> de negocio?
                </span>
              </legend>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {verticalOptions.map((v) => {
                  const active = form.type === v.key;
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => setForm({ ...form, type: v.key })}
                      className={`group relative overflow-hidden rounded-[var(--radius-lg)] border p-5 text-left transition-all ${
                        active
                          ? v.key === 'gastronomia'
                            ? 'border-acid bg-acid/8'
                            : 'border-ml bg-ml/8'
                          : 'border-rule-strong bg-ink-3 hover:border-text-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full ${
                            active
                              ? v.key === 'gastronomia'
                                ? 'bg-acid text-ink'
                                : 'bg-ml text-white'
                              : 'border border-rule-strong text-text-muted'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {active && (
                          <span
                            className={`mono text-[10px] uppercase tracking-[0.22em] ${
                              v.key === 'gastronomia' ? 'text-acid' : 'text-ml-soft'
                            }`}
                          >
                            Seleccionado
                          </span>
                        )}
                      </div>
                      <h3 className="display mt-5 text-2xl text-text">{v.label}</h3>
                      <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                        {v.subtitle}
                      </p>
                      <ul className="mt-4 grid gap-1.5 text-xs text-text-muted">
                        {v.features.map((f) => (
                          <li key={f} className="flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-current" /> {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <Rule />

            {/* 02 · Nombre */}
            <fieldset>
              <legend className="flex items-baseline gap-3">
                <span className="num text-2xl text-text-muted">02</span>
                <span className="display text-2xl text-text md:text-3xl">
                  ¿Cómo se <em className="display-italic text-acid">llama</em> tu local?
                </span>
              </legend>

              <div className="mt-6">
                <Field
                  label="Nombre del local"
                  icon={Store}
                  placeholder="Ej: La Esquina"
                  required
                  value={form.storeName}
                  onChange={handleNameChange}
                />
                {form.slug && (
                  <div className="mt-4 flex items-center gap-3 rounded-[var(--radius-md)] border border-acid/20 bg-acid/5 p-4">
                    <Globe className="h-4 w-4 shrink-0 text-acid" />
                    <div className="min-w-0 flex-1">
                      <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                        Tu URL pública
                      </p>
                      <p className="mono mt-1 truncate text-sm text-text">
                        {appConfig.appDomainLabel}/<span className="text-acid">{form.slug}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </fieldset>

            <Rule />

            {/* 03 · Acceso */}
            <fieldset>
              <legend className="flex items-baseline gap-3">
                <span className="num text-2xl text-text-muted">03</span>
                <span className="display text-2xl text-text md:text-3xl">
                  Tus <em className="display-italic text-acid">datos</em> de acceso.
                </span>
              </legend>

              <div className="mt-6 grid gap-5">
                <Field
                  label="Email"
                  type="email"
                  icon={Mail}
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Field
                  label="Contraseña"
                  type="password"
                  icon={Lock}
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </fieldset>

            <Button
              type="submit"
              disabled={loading}
              variant={activeAccent === 'acid' ? 'acid' : 'paper'}
              size="xl"
              className="mt-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Crear tienda <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>

            <p className="mono text-center text-[10px] uppercase tracking-[0.22em] text-text-subtle">
              Al continuar aceptás los términos de uso de Rivapp.
            </p>
          </form>
        </motion.section>
      </main>
    </div>
  );
}
