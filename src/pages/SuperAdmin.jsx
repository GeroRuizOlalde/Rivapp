import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import {
  Shield, Plus, Power, Trash2, Store, TrendingUp, Users, DollarSign, Activity, Search,
  LayoutDashboard, LogIn, Edit, X, Bell, ToggleLeft, ToggleRight, Utensils, Calendar,
  Briefcase, Lock, Save, Loader2, RefreshCcw, ListChecks, Smartphone, ArrowRight, ArrowUpRight,
} from 'lucide-react';
import { isPlatformAdmin } from '../utils/platformAdmin';
import Button from '../components/shared/ui/Button';
import Eyebrow from '../components/shared/ui/Eyebrow';
import Rule from '../components/shared/ui/Rule';

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  const [stores, setStores] = useState([]);
  const [payments, setPayments] = useState([]);
  const [globalNotifications, setGlobalNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');

  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [newNotification, setNewNotification] = useState({ title: '', message: '', target: 'all' });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStoreData, setNewStoreData] = useState({
    name: '', slug: '', business_type: 'gastronomia', owner_email: '',
    password: 'riva123', trial_days: 30, is_demo: 'false', plan_type: 'trial', paid_months: 1,
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !isPlatformAdmin(session.user)) {
        navigate('/login');
        return;
      }
      setAuthorized(true);
      fetchAllData();
    };
    checkAdminAccess();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    const { data: storesData } = await supabase
      .from('stores')
      .select('*, orders(count), appointments(count)')
      .order('created_at', { ascending: false });
    const { data: paymentsData } = await supabase
      .from('subscription_payments')
      .select('*, stores(name)')
      .order('created_at', { ascending: false });
    const { data: notifyData } = await supabase
      .from('global_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (storesData) setStores(storesData);
    if (paymentsData) setPayments(paymentsData);
    if (notifyData) setGlobalNotifications(notifyData);
    setLoading(false);
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setCreating(true);

    let expiryDate = new Date();
    const now = new Date();
    if (newStoreData.plan_type === 'trial') {
      expiryDate.setDate(now.getDate() + parseInt(newStoreData.trial_days));
    } else {
      expiryDate.setMonth(now.getMonth() + parseInt(newStoreData.paid_months));
    }
    expiryDate.setHours(23, 59, 59, 999);

    const cleanSlug = newStoreData.slug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    try {
      let newOwnerId = null;
      let isDemoFinal = newStoreData.is_demo === 'true';

      if (newStoreData.owner_email && newStoreData.owner_email.trim() !== '') {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/create-store-owner`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            email: newStoreData.owner_email,
            password: newStoreData.password,
            name: newStoreData.name,
          }),
        });

        const funcData = await response.json();
        logger.debug('create-store-owner response:', response.status, funcData);

        if (!response.ok) {
          throw new Error('Error creando usuario: ' + (funcData?.error || response.statusText));
        }
        newOwnerId = funcData?.user_id;
      } else {
        logger.debug('Sin email: creando tienda demo huérfana');
        isDemoFinal = true;
      }

      const storeToInsert = {
        owner_id: newOwnerId,
        name: newStoreData.name,
        slug: cleanSlug,
        business_type: newStoreData.business_type,
        owner_email: newStoreData.owner_email,
        is_active: true,
        is_demo: isDemoFinal,
        plan_type: newStoreData.plan_type,
        subscription_expiry: expiryDate.toISOString(),
        subscription_status: 'active',
        color_accent: newStoreData.business_type === 'gastronomia' ? '#ff6b00' : '#2563eb',
      };

      const { error: storeError } = await supabase.from('stores').insert([storeToInsert]);

      if (storeError) throw new Error('Fallo al crear tienda: ' + storeError.message);

      alert(`✅ Negocio "${newStoreData.name}" creado.`);
      setShowCreateModal(false);
      setNewStoreData({
        name: '', slug: '', business_type: 'gastronomia', owner_email: '',
        password: 'riva123', is_demo: 'false', plan_type: 'trial', trial_days: 30, paid_months: 1,
      });
      fetchAllData();
    } catch (error) {
      logger.error(error);
      alert('Error: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (store) => {
    setEditingStore({
      ...store,
      owner_email: store.owner_email || '',
      expiry_date_input: store.subscription_expiry ? store.subscription_expiry.split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();

    let finalExpiry = null;
    if (editingStore.expiry_date_input) {
      finalExpiry = `${editingStore.expiry_date_input}T23:59:59Z`;
    }

    const cleanSlug = editingStore.slug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    try {
      const updateData = {
        name: editingStore.name,
        slug: cleanSlug,
        business_type: editingStore.business_type,
        owner_email: editingStore.owner_email,
        is_active: editingStore.is_active,
        is_demo: editingStore.is_demo,
        plan_type: editingStore.plan_type,
        subscription_expiry: finalExpiry,
        subscription_status: 'active',
      };

      const { error } = await supabase.from('stores').update(updateData).eq('id', editingStore.id);

      if (error) throw error;
      alert('Negocio actualizado correctamente ✅');
      setShowEditModal(false);
      setEditingStore(null);
      fetchAllData();
    } catch (error) {
      alert('Error al actualizar: ' + error.message);
    }
  };

  const deleteStore = async (id) => {
    if (
      !window.confirm(
        '⚠️ ATENCIÓN CRÍTICA ⚠️\n\nEstás a punto de borrar este negocio.\n\nAl confirmar, se eliminará:\n- La tienda\n- Todos los pedidos/turnos\n- El menú/servicios\n- Los cupones\n\n¿Estás 100% seguro?'
      )
    )
      return;

    setLoading(true);
    try {
      const { error } = await supabase.from('stores').delete().eq('id', id);
      if (error) throw error;
      alert('✅ Tienda eliminada.');
      fetchAllData();
    } catch (error) {
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemos = async () => {
    if (!confirm('⚠️ ¿Resetear demos?')) return;
    const demoStores = stores.filter((s) => s.is_demo);
    const demoIds = demoStores.map((s) => s.id);
    if (demoIds.length === 0) return alert('No hay demos.');
    setLoading(true);
    try {
      await supabase.from('orders').delete().in('store_id', demoIds);
      await supabase.from('appointments').delete().in('store_id', demoIds);
      alert('¡Limpieza completada!');
      fetchAllData();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('global_notifications').insert([newNotification]);
    if (!error) {
      alert('Notificación enviada 🔔');
      setShowNotifyModal(false);
      setNewNotification({ title: '', message: '', target: 'all' });
      fetchAllData();
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm('¿Eliminar?')) return;
    await supabase.from('global_notifications').delete().eq('id', id);
    fetchAllData();
  };
  const toggleNotificationStatus = async (id, currentStatus) => {
    await supabase.from('global_notifications').update({ is_active: !currentStatus }).eq('id', id);
    fetchAllData();
  };

  const processedStores = useMemo(() => {
    let list = [...stores];
    if (searchTerm) list = list.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (categoryFilter !== 'todos') list = list.filter((s) => s.business_type === categoryFilter);
    return list.sort((a, b) => (a.is_demo === b.is_demo ? 0 : a.is_demo ? -1 : 1));
  }, [stores, searchTerm, categoryFilter]);

  const stats = {
    total: stores.filter((s) => !s.is_demo).length,
    active: stores.filter((s) => s.is_active && !s.is_demo).length,
    mrr: stores
      .filter((s) => s.is_active && !s.is_demo)
      .reduce((acc, curr) => acc + (Number(curr.subscription_price) || 0), 0),
    totalOrders: stores.reduce(
      (acc, s) => acc + (s.orders?.[0]?.count || 0) + (s.appointments?.[0]?.count || 0),
      0
    ),
  };

  if (!authorized || loading)
    return (
      <div className="flex h-screen items-center justify-center bg-ink">
        <div className="flex flex-col items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-acid text-ink">
            <Shield className="h-5 w-5" />
          </div>
          <p className="mono text-[11px] uppercase tracking-[0.24em] text-acid">Cargando superadmin</p>
        </div>
      </div>
    );

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Global' },
    { id: 'clients', icon: Users, label: 'Clientes' },
    { id: 'finance', icon: DollarSign, label: 'Finanzas' },
    { id: 'notifications', icon: Bell, label: 'Avisos' },
  ];

  return (
    <div className="relative flex min-h-screen bg-ink text-text">
      <div className="pointer-events-none fixed inset-0 z-0 grain" aria-hidden />

      {/* Sidebar */}
      <aside className="sticky top-0 z-20 hidden h-screen w-24 flex-col items-center gap-10 border-r border-rule bg-ink-2 py-10 lg:flex">
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-acid text-ink shadow-[0_0_30px_-10px_rgba(208,255,0,0.5)]">
          <Shield className="h-5 w-5" />
        </div>
        <nav className="flex w-full flex-col items-center gap-3 px-3">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] transition-colors ${
                  isActive ? 'bg-acid/10 text-acid' : 'text-text-subtle hover:bg-white/5 hover:text-text'
                }`}
              >
                <item.icon className="h-5 w-5" />
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="relative z-10 flex-1 p-6 pb-28 lg:p-10 lg:pb-10">
        {/* DASHBOARD */}
        {activeView === 'dashboard' && (
          <div className="space-y-10 anim-rise">
            <header className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <Eyebrow>Plataforma</Eyebrow>
                <h1 className="display mt-3 text-5xl md:text-6xl">
                  Global <em className="display-italic text-acid">overview</em>
                </h1>
                <p className="mt-2 text-sm text-text-muted">Estado real de la red Rivapp.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleResetDemos} variant="outline" size="md">
                  <RefreshCcw className="h-4 w-4" /> Reset demos
                </Button>
                <Button onClick={() => setShowCreateModal(true)} variant="acid" size="md">
                  <Plus className="h-4 w-4" /> Nuevo local
                </Button>
                <Button onClick={() => setShowNotifyModal(true)} variant="paper" size="md">
                  <Bell className="h-4 w-4" /> Notificar
                </Button>
              </div>
            </header>

            <div className="grid gap-5 md:grid-cols-4">
              <div className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
                <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">MRR</p>
                <p className="display num mt-5 text-4xl text-text">${stats.mrr.toLocaleString()}</p>
                <Eyebrow className="mt-2">Ingreso mensual</Eyebrow>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
                <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">Negocios</p>
                <p className="display num mt-5 text-4xl text-acid">{stats.active}</p>
                <Eyebrow className="mt-2">Activos</Eyebrow>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
                <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">Actividad</p>
                <p className="display num mt-5 text-4xl text-ml-soft">{stats.totalOrders}</p>
                <Eyebrow className="mt-2">Transacciones totales</Eyebrow>
              </div>
              <button
                onClick={() => setActiveView('clients')}
                className="group flex flex-col justify-between rounded-[var(--radius-xl)] bg-paper p-6 text-left text-ink-text shadow-[var(--shadow-lift)] transition-all hover:bg-paper-2"
              >
                <div className="flex items-start justify-between">
                  <Smartphone className="h-5 w-5" />
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="mt-8">
                  <Eyebrow tone="ink">Ir a</Eyebrow>
                  <p className="display mt-3 text-2xl">
                    Gestionar <em className="display-italic">cartera</em>
                  </p>
                </div>
              </button>
            </div>

            <section className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-8">
              <div className="flex items-center justify-between">
                <Eyebrow>
                  <Activity className="h-3 w-3" /> Actividad reciente
                </Eyebrow>
                <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                  Últimos {stores.slice(0, 10).length}
                </p>
              </div>

              <Rule className="mt-5" />

              <div className="custom-scrollbar mt-6 max-h-96 space-y-2 overflow-y-auto pr-2">
                {stores.slice(0, 10).map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          s.plan_type === 'trial' ? 'bg-signal-soft' : 'bg-ml-soft'
                        }`}
                      />
                      <p className="text-sm">
                        <span className="display text-lg text-acid">{s.name}</span>{' '}
                        <span className="text-text-muted">— plan</span>{' '}
                        <span className="mono text-[11px] uppercase tracking-[0.2em] text-text">
                          {s.plan_type}
                        </span>
                      </p>
                    </div>
                    <span className="mono text-[10px] uppercase tracking-[0.2em] text-text-subtle">
                      {new Date(s.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* CLIENTS */}
        {activeView === 'clients' && (
          <div className="space-y-8 anim-rise">
            <div className="flex flex-col items-end justify-between gap-6 md:flex-row">
              <div>
                <Eyebrow>Cartera</Eyebrow>
                <h2 className="display mt-3 text-5xl md:text-6xl">
                  Clientes <span className="text-text-subtle">({processedStores.length})</span>
                </h2>
              </div>
              <div className="flex w-full gap-3 md:w-auto">
                <div className="flex rounded-full border border-rule bg-ink-2 p-1">
                  {['todos', 'gastronomia', 'turnos'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setCategoryFilter(f)}
                      className={`mono rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all ${
                        categoryFilter === f
                          ? 'bg-acid text-ink'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1 md:w-64">
                  <Search className="pointer-events-none absolute inset-y-0 left-4 my-auto h-4 w-4 text-text-muted" />
                  <input
                    className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-2 py-3 pl-11 pr-4 text-sm text-text placeholder:text-text-subtle focus:border-acid focus:outline-none"
                    placeholder="Buscar local…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {processedStores.map((s) => (
                <div
                  key={s.id}
                  className="group flex flex-col items-start justify-between gap-5 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-5 transition-colors hover:border-text-muted md:flex-row md:items-center"
                >
                  <div className="flex w-full items-center gap-5 md:w-auto">
                    <div
                      className={`display flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-xl ${
                        s.is_active ? 'bg-ink-3 text-text' : 'bg-signal/10 text-signal-soft'
                      }`}
                    >
                      {s.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="display text-xl text-text">{s.name}</h4>
                        {s.is_demo && (
                          <span className="mono rounded-sm bg-acid/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-acid">
                            Demo
                          </span>
                        )}
                        <span
                          className={`mono rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] ${
                            s.plan_type === 'pro'
                              ? 'border-ml text-ml-soft'
                              : s.plan_type === 'emprendedor'
                              ? 'border-acid text-acid'
                              : 'border-signal text-signal-soft'
                          }`}
                        >
                          {s.plan_type === 'pro' ? 'Pro' : s.plan_type === 'emprendedor' ? 'Emprendedor' : 'Prueba'}
                        </span>
                      </div>
                      <div className="mono mt-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                        <span className="inline-flex items-center gap-1 text-ml-soft">
                          <ListChecks className="h-3 w-3" /> {s.orders?.[0]?.count || 0} tx
                        </span>
                        <span>·</span>
                        <span className={s.is_active ? 'text-acid' : 'text-signal'}>
                          {s.is_active ? 'Activo' : 'Suspendido'}
                        </span>
                        {s.subscription_expiry && new Date(s.subscription_expiry) > new Date() && (
                          <>
                            <span>·</span>
                            <span className="text-text-muted">
                              Vence {new Date(s.subscription_expiry).toLocaleDateString('es-AR')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full items-center gap-2 md:w-auto md:justify-end">
                    <button
                      onClick={() => openEditModal(s)}
                      className="rounded-[var(--radius-sm)] border border-rule bg-white/5 p-2.5 text-text-muted hover:border-text hover:text-text"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <a
                      href={`/${s.slug}/admin`}
                      target="_blank"
                      className="mono inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-acid px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink hover:brightness-110"
                    >
                      <LogIn className="h-3.5 w-3.5" /> Control
                    </a>
                    <button
                      onClick={() => deleteStore(s.id)}
                      className="rounded-[var(--radius-sm)] border border-signal/30 bg-signal/10 p-2.5 text-signal hover:bg-signal hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FINANCE */}
        {activeView === 'finance' && (
          <div className="space-y-8 anim-rise">
            <header>
              <Eyebrow>Finanzas</Eyebrow>
              <h2 className="display mt-3 text-5xl md:text-6xl">
                Subscription <em className="display-italic text-acid">ledger</em>
              </h2>
              <p className="mt-2 text-sm text-text-muted">Historial de cobros por suscripción.</p>
            </header>

            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-rule bg-ink-3">
                    <th className="mono p-5 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                      Fecha
                    </th>
                    <th className="mono p-5 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                      Negocio
                    </th>
                    <th className="mono p-5 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                      Monto
                    </th>
                    <th className="mono p-5 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-rule hover:bg-white/[0.02]">
                      <td className="mono p-5 text-xs text-text-muted">
                        {new Date(p.created_at).toLocaleDateString('es-AR')}
                      </td>
                      <td className="p-5 text-sm font-semibold text-text">{p.stores?.name}</td>
                      <td className="num p-5 text-sm font-semibold text-acid">
                        ${Number(p.amount).toLocaleString()}
                      </td>
                      <td className="p-5">
                        <span className="mono inline-flex items-center rounded-full border border-acid/30 bg-acid/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-acid">
                          Aprobado
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-16 text-center">
                        <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">
                          No hay registros de pagos
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeView === 'notifications' && (
          <div className="space-y-8 anim-rise">
            <header className="flex items-end justify-between">
              <div>
                <Eyebrow>Mensajería</Eyebrow>
                <h2 className="display mt-3 text-5xl md:text-6xl">
                  Centro de <em className="display-italic text-acid">avisos</em>
                </h2>
                <p className="mt-2 text-sm text-text-muted">Comunicados enviados a la red.</p>
              </div>
              <Button onClick={() => setShowNotifyModal(true)} variant="acid" size="md">
                <Plus className="h-4 w-4" /> Nuevo aviso
              </Button>
            </header>

            <div className="grid gap-3">
              {globalNotifications.map((n) => (
                <div
                  key={n.id}
                  className="flex flex-col items-start justify-between gap-5 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6 transition-colors hover:border-text-muted md:flex-row md:items-center"
                >
                  <div className="flex items-start gap-5">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
                        n.is_active ? 'bg-acid/10 text-acid' : 'bg-ink-3 text-text-subtle'
                      }`}
                    >
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="display text-xl text-text">{n.title}</h4>
                        <span
                          className={`mono rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] ${
                            n.target === 'all'
                              ? 'border-ml text-ml-soft'
                              : 'border-signal text-signal-soft'
                          }`}
                        >
                          {n.target === 'all' ? 'Todos' : n.target === 'gastronomia' ? 'Gastro' : 'Turnos'}
                        </span>
                        {!n.is_active && (
                          <span className="mono rounded-sm border border-signal/30 bg-signal/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-signal">
                            Desactivado
                          </span>
                        )}
                      </div>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">{n.message}</p>
                      <p className="mono mt-4 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                        {new Date(n.created_at).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full items-center gap-2 md:w-auto md:justify-end">
                    <button
                      onClick={() => toggleNotificationStatus(n.id, n.is_active)}
                      className={`rounded-[var(--radius-sm)] p-2.5 transition-colors ${
                        n.is_active
                          ? 'text-acid hover:bg-acid/10'
                          : 'text-text-muted hover:bg-white/5 hover:text-text'
                      }`}
                    >
                      {n.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="rounded-[var(--radius-sm)] border border-signal/30 bg-signal/10 p-2.5 text-signal hover:bg-signal hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {globalNotifications.length === 0 && (
                <div className="rounded-[var(--radius-xl)] border border-dashed border-rule-strong p-16 text-center">
                  <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">
                    No hay avisos anteriores
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL CREAR */}
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-6 backdrop-blur-md anim-fade">
            <div className="relative w-full max-w-xl overflow-hidden rounded-[var(--radius-2xl)] border border-rule-strong bg-ink-2 p-10 shadow-[var(--shadow-editorial)]">
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute right-6 top-6 rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
              <Eyebrow>
                <Briefcase className="h-3 w-3" /> Alta
              </Eyebrow>
              <h3 className="display mt-3 text-4xl text-text">
                Nuevo <em className="display-italic text-acid">negocio</em>
              </h3>
              <p className="mt-3 text-sm text-text-muted">Definí el plan y el tipo de vertical inicial.</p>

              <form onSubmit={handleCreateStore} className="mt-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="eyebrow mb-2 block">Nombre</label>
                    <input
                      required
                      className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text placeholder:text-text-subtle focus:border-acid focus:outline-none"
                      placeholder="Ej: Pizzería Riva"
                      value={newStoreData.name}
                      onChange={(e) =>
                        setNewStoreData({
                          ...newStoreData,
                          name: e.target.value,
                          slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="eyebrow mb-2 block">Slug</label>
                    <input
                      required
                      className="mono w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text placeholder:text-text-subtle focus:border-acid focus:outline-none"
                      placeholder="burger-king"
                      value={newStoreData.slug}
                      onChange={(e) => setNewStoreData({ ...newStoreData, slug: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="eyebrow mb-2 block">Tipo</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'gastronomia', icon: Utensils, label: 'Gastronomía' },
                      { key: 'turnos', icon: Calendar, label: 'Turnos' },
                    ].map((v) => {
                      const active = newStoreData.business_type === v.key;
                      const Icon = v.icon;
                      return (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => setNewStoreData({ ...newStoreData, business_type: v.key })}
                          className={`flex items-center justify-center gap-2 rounded-[var(--radius-md)] border p-3 text-sm transition-all ${
                            active
                              ? 'border-acid bg-acid/10 text-acid'
                              : 'border-rule-strong bg-ink-3 text-text-muted hover:border-text-muted'
                          }`}
                        >
                          <Icon className="h-4 w-4" /> {v.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="eyebrow mb-2 block">Plan inicial</label>
                  <select
                    className="mono w-full cursor-pointer rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm uppercase tracking-[0.15em] text-text focus:border-acid focus:outline-none"
                    value={newStoreData.plan_type}
                    onChange={(e) => setNewStoreData({ ...newStoreData, plan_type: e.target.value })}
                  >
                    <option value="trial">Prueba</option>
                    <option value="emprendedor">Emprendedor</option>
                    <option value="pro">Profesional</option>
                  </select>
                </div>

                {newStoreData.plan_type === 'trial' && (
                  <div>
                    <label className="eyebrow mb-2 block">Duración de la prueba</label>
                    <select
                      className="mono w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-acid focus:outline-none"
                      value={newStoreData.trial_days}
                      onChange={(e) => setNewStoreData({ ...newStoreData, trial_days: e.target.value })}
                    >
                      <option value="7">7 días</option>
                      <option value="15">15 días</option>
                      <option value="30">30 días</option>
                    </select>
                  </div>
                )}

                {(newStoreData.plan_type === 'emprendedor' || newStoreData.plan_type === 'pro') && (
                  <div>
                    <label className="eyebrow mb-2 block">Meses pagados por adelantado</label>
                    <input
                      type="number"
                      min="1"
                      className="num w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-acid focus:outline-none"
                      value={newStoreData.paid_months}
                      onChange={(e) => setNewStoreData({ ...newStoreData, paid_months: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="eyebrow mb-2 block">Contraseña admin</label>
                    <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3">
                      <Lock className="h-4 w-4 text-acid" />
                      <input
                        className="mono w-full bg-transparent text-sm text-text outline-none"
                        value={newStoreData.password}
                        onChange={(e) => setNewStoreData({ ...newStoreData, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="eyebrow mb-2 block">Email dueño (opcional)</label>
                    <input
                      type="email"
                      className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text placeholder:text-text-subtle focus:border-acid focus:outline-none"
                      placeholder="dueño@email.com"
                      value={newStoreData.owner_email}
                      onChange={(e) => setNewStoreData({ ...newStoreData, owner_email: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  disabled={creating}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-acid py-4 text-sm font-semibold text-ink shadow-[var(--shadow-lift)] transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Store className="h-4 w-4" /> Crear negocio
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDITAR */}
        {showEditModal && editingStore && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-6 backdrop-blur-md anim-fade">
            <div className="relative w-full max-w-lg rounded-[var(--radius-2xl)] border border-rule-strong bg-ink-2 p-10 shadow-[var(--shadow-editorial)]">
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute right-6 top-6 rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
              <Eyebrow>
                <Edit className="h-3 w-3" /> Editar
              </Eyebrow>
              <h3 className="display mt-3 text-3xl text-text">
                {editingStore.name}
              </h3>

              <form onSubmit={handleUpdateStore} className="mt-8 space-y-5">
                <div>
                  <label className="eyebrow mb-2 block">Nombre</label>
                  <input
                    className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-ml focus:outline-none"
                    value={editingStore.name}
                    onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="eyebrow mb-2 block">Slug</label>
                  <input
                    className="mono w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-ml focus:outline-none"
                    value={editingStore.slug}
                    onChange={(e) => setEditingStore({ ...editingStore, slug: e.target.value })}
                  />
                </div>
                <div>
                  <label className="eyebrow mb-2 block">Email dueño</label>
                  <input
                    type="email"
                    className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-ml focus:outline-none"
                    value={editingStore.owner_email}
                    onChange={(e) => setEditingStore({ ...editingStore, owner_email: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="eyebrow mb-2 block">Plan</label>
                    <select
                      className="mono w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-ml focus:outline-none"
                      value={editingStore.plan_type || 'trial'}
                      onChange={(e) => setEditingStore({ ...editingStore, plan_type: e.target.value })}
                    >
                      <option value="trial">Prueba</option>
                      <option value="emprendedor">Emprendedor</option>
                      <option value="pro">Profesional</option>
                    </select>
                  </div>
                  <div>
                    <label className="eyebrow mb-2 block">Estado</label>
                    <select
                      className="mono w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-ml focus:outline-none"
                      value={editingStore.is_active}
                      onChange={(e) => setEditingStore({ ...editingStore, is_active: e.target.value === 'true' })}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Suspendido</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="eyebrow mb-2 block">Vencimiento</label>
                  <input
                    type="date"
                    className="num w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-ml focus:outline-none"
                    value={editingStore.expiry_date_input}
                    onChange={(e) => setEditingStore({ ...editingStore, expiry_date_input: e.target.value })}
                  />
                </div>
                <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-ml py-4 text-sm font-semibold text-white shadow-[var(--shadow-lift)] hover:brightness-110">
                  <Save className="h-4 w-4" /> Guardar cambios
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL NOTIFICACIÓN */}
        {showNotifyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-6 backdrop-blur-md anim-fade">
            <div className="relative w-full max-w-lg rounded-[var(--radius-2xl)] border border-rule-strong bg-ink-2 p-10 shadow-[var(--shadow-editorial)]">
              <button
                onClick={() => setShowNotifyModal(false)}
                className="absolute right-6 top-6 rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
              <Eyebrow>
                <Bell className="h-3 w-3" /> Broadcast
              </Eyebrow>
              <h3 className="display mt-3 text-4xl text-text">
                Nuevo <em className="display-italic text-acid">aviso</em>
              </h3>

              <form onSubmit={handleSendNotification} className="mt-8 space-y-5">
                <div>
                  <label className="eyebrow mb-2 block">Título</label>
                  <input
                    required
                    className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text placeholder:text-text-subtle focus:border-acid focus:outline-none"
                    placeholder="Ej: Actualización del panel"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="eyebrow mb-2 block">Mensaje</label>
                  <textarea
                    required
                    rows="4"
                    className="w-full resize-none rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text placeholder:text-text-subtle focus:border-acid focus:outline-none"
                    placeholder="Contenido del anuncio…"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  />
                </div>
                <div>
                  <label className="eyebrow mb-2 block">Destinatarios</label>
                  <select
                    className="mono w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm uppercase tracking-[0.15em] text-text focus:border-acid focus:outline-none"
                    value={newNotification.target}
                    onChange={(e) => setNewNotification({ ...newNotification, target: e.target.value })}
                  >
                    <option value="all">Todos los locales</option>
                    <option value="gastronomia">Solo Gastronomía</option>
                    <option value="turnos">Solo Turnos</option>
                  </select>
                </div>
                <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-acid py-4 text-sm font-semibold text-ink shadow-[var(--shadow-lift)] hover:brightness-110">
                  Enviar ahora <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-rule bg-ink-2/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors ${
                isActive ? 'text-acid' : 'text-text-subtle hover:text-text'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="mono text-[9px] uppercase tracking-[0.22em]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
