import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { appConfig } from '../../config/appConfig';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';

/**
 * Input con autocompletado de direcciones de Google Places.
 *
 * Usa la API NUEVA de Places (`AutocompleteSuggestion` + `Place`), porque la
 * legacy `google.maps.places.Autocomplete` ya no se habilita para proyectos de
 * Google Cloud creados después de marzo 2025. Renderizamos nuestro propio
 * dropdown para mantener la estética dark de la app.
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
  const { isLoaded, loadError } = useGoogleMaps();

  const [text, setText] = useState(value?.address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const containerRef = useRef(null);
  const placesLibRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setText(value?.address || '');
  }, [value?.address]);

  // Cargar la librería "places" de la API nueva una vez que el script está listo.
  useEffect(() => {
    if (!isLoaded || !window.google?.maps?.importLibrary) return;
    let cancelled = false;
    window.google.maps
      .importLibrary('places')
      .then((lib) => {
        if (!cancelled) placesLibRef.current = lib;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isLoaded]);

  // Cerrar el dropdown al clickear fuera.
  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const ensureToken = () => {
    const lib = placesLibRef.current;
    if (!lib) return null;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new lib.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  };

  const fetchSuggestions = useCallback(
    async (input) => {
      const lib = placesLibRef.current;
      if (!lib?.AutocompleteSuggestion || !input.trim()) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const { suggestions: results } =
          await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input,
            sessionToken: ensureToken(),
            includedRegionCodes: [country],
            language: 'es',
            region: country,
          });
        const preds = (results || []).map((s) => s.placePrediction).filter(Boolean);
        setSuggestions(preds);
        setOpen(preds.length > 0);
        setHighlight(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [country]
  );

  const handleChange = (e) => {
    const v = e.target.value;
    setText(v);
    // Al editar manualmente perdemos la ubicación detectada: hay que volver a
    // elegir una sugerencia para tener lat/lng coherentes con la dirección.
    onChange?.({ address: v, lat: null, lng: null });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 250);
  };

  const handleSelect = async (pred) => {
    try {
      const place = pred.toPlace();
      await place.fetchFields({ fields: ['formattedAddress', 'location', 'displayName'] });
      const address = place.formattedAddress || place.displayName || pred.text?.text || '';
      const loc = place.location;
      const data = {
        address,
        lat: loc ? loc.lat() : null,
        lng: loc ? loc.lng() : null,
      };
      setText(address);
      onChange?.(data);
    } catch {
      // Si falla fetchFields dejamos al menos el texto de la predicción.
      const fallback = pred.text?.text || '';
      if (fallback) {
        setText(fallback);
        onChange?.({ address: fallback, lat: null, lng: null });
      }
    } finally {
      setOpen(false);
      setSuggestions([]);
      // Tras seleccionar, Google recomienda renovar el session token.
      sessionTokenRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (highlight >= 0) {
        e.preventDefault();
        handleSelect(suggestions[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Sin API key configurada → fallback input de texto plano.
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
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 focus-within:border-text">
        {loading || !isLoaded ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-text-muted" />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-text-muted" />
        )}
        <input
          type="text"
          placeholder={isLoaded ? placeholder : 'Cargando…'}
          value={text}
          disabled={disabled || !isLoaded}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          className="flex-1 bg-transparent text-sm text-text outline-none disabled:opacity-60"
          autoComplete="off"
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-[var(--radius-md)] border border-rule-strong bg-ink-2 shadow-[var(--shadow-lift)]">
          {suggestions.map((pred, i) => {
            const main = pred.mainText?.text || pred.text?.text || '';
            const secondary = pred.secondaryText?.text || '';
            return (
              <li key={pred.placeId || i}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(pred);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${
                    highlight === i ? 'bg-ink-3' : ''
                  }`}
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-acid" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-text">{main}</span>
                    {secondary && (
                      <span className="block truncate text-xs text-text-muted">{secondary}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {value?.lat && value?.lng && (
        <p className="mono mt-1.5 text-[10px] uppercase tracking-[0.22em] text-acid">
          ✓ Ubicación detectada
        </p>
      )}
    </div>
  );
}
