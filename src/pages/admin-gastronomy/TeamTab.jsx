import { Info, Plus, Trash2, User, Users } from 'lucide-react';

export default function TeamTab({
  teamInvites,
  onOpenRolesModal,
  onOpenInviteModal,
  getBranchName,
  onDeleteInvite,
}) {
  return (
    <div className="animate-in fade-in">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="text-[#d0ff00]" /> Equipo
        </h1>
        <div className="flex gap-2">
          <button
            onClick={onOpenRolesModal}
            className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Ver explicacion de roles"
          >
            <Info size={20} />
          </button>

          <button
            onClick={onOpenInviteModal}
            className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-black shadow-lg hover:scale-105 transition-transform"
            style={{ backgroundColor: '#d0ff00' }}
          >
            <Plus size={18} /> Invitar Miembro
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamInvites.map((invite) => (
          <div key={invite.id} className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-white/5 px-3 py-1 rounded-bl-xl text-[10px] uppercase font-bold text-gray-400">
              {invite.status}
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-gray-400">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg truncate w-40">{invite.email}</h3>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{invite.role}</p>
              </div>
            </div>

            <div className="bg-black/30 p-3 rounded-xl border border-white/5 mb-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Sucursal Asignada:</span>
                <span className="font-bold text-[#d0ff00]">
                  {invite.branch_id ? getBranchName(invite.branch_id) : 'Global (Todas)'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onDeleteInvite(invite.id)}
              className="w-full py-3 rounded-xl border border-red-500/20 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all text-xs flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> Revocar Acceso
            </button>
          </div>
        ))}

        {teamInvites.length === 0 && (
          <div className="col-span-full text-center py-20 bg-[#1a1a1a] rounded-3xl border border-dashed border-white/10">
            <Users size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 font-bold">No hay invitaciones pendientes.</p>
            <p className="text-gray-600 text-sm">Invita a tus gerentes o empleados para que gestionen sus sucursales.</p>
          </div>
        )}
      </div>
    </div>
  );
}
