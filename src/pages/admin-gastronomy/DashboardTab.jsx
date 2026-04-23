import React from 'react';
import { Bell, X, ExternalLink, Archive, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import NotificationPanel from '../../components/admin/NotificationPanel';
import Button from '../../components/shared/ui/Button';
import Eyebrow from '../../components/shared/ui/Eyebrow';
import Rule from '../../components/shared/ui/Rule';

export default function DashboardTab({
  config,
  role,
  accentColor,
  viewBranchId,
  getBranchName,
  dashboardData,
  globalNotifications,
  onDismissMessage,
  storeNotifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllNotifications,
  onCloseRegister,
}) {
  const branchLabel = !viewBranchId ? 'Todas las sucursales' : getBranchName(viewBranchId);

  return (
    <div className="space-y-8 anim-rise">
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Eyebrow>Panel</Eyebrow>
          <h1 className="display mt-3 text-4xl md:text-5xl">
            Hola, <em className="display-italic" style={{ color: accentColor }}>{config?.name}</em>
          </h1>
          <p className="mono mt-2 text-[11px] uppercase tracking-[0.22em] text-text-subtle">
            Viendo · <span className="text-text">{branchLabel}</span>
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
          <Button href={`/${config?.slug}`} target="_blank" rel="noopener noreferrer" variant="outline" size="md">
            <ExternalLink className="h-4 w-4" style={{ color: accentColor }} /> Ver local
          </Button>
        </div>
      </header>

      {globalNotifications.length > 0 && (
        <div
          className="relative overflow-hidden rounded-[var(--radius-xl)] border p-6"
          style={{ borderColor: `${accentColor}33`, backgroundColor: `${accentColor}08` }}
        >
          <div className="mb-5 flex items-center justify-between">
            <Eyebrow style={{ color: accentColor }}>
              <Bell className="h-3 w-3" /> Comunicados Rivapp
            </Eyebrow>
          </div>
          <div className="space-y-3">
            {globalNotifications.map((n) => (
              <div
                key={n.id}
                className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-4"
              >
                <div className="flex-1">
                  <p className="display text-lg text-text">{n.title}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{n.message}</p>
                  <p className="mono mt-3 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                    {new Date(n.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <button
                  onClick={() => onDismissMessage(n.id)}
                  className="rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {role !== 'staff' && (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Facturación', value: `$${dashboardData.totalRevenue.toLocaleString()}`, tone: accentColor },
            { label: 'Pedidos', value: dashboardData.totalOrders, tone: 'var(--color-text)' },
            {
              label: 'Ticket promedio',
              value: `$${Math.round(dashboardData.avgTicket).toLocaleString()}`,
              tone: 'var(--color-ml-soft)',
            },
            {
              label: 'Top producto',
              value: dashboardData.topProducts[0]?.name || '—',
              tone: 'var(--color-text)',
              truncate: true,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
              <Eyebrow>{s.label}</Eyebrow>
              <p
                className={`display num mt-5 text-3xl md:text-4xl ${s.truncate ? 'truncate' : ''}`}
                style={{ color: s.tone }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {role === 'staff' && (
        <div className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
          <Eyebrow>Hoy</Eyebrow>
          <p className="display num mt-5 text-4xl text-text">{dashboardData.totalOrders} pedidos</p>
        </div>
      )}

      {role !== 'staff' && (
        <section className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-8">
          <Eyebrow>
            <TrendingUp className="h-3 w-3" /> Evolución
          </Eyebrow>
          <h3 className="display mt-3 text-2xl text-text">
            Facturación <em className="display-italic" style={{ color: accentColor }}>día a día</em>
          </h3>
          <Rule className="mt-5" />
          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule-strong)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-ink-2)',
                    border: '1px solid var(--color-rule-strong)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
                <Area type="monotone" dataKey="value" stroke={accentColor} fill="url(#colorValue)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <button
        onClick={onCloseRegister}
        className="mono flex w-full items-center justify-center gap-3 rounded-[var(--radius-md)] border border-signal/30 bg-signal/10 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-signal-soft transition-all hover:bg-signal hover:text-white"
      >
        <Archive className="h-4 w-4" /> Cerrar caja y archivar
      </button>
    </div>
  );
}
