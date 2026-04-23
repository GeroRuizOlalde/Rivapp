import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';
import { Lock, Save, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import Button from '../components/shared/ui/Button';
import Field from '../components/shared/ui/Field';
import Eyebrow from '../components/shared/ui/Eyebrow';

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
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      alert('¡Contraseña actualizada con éxito!');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink p-6 text-text">
      <div className="pointer-events-none absolute inset-0 z-0 grain" aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute left-[-10%] top-[-20%] h-[60vw] w-[60vw] rounded-full bg-acid/[0.04] blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[50vw] w-[50vw] rounded-full bg-ml/[0.06] blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-md anim-rise">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-acid text-ink">
            <Sparkles className="h-5 w-5" />
          </div>
          <Eyebrow className="justify-center">Recuperación</Eyebrow>
          <h2 className="display mt-3 text-4xl md:text-5xl">
            Nueva <em className="display-italic text-acid">contraseña</em>
          </h2>
          <p className="mt-3 text-sm text-text-muted">Elegí una clave nueva para recuperar el acceso.</p>
        </div>

        <form
          onSubmit={handleUpdate}
          className="space-y-6 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-8"
        >
          <Field
            label="Nueva contraseña"
            icon={Lock}
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          {error && (
            <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-signal/40 bg-signal/10 p-4 text-sm text-signal-soft">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} variant="acid" size="xl" className="w-full">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" /> Actualizar contraseña
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
