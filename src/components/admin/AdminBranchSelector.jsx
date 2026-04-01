import React, { useEffect } from 'react';
import { Store, ChevronDown, Lock, Building2 } from 'lucide-react';
import { useAdminRole } from '../../hooks/useAdminRole'; // El hook que creamos antes
import { useStore } from '../../context/StoreContext';

export default function AdminBranchSelector({ selectedBranchId, onSelect }) {
  const { store, branches } = useStore();
  
  // 1. Averiguamos quién es el usuario (Dueño vs Empleado)
  const { role, scope, assignedBranchId, loading } = useAdminRole(store?.id);

  // 2. Efecto de seguridad: Si es empleado, forzamos su sucursal
  useEffect(() => {
    if (!loading && scope === 'branch' && assignedBranchId) {
       // Si intenta ver otra cosa, lo devolvemos a su lugar
       if (selectedBranchId !== assignedBranchId) {
           onSelect(assignedBranchId);
       }
    }
  }, [loading, scope, assignedBranchId, selectedBranchId]);

  if (loading) return <div className="h-10 w-40 bg-gray-800 animate-pulse rounded-lg"></div>;

  // CASO A: Es EMPLEADO (Gerente/Staff) -> Solo ve su sucursal bloqueada
  if (scope === 'branch') {
    const myBranch = branches.find(b => b.id === assignedBranchId);
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-gray-400 cursor-not-allowed opacity-80">
        <Lock size={14} className="text-gray-500" />
        <span className="text-sm font-bold truncate max-w-[150px]">
          {myBranch?.name || 'Mi Sucursal'}
        </span>
      </div>
    );
  }

  // CASO B: Es DUEÑO (Owner/Admin) -> Puede elegir "Todas" o filtrar
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        {selectedBranchId ? <Store size={16} className="text-[#d0ff00]" /> : <Building2 size={16} className="text-white" />}
      </div>
      
      <select
        value={selectedBranchId || ''}
        onChange={(e) => onSelect(e.target.value || null)}
        className="appearance-none bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 hover:border-[#d0ff00]/50 text-white text-sm font-medium py-2.5 pl-10 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-[#d0ff00]/20 transition-all cursor-pointer w-full min-w-[200px]"
      >
        <option value="">🏢 Todas las Sucursales (Consolidado)</option>
        <hr />
        {branches.map(branch => (
          <option key={branch.id} value={branch.id}>
             📍 {branch.name}
          </option>
        ))}
      </select>
      
      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
        <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors" />
      </div>
    </div>
  );
}