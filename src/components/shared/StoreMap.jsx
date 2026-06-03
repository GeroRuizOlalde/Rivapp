import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { MapPin, Navigation } from 'lucide-react';
import { appConfig } from '../../config/appConfig';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';

// Google llama a window.gm_authFailure cuando la key no está autorizada para la
// Maps JavaScript API (API no habilitada, sin facturación, referrer bloqueado).
// En ese caso los tiles nunca cargan: lo registramos para ocultar el mapa.
let mapsAuthFailed = false;
const authListeners = new Set();
if (typeof window !== 'undefined') {
  window.gm_authFailure = () => {
    mapsAuthFailed = true;
    authListeners.forEach((fn) => fn());
  };
}

/**
 * Mapa estático embebido con la ubicación de la tienda/sucursal.
 * Click en "Cómo llegar" abre Google Maps app del usuario.
 *
 * Props:
 *   - lat, lng (requeridos)
 *   - label (nombre que aparece en el pin tooltip)
 *   - height (default 240)
 *   - className
 */
export default function StoreMap({ lat, lng, label = '', height = 240, className = '' }) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [authFailed, setAuthFailed] = useState(mapsAuthFailed);

  useEffect(() => {
    const fn = () => setAuthFailed(true);
    authListeners.add(fn);
    return () => authListeners.delete(fn);
  }, []);

  if (!lat || !lng) return null;

  // Si el script no cargó (loadError) o Google rechazó la autenticación de la
  // Maps JavaScript API (authFailed), no mostramos un recuadro vacío: ocultamos
  // el mapa por completo.
  if (loadError || authFailed) return null;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // Sin API key → fallback con link a Google Maps
  if (!appConfig.googleMapsApiKey) {
    return (
      <div className={`rounded-[var(--radius-md)] border border-rule bg-ink-3 p-5 ${className}`}>
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-acid" />
          <div className="min-w-0 flex-1">
            {label && <p className="display text-base text-text">{label}</p>}
            <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          </div>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="mono inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-acid px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink hover:brightness-110"
          >
            <Navigation className="h-3 w-3" /> Cómo llegar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[var(--radius-md)] border border-rule ${className}`}>
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height }}
          center={{ lat: Number(lat), lng: Number(lng) }}
          zoom={16}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'cooperative',
            styles: DARK_MAP_STYLE,
          }}
        >
          <Marker position={{ lat: Number(lat), lng: Number(lng) }} title={label} />
        </GoogleMap>
      ) : (
        <div className="flex items-center justify-center bg-ink-3" style={{ height }}>
          <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
            Cargando mapa…
          </p>
        </div>
      )}
      <a
        href={directionsUrl}
        target="_blank"
        rel="noreferrer"
        className="mono absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-acid px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink shadow-[var(--shadow-lift)] hover:brightness-110"
      >
        <Navigation className="h-3 w-3" /> Cómo llegar
      </a>
    </div>
  );
}

// Estilo dark-mode minimalista para el mapa. Contraste subido para que las
// calles se distingan del fondo y no parezca una línea suelta.
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#2b2b27' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#B8B2A4' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0A08' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#F7F5EE' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#54544b' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9A9486' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#6e6e62' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#14140f' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#555' }] },
];
