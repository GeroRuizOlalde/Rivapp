import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ChevronRight, Store, Loader2 } from 'lucide-react';

// 👇 HELPER: Calculadora de distancia (Integrada aquí para no crear más archivos)
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function BranchSelector({ branches = [], onSelect }) {
  const [sortedBranches, setSortedBranches] = useState(branches);
  const [userLocation, setUserLocation] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Efecto para actualizar si llegan datos nuevos
  useEffect(() => {
    setSortedBranches(branches);
  }, [branches]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;

    setCalculating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Ordenar: la más cercana primero
        const sorted = [...branches].sort((a, b) => {
          // Si una sucursal no tiene coordenadas, va al final
          if (!a.lat || !a.lng) return 1;
          if (!b.lat || !b.lng) return -1;

          const distA = getDistanceFromLatLonInKm(latitude, longitude, a.lat, a.lng);
          const distB = getDistanceFromLatLonInKm(latitude, longitude, b.lat, b.lng);
          return distA - distB;
        });
        
        setSortedBranches(sorted);
        setCalculating(false);
      },
      (error) => {
        console.error("Error GPS:", error);
        setCalculating(false);
      }
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#1a1a1a] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        
        {/* Cabecera */}
        <div className="p-6 border-b border-white/5 bg-[#0f0f0f]">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Store className="text-[#d0ff00]" />
            Elige tu sucursal
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Selecciona el local más cercano para ver stock real.
          </p>
        </div>

        <div className="p-4 space-y-3">
          {/* Botón GPS */}
          {!userLocation && (
            <button
              onClick={handleLocateMe}
              disabled={calculating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/5 text-[#d0ff00] font-bold text-sm rounded-xl hover:bg-white/10 transition-colors border border-[#d0ff00]/20 mb-2"
            >
              {calculating ? <Loader2 className="animate-spin" size={16}/> : <Navigation size={16} />}
              {calculating ? "Calculando..." : "Ordenar por cercanía"}
            </button>
          )}

          {/* Lista de Sucursales */}
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {sortedBranches.map((branch, index) => {
              // Calculamos distancia solo para mostrarla
              let distanceText = null;
              let isNearest = false;

              if (userLocation && branch.lat && branch.lng) {
                const dist = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, branch.lat, branch.lng);
                distanceText = dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
                isNearest = index === 0;
              }

              return (
                <button
                  key={branch.id}
                  onClick={() => onSelect(branch)} // 👈 Importante: Pasamos el objeto completo
                  className={`relative flex items-center text-left p-4 rounded-2xl border transition-all duration-300 group
                    ${isNearest 
                      ? 'bg-[#d0ff00]/10 border-[#d0ff00] ring-1 ring-[#d0ff00]/50' 
                      : 'bg-[#0f0f0f] border-white/5 hover:border-white/20 hover:bg-[#252525]'
                    }`}
                >
                  {/* Ícono */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 transition-colors ${isNearest ? 'bg-[#d0ff00] text-black' : 'bg-white/10 text-gray-400 group-hover:bg-[#d0ff00] group-hover:text-black'}`}>
                    <MapPin size={20} />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className={`font-bold truncate pr-2 ${isNearest ? 'text-[#d0ff00]' : 'text-white'}`}>{branch.name}</h4>
                      {distanceText && (
                        <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-1 rounded-md whitespace-nowrap">
                          {distanceText}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{branch.address || "Dirección no disponible"}</p>
                    
                    {isNearest && (
                      <span className="inline-block mt-2 text-[10px] font-black text-black bg-[#d0ff00] px-2 py-0.5 rounded uppercase tracking-wider">
                        Recomendado
                      </span>
                    )}
                  </div>

                  {/* Flecha */}
                  <ChevronRight className={`ml-2 w-5 h-5 transition-all ${isNearest ? 'text-[#d0ff00]' : 'text-gray-600 group-hover:text-white group-hover:translate-x-1'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}