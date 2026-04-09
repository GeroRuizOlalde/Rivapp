import React, { useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useStore } from '../../context/useStore';
// Importamos la utilidad de distancia (Asegúrate que la ruta sea correcta)
import { getDistanceFromLatLonInKm } from '../../utils/geolocation'; 

export default function LocationModal() {
  // 1. Traemos 'branches' y 'selectBranch' del contexto
  const { userLocation, setUserLocation, store, branches, selectBranch } = useStore();
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [tempAddress, setTempAddress] = useState("");

  // Si ya tenemos coordenadas o dirección, ocultamos el modal
  if (userLocation.address || userLocation.lat) return null;

  const fetchStreetName = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      
      if (data && data.address) {
        const road = data.address.road || data.address.pedestrian || "";
        const number = data.address.house_number || "";
        const neighborhood = data.address.suburb || data.address.neighbourhood || "";
        const streetName = road ? `${road} ${number}, ${neighborhood}` : "Ubicación detectada";

        setUserLocation(prev => ({ ...prev, address: streetName }));
      }
    } catch {
      console.log("No se pudo obtener el nombre de la calle, pero tenemos coordenadas.");
    }
  };

  const handleGetLocation = () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      setManualMode(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // 🟢 NUEVA LÓGICA: Auto-seleccionar sucursal más cercana
        if (branches && branches.length > 0) {
            // Ordenamos las sucursales por distancia a la ubicación detectada
            const sortedBranches = [...branches].sort((a, b) => {
                if (!a.lat || !b.lat) return 0;
                const distA = getDistanceFromLatLonInKm(latitude, longitude, a.lat, a.lng);
                const distB = getDistanceFromLatLonInKm(latitude, longitude, b.lat, b.lng);
                return distA - distB;
            });

            // Seleccionamos la primera (la más cercana) automáticamente
            const nearest = sortedBranches[0];
            if (nearest) {
                console.log(`📍 Sucursal auto-seleccionada por GPS: ${nearest.name}`);
                selectBranch(nearest.id);
            }
        }

        // Guardamos ubicación del usuario
        setUserLocation({
          address: "Detectando calle...",
          lat: latitude,
          lng: longitude,
          details: ''
        });

        fetchStreetName(latitude, longitude);
      },
      (error) => {
        console.error(error);
        alert("No se pudo detectar el GPS. Ingresa tu dirección manualmente.");
        setManualMode(true);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!tempAddress) return;
    
    // Nota: En manual no podemos calcular la sucursal más cercana fácilmente
    // porque no tenemos lat/lng exactos aún. 
    // Aquí el usuario caerá en el "BranchSelector" del Home si hay varias sucursales.
    setUserLocation({
      address: tempAddress,
      lat: null, 
      lng: null,
      details: ''
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 text-center relative shadow-2xl">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#d0ff00] p-4 rounded-full shadow-[0_0_30px_rgba(208,255,0,0.3)]">
          <MapPin size={32} className="text-black"/>
        </div>

        <h2 className="text-2xl font-bold text-white mt-8 mb-2">¿Dónde te encuentras?</h2>
        <p className="text-gray-400 text-sm mb-8">Necesitamos tu ubicación para mostrarte el menú correcto.</p>

        {!manualMode ? (
          <div className="space-y-3">
            <button 
              onClick={handleGetLocation}
              disabled={loading}
              className="w-full bg-[#d0ff00] text-black py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-white transition-colors text-lg shadow-lg relative overflow-hidden active:scale-95"
            >
              {loading ? (
                <>Detectando <Loader2 className="animate-spin" size={20}/></>
              ) : (
                <>Usar mi Ubicación Actual <Navigation size={20} fill="black"/></>
              )}
            </button>
            
            <button 
              onClick={() => setManualMode(true)}
              className="w-full text-gray-500 font-bold text-sm py-3 hover:text-white transition-colors"
            >
              Escribir dirección manualmente
            </button>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4 animate-in slide-in-from-right">
            <div className="relative">
              <MapPin className="absolute left-4 top-4 text-gray-500" size={20}/>
              <input 
                autoFocus
                type="text" 
                placeholder="Ej: Av. Libertador 1234" 
                className="w-full bg-black/50 border border-white/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:border-[#d0ff00] outline-none"
                value={tempAddress}
                onChange={e => setTempAddress(e.target.value)}
              />
            </div>
            <button className="w-full bg-white text-black py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-colors">
              Confirmar Dirección
            </button>
            <button type="button" onClick={() => setManualMode(false)} className="text-xs text-gray-500 hover:text-white mt-2">
              Volver a intentar GPS
            </button>
          </form>
        )}
        
        <div className="mt-8 pt-6 border-t border-white/5">
           <p className="text-[10px] text-gray-600 uppercase tracking-widest">Powered by {store?.name || 'Rivapp'}</p>
        </div>
      </div>
    </div>
  );
}
