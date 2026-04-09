import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function CouponsTab({ coupons, onCreateCoupon, onDeleteCoupon }) {
  return (
    <div className="animate-in fade-in">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Cupones</h1>
        <button onClick={onCreateCoupon} className="bg-blue-600 px-6 py-3 rounded-xl font-bold flex gap-2"><Plus /> Crear</button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {coupons.map(c => (
          <div key={c.id} className="bg-[#1a1a1a] p-6 rounded-2xl border border-dashed border-white/20">
            <div className="text-xs font-bold text-blue-500 mb-1 tracking-widest">CÓDIGO</div>
            <h3 className="text-3xl font-bold text-white mb-2 font-mono">{c.code}</h3>
            <div className="flex justify-between items-end">
              <div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm font-bold">-{c.discount}% OFF</div>
              <button onClick={() => onDeleteCoupon(c.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
