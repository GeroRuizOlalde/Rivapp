import React from 'react';
import { Bell, X, ExternalLink, Archive } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import NotificationPanel from '../../components/admin/NotificationPanel';

export default function DashboardTab({
  config, role, accentColor, viewBranchId, getBranchName,
  dashboardData, globalNotifications, onDismissMessage,
  storeNotifications, unreadCount, onMarkAsRead, onMarkAllAsRead,
  onDeleteNotification, onClearAllNotifications,
  onCloseRegister,
}) {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold italic">Hola, {config?.name}</h1>
          <p className="text-sm text-gray-400">
            Viendo datos de: <strong className="text-white">{!viewBranchId ? 'Todas las Sucursales' : getBranchName(viewBranchId)}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationPanel
            notifications={storeNotifications}
            unreadCount={unreadCount}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onDelete={onDeleteNotification}
            onClearAll={onClearAllNotifications}
            accentColor={accentColor}
          />
          <a href={`/${config?.slug}`} target="_blank" rel="noopener noreferrer" className="bg-[#1a1a1a] border border-white/10 text-white p-3 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 group">
            <ExternalLink size={20} style={{ color: accentColor }} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">Ver Local</span>
          </a>
        </div>
      </div>

      {globalNotifications.length > 0 && (
        <div className="bg-[#1a1a1a] p-6 rounded-[2rem] border border-[#d0ff00]/20 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 bg-[#d0ff00]/5 w-32 h-32 blur-3xl rounded-full -mr-10 -mt-10"></div>
          <h3 className="font-black text-[#d0ff00] text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Bell size={16} /> Comunicados Rivapp</h3>
          <div className="space-y-3">
            {globalNotifications.map(n => (
              <div key={n.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm mb-1">{n.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{n.message}</p>
                  <span className="text-[9px] text-gray-600 font-bold uppercase mt-2 block">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <button onClick={() => onDismissMessage(n.id)} className="p-1 hover:bg-white/10 rounded-lg text-gray-600 hover:text-white transition-colors"><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {role !== 'staff' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5"><div className="text-gray-400 text-xs font-bold uppercase mb-2">Facturación</div><div className="text-2xl md:text-3xl font-bold text-white">${dashboardData.totalRevenue.toLocaleString()}</div></div>
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5"><div className="text-gray-400 text-xs font-bold uppercase mb-2">Pedidos</div><div className="text-2xl md:text-3xl font-bold text-white">{dashboardData.totalOrders}</div></div>
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5"><div className="text-gray-400 text-xs font-bold uppercase mb-2">Ticket Promedio</div><div className="text-2xl md:text-3xl font-bold text-blue-400">${Math.round(dashboardData.avgTicket).toLocaleString()}</div></div>
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5"><div className="text-gray-400 text-xs font-bold uppercase mb-2">Top Producto</div><div className="text-lg font-bold text-orange-400 truncate">{dashboardData.topProducts[0]?.name || "N/A"}</div></div>
        </div>
      )}

      {role === 'staff' && (
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
          <div className="text-gray-400 text-xs font-bold uppercase mb-2">Pedidos de Hoy</div>
          <div className="text-2xl md:text-3xl font-bold text-white">{dashboardData.totalOrders}</div>
        </div>
      )}

      {role !== 'staff' && (
        <div className="col-span-2 bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 h-96 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboardData.chartData}>
              <defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={accentColor} stopOpacity={0.3} /><stop offset="95%" stopColor={accentColor} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
              <Area type="monotone" dataKey="value" stroke={accentColor} fill="url(#colorValue)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <button onClick={onCloseRegister} className="w-full bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-8 py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 transition-all"><Archive size={20} /> CERRAR CAJA Y ARCHIVAR</button>
    </div>
  );
}
