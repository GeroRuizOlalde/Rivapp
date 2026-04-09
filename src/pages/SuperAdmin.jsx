import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom'; 
import { 
  Shield, Plus, ExternalLink, Power, Trash2, Store, 
  TrendingUp, Users, DollarSign, Activity, Search,
  LayoutDashboard, LogIn, CreditCard, Edit, X, Trophy, 
  UserPlus, Mail, MailCheck, Filter, RefreshCcw,
  Utensils, Calendar, Check, Clock, ToggleLeft, ToggleRight,
  Bell, ListChecks, Smartphone, BarChart3, Briefcase, Lock, Save, Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { isPlatformAdmin } from '../utils/platformAdmin';

export default function SuperAdmin() {
  const navigate = useNavigate(); 
  const [authorized, setAuthorized] = useState(false); 
  const [activeView, setActiveView] = useState('dashboard');
  
  // Datos
  const [stores, setStores] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [globalNotifications, setGlobalNotifications] = useState([]); 
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");

  // Modales
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [newNotification, setNewNotification] = useState({ title: '', message: '', target: 'all' });

  // Estado Crear Negocio
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStoreData, setNewStoreData] = useState({
    name: '', slug: '', business_type: 'gastronomia', owner_email: '', password: 'riva123', trial_days: 30, is_demo: 'false', plan_type: 'trial', paid_months: 1
  });

  // Estado Editar Negocio
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !isPlatformAdmin(session.user)) { navigate('/login'); return; }
        setAuthorized(true); 
        fetchAllData(); 
    };
    checkAdminAccess();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    const { data: storesData } = await supabase.from('stores').select('*, orders(count), appointments(count)').order('created_at', { ascending: false });
    const { data: plansData } = await supabase.from('platform_plans').select('*');
    const { data: paymentsData } = await supabase.from('subscription_payments').select('*, stores(name)').order('created_at', { ascending: false });
    const { data: notifyData } = await supabase.from('global_notifications').select('*').order('created_at', { ascending: false });
    
    if (storesData) setStores(storesData);
    if (plansData) setPlans(plansData);
    if (paymentsData) setPayments(paymentsData);
    if (notifyData) setGlobalNotifications(notifyData);
    setLoading(false);
  };

  // --- LÓGICA PRO: CREAR NEGOCIO ---
  const handleCreateStore = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    // 1. Calcular Vencimiento
    let expiryDate = new Date();
    const now = new Date();
    if (newStoreData.plan_type === 'trial') {
        expiryDate.setDate(now.getDate() + parseInt(newStoreData.trial_days));
    } else {
        expiryDate.setMonth(now.getMonth() + parseInt(newStoreData.paid_months));
    }
    expiryDate.setHours(23, 59, 59, 999);

    // 🟢 SANITIZACIÓN DE SLUG
    const cleanSlug = newStoreData.slug
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

    try {
        let newOwnerId = null;
        let isDemoFinal = newStoreData.is_demo === 'true';

        // 2. ¿Tiene email? -> Intentamos crear el usuario dueño
        if (newStoreData.owner_email && newStoreData.owner_email.trim() !== "") {
            const { data: funcData, error: funcError } = await supabase.functions.invoke('create-store-owner', {
                body: {
                    email: newStoreData.owner_email,
                    password: newStoreData.password,
                    name: newStoreData.name
                }
            });

            if (funcError) throw new Error("Error creando usuario: " + funcError.message);
            newOwnerId = funcData?.user_id;
        } else {
            console.debug("Sin email: creando tienda demo huerfana");
            isDemoFinal = true; 
        }

        // 3. Crear tienda en DB
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
            color_accent: newStoreData.business_type === 'gastronomia' ? '#ff6b00' : '#2563eb'
        };

        const { error: storeError } = await supabase.from('stores').insert([storeToInsert]);
        
        if (storeError) throw new Error("Fallo al crear tienda: " + storeError.message);
        
        alert(`✅ Negocio "${newStoreData.name}" creado.`);
        setShowCreateModal(false);
        setNewStoreData({ 
            name: '', slug: '', business_type: 'gastronomia', owner_email: '', 
            password: 'riva123', is_demo: 'false', plan_type: 'trial', 
            trial_days: 30, paid_months: 1 
        });
        fetchAllData(); 

    } catch (error) {
        console.error(error);
        alert("🛑 Error: " + error.message);
    } finally {
        setCreating(false);
    }
  };

  // --- LÓGICA: EDITAR NEGOCIO (CON FIX DE FECHA) ---
  const openEditModal = (store) => {
      setEditingStore({
          ...store,
          owner_email: store.owner_email || '',
          expiry_date_input: store.subscription_expiry ? store.subscription_expiry.split('T')[0] : ''
      });
      setShowEditModal(true);
  };

  const handleUpdateStore = async (e) => {
      e.preventDefault();
      
      let finalExpiry = null;
      if (editingStore.expiry_date_input) {
          // 🟢 FIX CRÍTICO DE ZONA HORARIA:
          // Creamos la fecha ISO "a mano" forzando UTC (Z) para que no se reste un día.
          // El input date devuelve "2024-05-20", le pegamos "T23:59:59Z".
          finalExpiry = `${editingStore.expiry_date_input}T23:59:59Z`;
      }

      // Sanitización de Slug
      const cleanSlug = editingStore.slug
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
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
              subscription_status: 'active'
          };

          const { error } = await supabase.from('stores').update(updateData).eq('id', editingStore.id);

          if (error) throw error;
          alert("Negocio actualizado correctamente ✅");
          setShowEditModal(false);
          setEditingStore(null);
          fetchAllData();
      } catch (error) {
          alert("Error al actualizar: " + error.message);
      }
  };

  const deleteStore = async (id) => {
      if(!window.confirm("⚠️ ATENCIÓN CRÍTICA ⚠️\n\nEstás a punto de borrar este negocio.\n\nAl confirmar, se eliminará:\n- La tienda\n- Todos los pedidos/turnos\n- El menú/servicios\n- Los cupones\n\n¿Estás 100% seguro?")) return;
      
      setLoading(true);
      try {
          const { error } = await supabase.from('stores').delete().eq('id', id);
          if(error) throw error;
          alert("✅ Tienda eliminada.");
          fetchAllData();
      } catch (error) {
          alert("❌ Error: " + error.message);
      } finally {
          setLoading(false);
      }
  };

  const handleResetDemos = async () => {
    if (!confirm("⚠️ ¿Resetear demos?")) return;
    const demoStores = stores.filter(s => s.is_demo);
    const demoIds = demoStores.map(s => s.id);
    if (demoIds.length === 0) return alert("No hay demos.");
    setLoading(true);
    try {
        await supabase.from('orders').delete().in('store_id', demoIds);
        await supabase.from('appointments').delete().in('store_id', demoIds);
        alert("¡Limpieza completada! 🧹");
        fetchAllData();
    } catch (error) { alert("Error: " + error.message); } finally { setLoading(false); }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('global_notifications').insert([newNotification]);
    if (!error) {
        alert("Notificación enviada 🔔");
        setShowNotifyModal(false);
        setNewNotification({ title: '', message: '', target: 'all' });
        fetchAllData(); 
    }
  };

  const deleteNotification = async (id) => { if(!window.confirm("¿Eliminar?")) return; await supabase.from('global_notifications').delete().eq('id', id); fetchAllData(); };
  const toggleNotificationStatus = async (id, currentStatus) => { await supabase.from('global_notifications').update({ is_active: !currentStatus }).eq('id', id); fetchAllData(); };

  const processedStores = useMemo(() => {
    let list = [...stores];
    if (searchTerm) list = list.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (categoryFilter !== "todos") list = list.filter(s => s.business_type === categoryFilter);
    return list.sort((a, b) => (a.is_demo === b.is_demo) ? 0 : a.is_demo ? -1 : 1);
  }, [stores, searchTerm, categoryFilter]);

  const stats = {
    total: stores.filter(s => !s.is_demo).length,
    active: stores.filter(s => s.is_active && !s.is_demo).length,
    mrr: stores.filter(s => s.is_active && !s.is_demo).reduce((acc, curr) => acc + (Number(curr.subscription_price) || 0), 0),
    totalOrders: stores.reduce((acc, s) => acc + (s.orders?.[0]?.count || 0) + (s.appointments?.[0]?.count || 0), 0)
  };

  if (!authorized || loading) return <div className="h-screen bg-black flex items-center justify-center text-white font-black italic animate-pulse">CARGANDO SUPERADMIN...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col lg:flex-row">
      <aside className="hidden lg:flex w-24 bg-[#0a0a0a] border-r border-white/5 flex-col items-center py-10 gap-10 fixed h-full z-20">
        <div className="bg-[#d0ff00] p-3 rounded-2xl text-black shadow-[0_0_20px_rgba(208,255,0,0.3)] hover:scale-110 transition-transform cursor-pointer"><Shield size={28}/></div>
        <div className="flex flex-col gap-6 w-full px-4">
            <button onClick={() => setActiveView('dashboard')} className={`p-4 rounded-2xl transition-all flex justify-center ${activeView === 'dashboard' ? 'bg-[#d0ff00]/10 text-[#d0ff00]' : 'text-gray-600 hover:text-white'}`}><LayoutDashboard size={24}/></button>
            <button onClick={() => setActiveView('clients')} className={`p-4 rounded-2xl transition-all flex justify-center ${activeView === 'clients' ? 'bg-[#d0ff00]/10 text-[#d0ff00]' : 'text-gray-600 hover:text-white'}`}><Users size={24}/></button>
            <button onClick={() => setActiveView('finance')} className={`p-4 rounded-2xl transition-all flex justify-center ${activeView === 'finance' ? 'bg-[#d0ff00]/10 text-[#d0ff00]' : 'text-gray-600 hover:text-white'}`}><DollarSign size={24}/></button>
            <button onClick={() => setActiveView('notifications')} className={`p-4 rounded-2xl transition-all flex justify-center ${activeView === 'notifications' ? 'bg-[#d0ff00]/10 text-[#d0ff00]' : 'text-gray-600 hover:text-white'}`}><Bell size={24}/></button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-24 p-6 lg:p-10">
        {activeView === 'dashboard' && (
            <div className="animate-in fade-in space-y-10">
                <header className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div><h1 className="text-4xl font-black tracking-tighter uppercase">Global <span className="text-[#d0ff00]">Overview</span></h1><p className="text-gray-500 font-medium">Estado real de la plataforma Rivapp.</p></div>
                    <div className="flex gap-3">
                        <button onClick={handleResetDemos} className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all"><RefreshCcw size={18}/> Reset Demos</button>
                        <button onClick={() => setShowCreateModal(true)} className="bg-[#d0ff00] text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all"><Plus size={18}/> Nuevo Local</button>
                        <button onClick={() => setShowNotifyModal(true)} className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#d0ff00] transition-colors"><Bell size={18}/> Notificar</button>
                    </div>
                </header>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-[#0f0f0f] p-6 rounded-[2rem] border border-white/5"><span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-4">Ingreso Mensual (MRR)</span><div className="text-3xl font-black">${stats.mrr.toLocaleString()}</div></div>
                    <div className="bg-[#0f0f0f] p-6 rounded-[2rem] border border-white/5"><span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-4">Negocios Activos</span><div className="text-3xl font-black text-[#d0ff00]">{stats.active}</div></div>
                    <div className="bg-[#0f0f0f] p-6 rounded-[2rem] border border-white/5"><span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-4">Actividad Total</span><div className="text-3xl font-black text-blue-500">{stats.totalOrders}</div></div>
                    <div className="bg-white text-black p-6 rounded-[2rem] flex flex-col justify-between hover:bg-[#d0ff00] transition-all cursor-pointer shadow-xl" onClick={() => setActiveView('clients')}><div className="flex justify-between items-start"><Smartphone size={24}/><TrendingUp size={24}/></div><div className="font-black text-xl leading-tight">Gestionar Cartera</div></div>
                </div>

                {/* 🟢 ACTIVIDAD RECIENTE */}
                <div className="bg-[#0f0f0f] p-8 rounded-[2.5rem] border border-white/5">
                    <h3 className="font-black text-xl mb-6 flex items-center gap-3"><Activity className="text-red-500"/> Actividad Reciente</h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
                        {stores.slice(0, 10).map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${s.plan_type === 'trial' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                    <p className="text-sm font-medium">
                                        <span className="text-[#d0ff00] font-bold">{s.name}</span> se unió con plan 
                                        <span className="font-black uppercase ml-1">{s.plan_type}</span>.
                                    </p>
                                </div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">{new Date(s.created_at).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeView === 'clients' && (
            <div className="animate-in fade-in space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 text-white">
                    <h2 className="text-4xl font-black uppercase tracking-tighter">Clientes <span className="text-gray-600">({processedStores.length})</span></h2>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex bg-[#0f0f0f] p-1.5 rounded-2xl border border-white/5">
                            {['todos', 'gastronomia', 'turnos'].map(f => (
                                <button key={f} onClick={() => setCategoryFilter(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${categoryFilter === f ? 'bg-[#d0ff00] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>{f}</button>
                            ))}
                        </div>
                        <div className="relative flex-1 md:w-64"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18}/><input className="bg-[#0f0f0f] border border-white/5 pl-12 pr-6 py-3 rounded-2xl text-white outline-none w-full focus:border-[#d0ff00]/40 transition-all" placeholder="Buscar local..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>
                    </div>
                </div>
                <div className="grid gap-4 text-white">
                    {processedStores.map(s => (
                        <div key={s.id} className="p-6 rounded-[2rem] bg-[#0f0f0f] border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row justify-between items-center gap-6 group">
                            <div className="flex items-center gap-5 w-full md:w-auto">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${s.is_active ? 'bg-zinc-800' : 'bg-red-900/30 text-red-500'}`}>{s.name.substring(0,2).toUpperCase()}</div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                                        <h4 className="font-black text-xl">{s.name}</h4>
                                        {s.is_demo && <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-lg font-black italic shadow-[0_0_10px_#9333ea60]">DEMO</span>}
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase ${s.plan_type==='pro' ? 'border-blue-500 text-blue-400' : s.plan_type === 'emprendedor' ? 'border-green-500 text-green-400' : 'border-yellow-500 text-yellow-400'}`}>
                                            {s.plan_type === 'pro' ? 'PROFESIONAL' : s.plan_type === 'emprendedor' ? 'EMPRENDEDOR' : 'PRUEBA'}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        <span className="flex items-center gap-1 text-blue-400"><ListChecks size={12}/> {s.orders?.[0]?.count || 0} Tx</span>
                                        <span>•</span>
                                        <span className={s.is_active ? 'text-green-500' : 'text-red-500'}>{s.is_active ? 'Activo' : 'Suspendido'}</span>
                                        {s.subscription_expiry && new Date(s.subscription_expiry) > new Date() && (
                                            <span className="text-[#d0ff00]"> • Vence: {new Date(s.subscription_expiry).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                <button onClick={() => openEditModal(s)} className="p-3 bg-white/10 rounded-xl text-white hover:bg-white hover:text-black transition-all" title="Editar"><Edit size={20}/></button>
                                <a href={`/${s.slug}/admin`} target="_blank" className="bg-[#d0ff00] text-black px-5 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:scale-105 transition-transform"><LogIn size={16}/> Control</a>
                                <button onClick={() => deleteStore(s.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* VISTA FINANZAS */}
        {activeView === 'finance' && (
            <div className="animate-in fade-in space-y-8">
                <header><h2 className="text-4xl font-black uppercase tracking-tighter">Subscription <span className="text-[#d0ff00]">Ledger</span></h2><p className="text-gray-500">Historial de cobros por suscripción.</p></header>
                <div className="bg-[#0f0f0f] rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500"><tr className="border-b border-white/5"><th className="p-6">Fecha</th><th className="p-6">Negocio</th><th className="p-6">Monto</th><th className="p-6">Estado</th></tr></thead>
                        <tbody className="text-sm font-medium">
                            {payments.map(p => (
                                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-6 text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                                    <td className="p-6 font-bold">{p.stores?.name}</td>
                                    <td className="p-6 text-[#d0ff00] font-black">${Number(p.amount).toLocaleString()}</td>
                                    <td className="p-6"><span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-green-500/20">Aprobado ✅</span></td>
                                </tr>
                            ))}
                            {payments.length === 0 && <tr><td colSpan="4" className="p-20 text-center text-gray-600 italic">No hay registros de pagos aún.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* VISTA NOTIFICACIONES */}
        {activeView === 'notifications' && (
            <div className="animate-in fade-in space-y-8">
                <header className="flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter">Centro de <span className="text-[#d0ff00]">Mensajería</span></h2>
                        <p className="text-gray-500">Historial de comunicados enviados a la red.</p>
                    </div>
                    <button onClick={() => setShowNotifyModal(true)} className="bg-[#d0ff00] text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all">
                        <Plus size={18}/> Nuevo Aviso
                    </button>
                </header>

                <div className="grid gap-4">
                    {globalNotifications.map(n => (
                        <div key={n.id} className="p-6 bg-[#0f0f0f] border border-white/5 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-white/10 transition-all text-white">
                            <div className="flex gap-5 items-start">
                                <div className={`p-4 rounded-2xl ${n.is_active ? 'bg-[#d0ff00]/10 text-[#d0ff00]' : 'bg-zinc-800 text-gray-500'}`}>
                                    <Bell size={28}/>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <h4 className="font-black text-xl">{n.title}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-black uppercase ${n.target === 'all' ? 'border-blue-500/50 text-blue-400' : 'border-orange-500/50 text-orange-400'}`}>
                                            {n.target === 'all' ? '🌎 Todos' : n.target === 'gastronomia' ? '🍔 Gastro' : '📅 Turnos'}
                                        </span>
                                        {!n.is_active && <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-lg font-black uppercase">Desactivado</span>}
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">{n.message}</p>
                                    <span className="text-[10px] text-gray-600 font-bold uppercase mt-4 block">{new Date(n.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                <button onClick={() => toggleNotificationStatus(n.id, n.is_active)} className={`p-3 rounded-xl transition-all ${n.is_active ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-green-500 hover:bg-green-500/10'}`} title={n.is_active ? "Desactivar" : "Activar"}>
                                    {n.is_active ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                                </button>
                                <button onClick={() => deleteNotification(n.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                    <Trash2 size={20}/>
                                </button>
                            </div>
                        </div>
                    ))}
                    {globalNotifications.length === 0 && <div className="p-20 text-center text-gray-600 border border-dashed border-white/5 rounded-3xl font-bold">No hay avisos anteriores.</div>}
                </div>
            </div>
        )}

        {/* MODAL CREAR LOCAL (CORREGIDO) */}
        {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md animate-in fade-in">
                <div className="bg-[#0f0f0f] w-full max-w-xl p-8 lg:p-12 rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden text-white">
                    <button onClick={() => setShowCreateModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors z-10"><X size={30}/></button>
                    <h3 className="text-3xl font-black mb-2 italic flex items-center gap-4 text-white"><Briefcase size={32} className="text-[#d0ff00]"/> Alta de Negocio</h3>
                    <p className="text-gray-500 mb-8 font-medium">Crea un nuevo espacio y define su plan inicial.</p>
                    <form onSubmit={handleCreateStore} className="space-y-5 relative z-10">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Nombre del Local</label><input required className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#d0ff00] transition-all font-bold" placeholder="Ej: Pizzería Riva" value={newStoreData.name} onChange={e=>setNewStoreData({...newStoreData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} /></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Slug (URL)</label><input required className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-gray-400 outline-none focus:border-[#d0ff00] transition-all font-mono text-sm" placeholder="burger-king" value={newStoreData.slug} onChange={e=>setNewStoreData({...newStoreData, slug: e.target.value})} /></div>
                        </div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Tipo de Negocio</label><div className="grid grid-cols-2 gap-4"><div onClick={() => setNewStoreData({...newStoreData, business_type: 'gastronomia'})} className={`cursor-pointer p-4 rounded-2xl border flex items-center justify-center gap-2 transition-all ${newStoreData.business_type === 'gastronomia' ? 'bg-[#d0ff00] text-black border-[#d0ff00] font-black' : 'border-white/10 hover:bg-white/5'}`}><Utensils size={18}/> Gastronomía</div><div onClick={() => setNewStoreData({...newStoreData, business_type: 'turnos'})} className={`cursor-pointer p-4 rounded-2xl border flex items-center justify-center gap-2 transition-all ${newStoreData.business_type === 'turnos' ? 'bg-[#d0ff00] text-black border-[#d0ff00] font-black' : 'border-white/10 hover:bg-white/5'}`}><Calendar size={18}/> Turnos</div></div></div>
                        
                        {/* 🟢 SELECTOR DE PLAN (ACTUALIZADO) */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Plan Inicial</label>
                            <select className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#d0ff00] font-bold appearance-none cursor-pointer hover:bg-white/5 transition-all" value={newStoreData.plan_type} onChange={e => setNewStoreData({...newStoreData, plan_type: e.target.value})}>
                                <option value="trial" className="bg-[#1a1a1a]">⏳ Periodo de Prueba (Trial)</option>
                                <option value="emprendedor" className="bg-[#1a1a1a]">🚀 Plan Emprendedor</option>
                                <option value="pro" className="bg-[#1a1a1a]">👑 Plan Profesional</option>
                            </select>
                        </div>

                        {/* CONDICIONAL: DIAS SI ES TRIAL */}
                        {newStoreData.plan_type === 'trial' && (
                            <div className="space-y-2 animate-in fade-in">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Duración de la Prueba</label>
                                <select className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#d0ff00] font-bold" value={newStoreData.trial_days} onChange={e => setNewStoreData({...newStoreData, trial_days: e.target.value})}>
                                    <option value="7" className="bg-[#1a1a1a]">⚡ 7 Días</option>
                                    <option value="15" className="bg-[#1a1a1a]">📅 15 Días</option>
                                    <option value="30" className="bg-[#1a1a1a]">🌙 30 Días</option>
                                </select>
                            </div>
                        )}

                        {/* CONDICIONAL: MESES SI ES PAGO */}
                        {(newStoreData.plan_type === 'emprendedor' || newStoreData.plan_type === 'pro') && (
                            <div className="space-y-2 animate-in fade-in">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Meses Pagados por Adelantado</label>
                                <input type="number" min="1" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#d0ff00] font-bold" value={newStoreData.paid_months} onChange={e => setNewStoreData({...newStoreData, paid_months: e.target.value})} />
                            </div>
                        )}

                         <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Contraseña Admin</label><div className="flex items-center gap-2 w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white"><Lock size={16} className="text-[#d0ff00]"/><input className="bg-transparent outline-none w-full font-mono text-white" value={newStoreData.password} onChange={e=>setNewStoreData({...newStoreData, password: e.target.value})} /></div></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Email Dueño (Opcional)</label><input type="email" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#d0ff00] transition-all font-medium" placeholder="dueño@email.com" value={newStoreData.owner_email} onChange={e=>setNewStoreData({...newStoreData, owner_email: e.target.value})} /></div>
                        </div>
                        <button disabled={creating} className="w-full bg-gradient-to-r from-white to-gray-200 text-black font-black py-5 rounded-2xl text-lg mt-6 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex justify-center items-center gap-3 disabled:opacity-50">
                            {creating ? <Loader2 className="animate-spin"/> : <><Store size={20}/> Crear Negocio Ahora</>}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* 🟢 MODAL EDITAR LOCAL (COMPLETO) */}
        {showEditModal && editingStore && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md animate-in fade-in">
                <div className="bg-[#0f0f0f] w-full max-w-lg p-10 rounded-[3rem] border border-white/10 shadow-2xl relative text-white">
                    <button onClick={() => setShowEditModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={30}/></button>
                    <h3 className="text-3xl font-black mb-6 italic flex items-center gap-4"><Edit size={32} className="text-blue-500"/> Editar Negocio</h3>
                    <form onSubmit={handleUpdateStore} className="space-y-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Nombre</label><input className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 font-bold" value={editingStore.name} onChange={e=>setEditingStore({...editingStore, name: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Slug</label><input className="w-full bg-black border border-white/10 p-4 rounded-2xl text-gray-400 font-mono text-sm" value={editingStore.slug} onChange={e=>setEditingStore({...editingStore, slug: e.target.value})} /></div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Email Dueño</label>
                            <input type="email" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white outline-none" value={editingStore.owner_email} onChange={e=>setEditingStore({...editingStore, owner_email: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Tipo de Plan</label><select className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white outline-none" value={editingStore.plan_type || 'trial'} onChange={e=>setEditingStore({...editingStore, plan_type: e.target.value})}><option value="trial" className="bg-[#1a1a1a]">⏳ Prueba</option><option value="emprendedor" className="bg-[#1a1a1a]">🚀 Emprendedor</option><option value="pro" className="bg-[#1a1a1a]">👑 Profesional</option></select></div>
                             <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Estado</label><select className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white outline-none" value={editingStore.is_active} onChange={e=>setEditingStore({...editingStore, is_active: e.target.value === 'true'})}><option value="true" className="bg-[#1a1a1a]">🟢 Activo</option><option value="false" className="bg-[#1a1a1a]">🔴 Suspendido</option></select></div>
                        </div>
                         <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Vencimiento (Modificar si es necesario)</label><input type="date" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white outline-none" value={editingStore.expiry_date_input} onChange={e=>setEditingStore({...editingStore, expiry_date_input: e.target.value})} /></div>
                        <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl text-lg mt-4 hover:bg-blue-500 transition-all shadow-xl flex justify-center items-center gap-2"><Save size={20}/> Guardar Cambios</button>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL NOTIFICACIÓN GLOBAL */}
        {showNotifyModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md animate-in fade-in text-white">
                <div className="bg-[#0f0f0f] w-full max-w-lg p-10 rounded-[3rem] border border-white/10 shadow-2xl relative">
                    <button onClick={() => setShowNotifyModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={30}/></button>
                    <h3 className="text-3xl font-black mb-8 italic flex items-center gap-4 text-white"><Bell size={32} className="text-[#d0ff00]"/> Broadcast Global</h3>
                    <form onSubmit={handleSendNotification} className="space-y-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Título del Aviso</label><input required className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#d0ff00] transition-all font-bold" placeholder="Ej: Actualización del Panel" value={newNotification.title} onChange={e=>setNewNotification({...newNotification, title: e.target.value})} /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Mensaje</label><textarea required rows="4" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#d0ff00] transition-all resize-none font-medium" placeholder="Escribe aquí el anuncio importante..." value={newNotification.message} onChange={e=>setNewNotification({...newNotification, message: e.target.value})} /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Destinatarios</label><select className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none" value={newNotification.target} onChange={e=>setNewNotification({...newNotification, target: e.target.value})}><option value="all" className="bg-[#1a1a1a]">🚀 Todos los Locales</option><option value="gastronomia" className="bg-[#1a1a1a]">🍔 Solo Gastronomía</option><option value="turnos" className="bg-[#1a1a1a]">📅 Solo Turnos</option></select></div>
                        <button className="w-full bg-white text-black font-black py-5 rounded-2xl text-lg mt-4 hover:bg-[#d0ff00] transition-all active:scale-95 shadow-xl text-black">Enviar Notificación Ahora</button>
                    </form>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}
