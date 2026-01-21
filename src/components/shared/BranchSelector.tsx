import { useState, useEffect } from "react";
import { MapPin, Navigation, ChevronRight, Store } from "lucide-react";
// 👇 CORREGIDO: Ruta relativa
import { getDistanceFromLatLonInKm } from "../../utils/geolocation"; 

interface Branch {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

interface BranchSelectorProps {
  branches: Branch[]; // 👈 NUEVO: Recibimos los datos ya listos
  onSelect: (branchId: string) => void;
  className?: string;
}

export default function BranchSelector({ branches = [], onSelect, className = "" }: BranchSelectorProps) {
  const [sortedBranches, setSortedBranches] = useState<Branch[]>(branches);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [calculating, setCalculating] = useState(false);

  // Efecto para actualizar la lista si llegan nuevas branches del padre
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
        setPermissionState('granted');
        
        // Ordenar: la más cercana primero
        const sorted = [...branches].sort((a, b) => {
          if (!a.lat || !b.lat) return 0;
          const distA = getDistanceFromLatLonInKm(latitude, longitude, a.lat, a.lng);
          const distB = getDistanceFromLatLonInKm(latitude, longitude, b.lat, b.lng);
          return distA - distB;
        });
        
        setSortedBranches(sorted);
        setCalculating(false);
      },
      (error) => {
        console.error(error);
        setPermissionState('denied');
        setCalculating(false);
      }
    );
  };

  if (branches.length === 0) {
    return <div className="p-4 text-center text-gray-500 animate-pulse">Cargando sucursales...</div>;
  }

  return (
    <div className={`w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      <div className="p-5 bg-gray-50 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Store className="w-5 h-5 text-indigo-600" />
          Elige tu sucursal
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Selecciona dónde quieres realizar tu pedido.
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Botón de Geolocalización */}
        {permissionState !== 'denied' && !userLocation && (
          <button
            onClick={handleLocateMe}
            disabled={calculating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100 mb-4"
          >
            <Navigation className="w-4 h-4" />
            {calculating ? "Calculando..." : "Ordenar por cercanía"}
          </button>
        )}

        {/* Lista de Sucursales */}
        <div className="flex flex-col gap-2">
          {sortedBranches.map((branch, index) => {
            const isNearest = index === 0 && userLocation !== null;
            const distance = userLocation && branch.lat && branch.lng
              ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, branch.lat, branch.lng).toFixed(1)
              : null;

            return (
              <button
                key={branch.id}
                onClick={() => onSelect(branch.id)}
                className={`group relative flex items-start text-left p-3 rounded-xl border transition-all hover:shadow-md
                  ${isNearest 
                    ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/30' 
                    : 'border-gray-200 hover:border-indigo-300 bg-white'
                  }`}
              >
                <div className="mr-3 mt-1 bg-gray-100 p-2 rounded-full group-hover:bg-indigo-100 transition-colors">
                  <MapPin className={`w-5 h-5 ${isNearest ? 'text-indigo-600' : 'text-gray-500'}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-900">{branch.name}</h4>
                    {distance && (
                      <span className="text-xs font-bold bg-gray-900 text-white px-2 py-0.5 rounded-full">
                        {distance} km
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{branch.address}</p>
                  
                  {isNearest && (
                    <span className="inline-block mt-2 text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      ¡Más cercana!
                    </span>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}