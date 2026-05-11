import { useJsApiLoader } from '@react-google-maps/api';
import { appConfig } from '../config/appConfig';

// Config ÚNICA del loader. Si distintos componentes piden el script con
// opciones distintas, @react-google-maps/api tira "Loader must not be called
// again with different options". Centralizamos acá.
//
// Importante: el array `LIBRARIES` debe ser una referencia estable (definir
// fuera para evitar warning de React) y debe incluir TODAS las libraries que
// usen los componentes del proyecto.

const LIBRARIES = ['places'];

export function useGoogleMaps() {
  return useJsApiLoader({
    googleMapsApiKey: appConfig.googleMapsApiKey,
    libraries: LIBRARIES,
    language: 'es',
    region: 'AR',
  });
}
