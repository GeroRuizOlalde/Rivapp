import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Loader2, Navigation } from 'lucide-react';
import { appConfig } from '../../config/appConfig';

/**
 * Mapa interactivo con marker draggable. Reemplaza al picker de Leaflet.
 * Si NO hay key configurada, no renderiza nada — el caller debería tener
 * un fallback (ej: el AddressAutocomplete sigue funcionando como input plano).
 *
 * Props:
 *   - position: { lat, lng } | null (posición del marker)
 *   - onChange: ({ lat, lng }) => void
 *   - storeLocation: { lat, lng } | null (centro inicial si no hay position)
 *   - height (default 280)
 *   - className
 */

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a18' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A19B8D' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0A08' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#F7F5EE' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a26' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6A6459' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a34' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A0A08' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#444' }] },
];

export default function GoogleLocationPicker({
  position,
  onChange,
  storeLocation,
  height = 280,
  className = '',
}) {
  const mapRef = useRef(null);
  const [center, setCenter] = useState(
    position || storeLocation || { lat: -34.6037, lng: -58.3816 } // Buenos Aires fallback
  );

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: appConfig.googleMapsApiKey,
  });

  // Sincronizar centro si vino una posición nueva (desde autocomplete por ej).
  // setState dentro del effect es intencional: solo cuando cambia position.
  useEffect(() => {
    if (position?.lat && position?.lng) {
      const next = { lat: Number(position.lat), lng: Number(position.lng) };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCenter(next);
      if (mapRef.current) mapRef.current.panTo(next);
    }
  }, [position?.lat, position?.lng]);

  if (!appConfig.googleMapsApiKey) {
    return (
      <div className={`rounded-[var(--radius-md)] border border-rule bg-ink-3 p-5 text-center ${className}`}>
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
          Mapa no disponible (falta configurar Google Maps)
        </p>
      </div>
    );
  }

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    onChange?.({ lat, lng });
  };

  const handleMarkerDragEnd = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    onChange?.({ lat, lng });
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange?.(loc);
      },
      () => {}
    );
  };

  return (
    <div className={`relative overflow-hidden rounded-[var(--radius-md)] border border-rule ${className}`}>
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height }}
          center={center}
          zoom={position ? 17 : 14}
          onClick={handleMapClick}
          onLoad={(map) => {
            mapRef.current = map;
          }}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'greedy',
            styles: DARK_MAP_STYLE,
            clickableIcons: false,
          }}
        >
          {position?.lat && position?.lng && (
            <Marker
              position={{ lat: Number(position.lat), lng: Number(position.lng) }}
              draggable
              onDragEnd={handleMarkerDragEnd}
            />
          )}
        </GoogleMap>
      ) : (
        <div className="flex items-center justify-center bg-ink-3" style={{ height }}>
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      )}
      <button
        type="button"
        onClick={handleUseMyLocation}
        className="mono absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-ink-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text shadow-[var(--shadow-lift)] hover:bg-ink-3"
      >
        <Navigation className="h-3 w-3" /> Mi ubicación
      </button>
      {!position && (
        <p className="mono absolute right-3 top-3 rounded-[var(--radius-sm)] bg-ink/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-text-muted backdrop-blur-sm">
          Tocá el mapa para marcar
        </p>
      )}
    </div>
  );
}
