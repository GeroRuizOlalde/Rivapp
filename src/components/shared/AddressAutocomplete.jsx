import React, { useEffect, useRef, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { appConfig } from '../../config/appConfig';

const LIBRARIES = ['places'];

/**
 * Input con autocompletado de direcciones de Google Places.
 *
 * Props:
 *   - value: { address, lat, lng } | null
 *   - onChange: ({ address, lat, lng }) => void
 *   - placeholder
 *   - country (default 'ar') — restringir resultados
 *   - className
 *
 * Si no hay API key configurada, hace fallback a un input de texto simple
 * (sin lat/lng) para que la UI no se rompa.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Av. Libertador 1234, San Juan',
  country = 'ar',
  className = '',
  disabled = false,
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [text, setText] = useState(value?.address || '');

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: appConfig.googleMapsApiKey,
    libraries: LIBRARIES,
    region: country.toUpperCase(),
    language: 'es',
  });

  useEffect(() => {
    setText(value?.address || '');
  }, [value?.address]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;
    if (!window.google?.maps?.places) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: [country] },
      fields: ['formatted_address', 'geometry', 'name'],
    });

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      const loc = place?.geometry?.location;
      if (!loc) return;
      const data = {
        address: place.formatted_address || place.name || '',
        lat: loc.lat(),
        lng: loc.lng(),
      };
      setText(data.address);
      onChange?.(data);
    });

    autocompleteRef.current = ac;
    return () => {
      if (window.google?.maps?.event && autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, country]);

  // Sin API key configurada → fallback input de texto plano
  if (!appConfig.googleMapsApiKey) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3">
          <MapPin className="h-4 w-4 shrink-0 text-text-muted" />
          <input
            type="text"
            placeholder={placeholder}
            value={text}
            disabled={disabled}
            onChange={(e) => {
              setText(e.target.value);
              onChange?.({ address: e.target.value, lat: null, lng: null });
            }}
            className="flex-1 bg-transparent text-sm text-text outline-none disabled:opacity-60"
          />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`text-sm text-signal ${className}`}>
        Error cargando Google Maps. Probá recargar.
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3">
        {isLoaded ? (
          <Search className="h-4 w-4 shrink-0 text-text-muted" />
        ) : (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-text-muted" />
        )}
        <input
          ref={inputRef}
          type="text"
          placeholder={isLoaded ? placeholder : 'Cargando…'}
          value={text}
          disabled={disabled || !isLoaded}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-transparent text-sm text-text outline-none disabled:opacity-60"
          autoComplete="off"
        />
      </div>
      {value?.lat && value?.lng && (
        <p className="mono mt-1.5 text-[10px] uppercase tracking-[0.22em] text-acid">
          ✓ Ubicación detectada
        </p>
      )}
    </div>
  );
}
