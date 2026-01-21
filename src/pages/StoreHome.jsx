import React from 'react';
import { useStore } from '../context/StoreContext';
import GastronomyHome from './GastronomyHome';
import BookingHome from './BookingHome';
import BranchSelector from '../components/shared/BranchSelector'; 
import { Loader2, AlertCircle, MapPin } from 'lucide-react';

export default function StoreHome() {
  const { store, loading, error, branches, selectedBranch, selectBranch } = useStore();

  // 1. Pantalla de Carga
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={48} className="text-[#d0ff00] animate-spin" />
      </div>
    );
  }

  // 2. Manejo de Errores
  if (error || !store) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-red-500 mb-2">Tienda no encontrada</h1>
        <p className="text-gray-400">El local que buscas no existe o está inactivo.</p>
        <a href="/" className="mt-6 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors">Volver al Inicio</a>
      </div>
    );
  }

  // 3. EL "PORTERO" DE SUCURSALES
  if (!selectedBranch && branches && branches.length > 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
        <div className="mb-8 text-center">
            {store.logo_url && (
                <img src={store.logo_url} alt={store.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover shadow-lg" />
            )}
            <h1 className="text-2xl font-bold text-gray-900">Bienvenido a {store.name}</h1>
            <p className="text-gray-500 mt-2">Selecciona tu sucursal más cercana para ver el menú.</p>
        </div>
        
        {/* 🟢 CORRECCIÓN AQUÍ: Pasamos 'branches' como prop */}
        <BranchSelector 
            branches={branches} 
            onSelect={selectBranch} 
            className="shadow-xl" 
        />
      </div>
    );
  }

  // 4. EL CEREBRO (Renderizado final)
  const RenderComponent = store.business_type === 'turnos' ? BookingHome : GastronomyHome;

  return (
    <>
      {/* 5. BARRA SUPERIOR (Sticky Header) */}
      {branches && branches.length > 1 && selectedBranch && (
        <div className="bg-zinc-900 text-white px-4 py-2 flex justify-between items-center text-xs sticky top-0 z-50 border-b border-zinc-800">
            <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#d0ff00]" />
                <span className="opacity-90">Viendo: <span className="font-bold text-white">{selectedBranch.name}</span></span>
            </div>
            <button 
                onClick={() => selectBranch(null)} 
                className="text-[#d0ff00] hover:underline font-bold"
            >
                Cambiar
            </button>
        </div>
      )}

      <RenderComponent />
    </>
  );
}