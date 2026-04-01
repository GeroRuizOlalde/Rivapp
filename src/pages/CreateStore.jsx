import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateStore() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-[#d0ff00] mb-4">Crear Tienda</h1>
      <p className="text-gray-400 mb-8 text-center">
        El módulo de creación de tiendas estará disponible pronto.
      </p>
      <button 
        onClick={() => navigate('/')}
        className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-[#d0ff00] transition-colors"
      >
        Volver al Inicio
      </button>
    </div>
  );
}