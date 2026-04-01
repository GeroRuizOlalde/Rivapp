import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Quitamos el StoreProvider de acá porque ya lo tenés en App.jsx envolviendo 
// específicamente las rutas que lo necesitan. Menos carga inicial = más velocidad.

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
    </React.StrictMode>
  );
} else {
  // Un pequeño toque de seguridad para el equipo de Riva Estudio
  console.error("Critical Error: 'root' element not found. Check index.html");
}