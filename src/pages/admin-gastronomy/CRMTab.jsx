import React from 'react';
import { FileText, MessageCircle } from 'lucide-react';

export default function CRMTab({ customers, onExportCustomers }) {
  return (
    <div className="animate-in fade-in space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold italic">Clientes</h1>
          <p className="text-sm text-gray-500">Base de datos de clientes.</p>
        </div>
        <button onClick={onExportCustomers} className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#d0ff00] transition-all shadow-xl text-sm">
          <FileText size={18} /> Exportar CSV
        </button>
      </header>
      <div className="bg-[#1a1a1a] rounded-[2rem] border border-white/5 overflow-hidden">
        <table className="w-full text-left text-white border-collapse">
          <thead className="bg-black/50 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <tr><th className="p-6">Nombre</th><th className="p-6">Pedidos</th><th className="p-6">Total Gastado</th><th className="p-6">Acción</th></tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors text-sm">
                <td className="p-6 font-bold">{c.customer_name}<div className="text-xs font-normal text-gray-500">{c.customer_phone}</div></td>
                <td className="p-6">{c.total_orders}</td>
                <td className="p-6 font-black text-[#d0ff00]">${c.total_spent?.toLocaleString()}</td>
                <td className="p-6">
                  <a href={`https://wa.me/${c.customer_phone}`} target="_blank" className="bg-[#25d366]/10 text-[#25d366] p-2 rounded-lg hover:bg-[#25d366] hover:text-white transition-all inline-block">
                    <MessageCircle size={18} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
