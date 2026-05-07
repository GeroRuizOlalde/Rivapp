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
import { useToast } from '../components/shared/toastContext';
import { getLicenseState } from '../utils/storeStatus';

export default function GlobalLogin() {
  const navigate = useNavigate();
  const toast = useToast();
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
      let session = null;

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
        session = data.session;

        if (!user) {
          throw new Error('No se pudo crear el usuario.');
        }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;
        user = data.user;
        session = data.session;
      }

      if (!user) {
        throw new Error('No se pudo obtener el usuario.');
      }

      // Si vino con link de invitación, aceptarla ANTES de seguir.
      // accept-invitation usa service role internamente, no necesita JWT activo.
      let invitationStoreSlug = null;
      if (inviteId) {
        const acceptRes = await supabase.functions.invoke('accept-invitation', {
          body: {
            invite_id: inviteId,
            user_id: user.id,
            user_email: user.email,
            // Mandamos el password para que la function lo persista en
            // auth.users. Necesario cuando el email ya existía previamente
            // (caso típico al re-testear): signUp NO actualiza el password,
            // así que sin esto el invitado no podría volver a loguear.
            password: formData.password,
          },
        });
        let acceptErr = null;
        if (acceptRes.error) {
          try {
            const ctx = await acceptRes.error.context?.json?.();
            acceptErr = ctx?.error || acceptRes.error.message;
          } catch {
            acceptErr = acceptRes.error.message;
          }
        } else if (acceptRes.data?.error) {
          acceptErr = acceptRes.data.error;
        }
        if (acceptErr) {
          throw new Error('No se pudo aceptar la invitación: ' + acceptErr);
        }
        // La function nos devolvió slug y role — los usamos para navegar
        // sin depender de queries posteriores (que pueden tener problemas
        // de RLS o de timing con el user_id real).
        invitationStoreSlug = acceptRes.data?.store?.slug || null;
      }

      // Si no hay sesión activa (caso típico cuando email_confirm está activo),
      // hacer signIn explícito ahora que la invitación confirmó el email.
      if (!session) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (signInErr) throw signInErr;
        user = signInData.user;
        session = signInData.session;
      }

      if (isPlatformAdmin(user)) {
        navigate('/master-panel');
        return;
      }

      // Atajo: si veníamos por invitación y la function devolvió el slug,
      // ir directo al admin de esa tienda sin pasar por las queries de
      // memberships. Más rápido y robusto.
      if (invitationStoreSlug) {
        localStorage.setItem(
          'rivapp_session',
          JSON.stringify({
            id: user.id,
            email: user.email,
            slug: invitationStoreSlug,
          })
        );
        navigate(`/${invitationStoreSlug}/admin`);
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
          .select('role, branches(store_id, stores(slug, id, is_demo, subscription_status, subscription_expiry))')
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

      const license = getLicenseState(targetStore);
      if (license.key === 'suspended') {
        throw new Error('La licencia de este negocio está suspendida. Contactá a soporte.');
      }
      if (license.key === 'expired') {
        throw new Error('La licencia de este negocio venció. Renová tu suscripción para entrar.');
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
      toast.error('Escribí tu email primero');
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: buildAppUrl('/update-password'),
    });

    if (resetError) {
      toast.error(`Error: ${resetError.message}`);
    } else {
      toast.success('Revisá tu correo para recuperar la contraseña', { duration: 6000 });
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
