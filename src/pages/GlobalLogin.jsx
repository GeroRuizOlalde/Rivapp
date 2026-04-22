import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock, Mail, ArrowRight, AlertCircle, Loader2, UserPlus, LogIn, Sparkles, ArrowLeft,
} from 'lucide-react';
import { buildAppUrl } from '../config/appConfig';
import { logger } from '../utils/logger';
import { isPlatformAdmin } from '../utils/platformAdmin';
import Button from '../components/shared/ui/Button';
import Field from '../components/shared/ui/Field';
import Eyebrow from '../components/shared/ui/Eyebrow';
import Rule from '../components/shared/ui/Rule';

export default function GlobalLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get('invite');

  const [isRegistering, setIsRegistering] = useState(Boolean(inviteId));
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let user = null;

      if (isRegistering) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { invited_by_link: Boolean(inviteId) },
          },
        });

        if (signUpError) throw signUpError;
        user = data.user;

        if (!user && !data.session) {
          throw new Error('Registro iniciado. Por favor verificá tu correo si es necesario.');
        }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;
        user = data.user;
      }

      if (!user) {
        throw new Error('No se pudo obtener el usuario.');
      }

      if (isPlatformAdmin(user)) {
        navigate('/master-panel');
        return;
      }

      let targetStore = null;
      let userRole = 'staff';

      const { data: ownerStore } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ownerStore) {
        targetStore = ownerStore;
        userRole = 'owner';
      } else {
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

      if (!targetStore) {
        localStorage.setItem('rivapp_session_temp', JSON.stringify({ email: user.email }));
        navigate('/create-store');
        return;
      }

      if (targetStore.is_active === false) {
        throw new Error('Este negocio se encuentra suspendido. Contactá a soporte.');
      }

      localStorage.setItem(
        'rivapp_session',
        JSON.stringify({
          store_id: targetStore.id,
          slug: targetStore.slug,
          role: userRole,
          email: user.email,
        })
      );

      navigate(`/${targetStore.slug}/admin`);
    } catch (err) {
      logger.error(err);
      setError(err.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      alert('Escribí tu email primero.');
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: buildAppUrl('/update-password'),
    });

    if (resetError) {
      alert(`Error: ${resetError.message}`);
    } else {
      alert('Revisá tu correo para recuperar la contraseña.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-text">
      <div className="pointer-events-none absolute inset-0 z-0 grain" aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute right-[-10%] top-[-20%] h-[60vw] w-[60vw] rounded-full bg-acid/[0.04] blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[50vw] w-[50vw] rounded-full bg-ml/[0.06] blur-[140px]" />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[0.55fr_0.45fr]">
        {/* Left · editorial */}
        <aside className="hidden flex-col justify-between border-r border-rule p-10 lg:flex xl:p-16">
          <Link to="/" className="inline-flex items-center gap-3 self-start">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-acid text-ink">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="display text-2xl">Rivapp</span>
          </Link>

          <div>
            <Eyebrow>Sesión № {new Date().toISOString().slice(5, 10).replace('-', '·')}</Eyebrow>
            <h1 className="display mt-6 text-[clamp(3rem,6vw,6rem)] leading-[0.95]">
              Volvé a<br />
              tu <em className="display-italic text-acid">operación.</em>
            </h1>
            <p className="mt-8 max-w-md text-base leading-7 text-text-muted text-pretty md:text-lg">
              Panel interno, cobros directos y métricas reales. Tu negocio sigue siendo <em className="display-italic text-text">100% tuyo</em>.
            </p>

            <Rule className="mt-10" label="Seguridad" />
            <div className="mt-6 grid grid-cols-2 gap-6 text-sm text-text-muted">
              <div>
                <p className="num text-2xl text-text">256-bit</p>
                <p className="mono mt-1 text-[10px] uppercase tracking-[0.2em] text-text-subtle">
                  Cifrado sesión
                </p>
              </div>
              <div>
                <p className="num text-2xl text-text">0%</p>
                <p className="mono mt-1 text-[10px] uppercase tracking-[0.2em] text-text-subtle">
                  Comisión por venta
                </p>
              </div>
            </div>
          </div>

          <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
            © {new Date().getFullYear()} Rivapp · Hecho en Argentina
          </p>
        </aside>

        {/* Right · form */}
        <main className="relative flex items-center justify-center px-6 py-12 md:px-10">
          <div className="absolute left-6 top-6 flex items-center gap-3 lg:hidden">
            <Link
              to="/"
              className="mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-text-muted hover:text-text"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver
            </Link>
          </div>

          <div className="w-full max-w-md">
            <div className="flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-acid text-ink">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="display text-2xl">Rivapp</span>
            </div>

            {inviteId && (
              <div className="mt-8 rounded-[var(--radius-lg)] border border-acid/40 bg-acid/10 p-5 anim-rise">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-acid text-ink">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="eyebrow-acid">Invitación recibida</p>
                    <p className="mt-1 text-sm text-text-muted">
                      Creá tu cuenta con el email invitado para acceder al equipo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <header className="mt-10 anim-rise">
              <Eyebrow>{isRegistering ? 'Nueva cuenta' : 'Ingreso'}</Eyebrow>
              <h2 className="display mt-4 text-5xl md:text-6xl">
                {isRegistering ? (
                  <>Creá tu<br /><em className="display-italic text-acid">cuenta.</em></>
                ) : (
                  <>Ingresá a<br />tu <em className="display-italic text-acid">panel.</em></>
                )}
              </h2>
            </header>

            <form onSubmit={handleAuth} className="mt-10 grid gap-6 anim-rise d-1">
              <Field
                label="Email"
                type="email"
                placeholder="tu@email.com"
                icon={Mail}
                required
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <Field
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                required
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />

              {error && (
                <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-signal/40 bg-signal/10 p-4 text-sm text-signal-soft anim-fade">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!isRegistering && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="mono self-end text-[11px] uppercase tracking-[0.22em] text-text-muted transition-colors hover:text-acid"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}

              <Button type="submit" disabled={loading} variant="acid" size="lg" className="mt-2">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isRegistering ? (
                  <>Crear cuenta <UserPlus className="h-4 w-4" /></>
                ) : (
                  <>Ingresar <LogIn className="h-4 w-4" /></>
                )}
              </Button>
            </form>

            <Rule className="mt-10" label={isRegistering ? 'Ya tenés cuenta' : 'Nuevo en Rivapp'} />

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError(null);
                }}
                className="group inline-flex items-center gap-2 text-left"
              >
                <span className="display text-2xl text-text">
                  {isRegistering ? (
                    <>Iniciar <em className="display-italic text-acid">sesión</em></>
                  ) : (
                    <>Crear <em className="display-italic text-acid">cuenta</em></>
                  )}
                </span>
                <ArrowRight className="h-5 w-5 text-acid transition-transform group-hover:translate-x-1" />
              </button>

              {!isRegistering && (
                <Link
                  to="/register"
                  className="mono text-[11px] uppercase tracking-[0.22em] text-text-muted hover:text-text"
                >
                  Registro completo →
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
