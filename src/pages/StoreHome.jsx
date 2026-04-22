import React from 'react';
import { useStore } from '../context/useStore';
import GastronomyHome from './GastronomyHome';
import BookingHome from './BookingHome';
import BranchSelector from '../components/shared/BranchSelector';
import { Loader2, AlertCircle, MapPin, ArrowLeft } from 'lucide-react';

export default function StoreHome() {
  const { store, loading, error, branches, selectedBranch, selectBranch } = useStore();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-acid" />
          <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-muted">Cargando tienda</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-text">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-signal/40 bg-signal/10 text-signal">
          <AlertCircle className="h-6 w-6" />
        </div>
        <p className="eyebrow mt-6">Error 404</p>
        <h1 className="display mt-3 text-5xl md:text-6xl">
          Tienda no <em className="display-italic text-acid">encontrada</em>
        </h1>
        <p className="mt-4 max-w-md text-sm text-text-muted">
          El local que buscás no existe o está inactivo.
        </p>
      </div>
    );
  }

  const type = store.business_type ? store.business_type.toLowerCase() : '';
  let RenderComponent = GastronomyHome;

  if (type.includes('service') || type.includes('turno') || type.includes('agenda')) {
    RenderComponent = BookingHome;
  }

  const showBranchSelector = !selectedBranch && branches && branches.length > 1;

  return (
    <div className="relative min-h-screen bg-ink">
      <div
        className={
          showBranchSelector ? 'pointer-events-none h-screen overflow-hidden blur-sm brightness-50' : ''
        }
      >
        {branches && branches.length > 1 && selectedBranch && (
          <div className="sticky top-0 z-50 border-b border-rule bg-ink/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-acid" />
                <span className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                  Sucursal
                </span>
                <span className="truncate text-sm font-semibold text-text">{selectedBranch.name}</span>
              </div>
              <button
                onClick={() => selectBranch(null)}
                className="mono inline-flex items-center gap-1.5 rounded-full border border-rule-strong px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-text transition-colors hover:border-acid hover:text-acid"
              >
                <ArrowLeft className="h-3 w-3" />
                Cambiar
              </button>
            </div>
          </div>
        )}
        <RenderComponent />
      </div>

      {showBranchSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 anim-fade">
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-xl" />
          <div className="relative z-10 w-full max-w-md anim-rise">
            <div className="text-center">
              {store.logo_url && (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="mx-auto mb-5 h-20 w-20 rounded-full border border-rule-strong object-cover shadow-[var(--shadow-lift)]"
                />
              )}
              <p className="eyebrow-acid">Bienvenida</p>
              <h2 className="display mt-3 text-4xl text-text md:text-5xl">
                Elegí tu<br />
                <em className="display-italic text-acid">sucursal</em>
              </h2>
            </div>

            <div className="mt-8">
              <BranchSelector branches={branches} onSelect={selectBranch} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
