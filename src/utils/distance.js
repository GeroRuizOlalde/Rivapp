// Cálculos de distancia. Tenemos 2 estrategias:
//   - haversineKm: línea recta, gratis, ya existía. Bueno para previews / fallback.
//   - getRouteDistanceKm: ruta REAL via Google Distance Matrix. Más preciso.
//                         Requiere VITE_GOOGLE_MAPS_API_KEY y consume cuota.

import { appConfig } from '../config/appConfig';

export const haversineKm = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null || isNaN(v))) return 0;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

let distanceServicePromise = null;

const loadDistanceMatrix = () =>
  new Promise((resolve, reject) => {
    if (window.google?.maps?.DistanceMatrixService) {
      resolve(new window.google.maps.DistanceMatrixService());
      return;
    }
    const apiKey = appConfig.googleMapsApiKey;
    if (!apiKey) {
      reject(new Error('Falta VITE_GOOGLE_MAPS_API_KEY'));
      return;
    }
    // Si el script ya estaba cargándose por @react-google-maps/api, esperamos.
    const interval = setInterval(() => {
      if (window.google?.maps?.DistanceMatrixService) {
        clearInterval(interval);
        resolve(new window.google.maps.DistanceMatrixService());
      }
    }, 200);
    setTimeout(() => {
      clearInterval(interval);
      if (window.google?.maps?.DistanceMatrixService) {
        resolve(new window.google.maps.DistanceMatrixService());
      } else {
        reject(new Error('Google Maps no se cargó a tiempo'));
      }
    }, 5000);
  });

/**
 * Devuelve la distancia (km) y duración (min) en auto entre dos puntos,
 * usando la red real de calles. Fallback a haversine si Google falla.
 */
export const getRouteDistanceKm = async (origin, destination) => {
  if (!appConfig.googleMapsApiKey) {
    return { km: haversineKm(origin.lat, origin.lng, destination.lat, destination.lng), source: 'haversine' };
  }
  try {
    if (!distanceServicePromise) distanceServicePromise = loadDistanceMatrix();
    const service = await distanceServicePromise;

    const result = await new Promise((resolve, reject) => {
      service.getDistanceMatrix(
        {
          origins: [{ lat: origin.lat, lng: origin.lng }],
          destinations: [{ lat: destination.lat, lng: destination.lng }],
          travelMode: 'DRIVING',
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status === 'OK') resolve(response);
          else reject(new Error(`Distance Matrix: ${status}`));
        }
      );
    });

    const el = result?.rows?.[0]?.elements?.[0];
    if (el?.status !== 'OK') {
      throw new Error(el?.status || 'Sin resultado');
    }
    return {
      km: el.distance.value / 1000,
      minutes: Math.round(el.duration.value / 60),
      source: 'google',
    };
  } catch (e) {
    console.warn('Distance Matrix fallback a haversine:', e?.message);
    return {
      km: haversineKm(origin.lat, origin.lng, destination.lat, destination.lng),
      source: 'haversine',
    };
  }
};
