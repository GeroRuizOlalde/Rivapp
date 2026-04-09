import React from 'react';
import { useStore } from '../context/StoreContext';
import GastronomyHome from './GastronomyHome';
import BookingHome from './BookingHome';
import BranchSelector from '../components/shared/BranchSelector';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';

export default function StoreHome() {
  const { store, loading, error, branches, selectedBranch, selectBranch } = useStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={48} className="text-[#d0ff00] animate-spin" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-red-500 mb-2">Tienda no encontrada</h1>
        <p className="text-gray-400">El local que buscas no existe o esta inactivo.</p>
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
    <div className="relative min-h-screen bg-[#0a0a0a]">
      <div className={showBranchSelector ? 'h-screen overflow-hidden filter blur-sm brightness-50 pointer-events-none' : ''}>
        {branches && branches.length > 1 && selectedBranch && (
          <div className="bg-[#0f0f0f]/95 backdrop-blur-md text-white px-4 py-3 flex justify-between items-center text-xs sticky top-0 z-50 border-b border-white/10 shadow-lg">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#d0ff00]" />
              <span className="opacity-90">
                Viendo: <span className="font-bold text-white text-sm ml-1">{selectedBranch.name}</span>
              </span>
            </div>
            <button
              onClick={() => selectBranch(null)}
              className="text-[#d0ff00] hover:text-white font-bold transition-colors px-3 py-1 bg-[#d0ff00]/10 rounded-full hover:bg-[#d0ff00]/20"
            >
              Cambiar
            </button>
          </div>
        )}
        <RenderComponent />
      </div>

      {showBranchSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>

          <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-300">
            <div className="text-center mb-6">
              {store.logo_url && (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover shadow-2xl border-2 border-[#d0ff00] animate-bounce-in"
                />
              )}
              <h2 className="text-2xl font-black text-white">Hola</h2>
              <p className="text-gray-300 text-sm">En que sucursal te encuentras?</p>
            </div>

            <BranchSelector branches={branches} onSelect={selectBranch} />
          </div>
        </div>
      )}
    </div>
  );
}
