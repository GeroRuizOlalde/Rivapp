import React from 'react';
import { Plus, Bike, Trash2 } from 'lucide-react';

export default function RidersTab({ riders, branches, accentColor, contrastTextColor, onCreateRider, onDeleteRider }) {
  return (
    <div className="animate-in fade-in">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Repartidores</h1>
        <button onClick={onCreateRider} className="bg-blue-600 px-6 py-3 rounded-xl font-bold flex gap-2"><Plus /> Nuevo Rider</button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {riders.map(r => (
          <div key={r.id} className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 flex justify-between items-center relative overflow-hidden">
            {r.branches?.name && (
              <div className="absolute top-0 right-0 bg-[#d0ff00]/10 text-[#d0ff00] text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                {r.branches.name}
              </div>
            )}
            <div>
              <h3 className="font-bold text-white flex items-center gap-2"><Bike size={18} /> {r.name}</h3>
              <p className="text-xs text-gray-500 mt-1">PIN: <span className="font-mono bg-white/10 px-1 rounded text-white">{r.access_pin}</span></p>
            </div>
            <button onClick={() => onDeleteRider(r.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
