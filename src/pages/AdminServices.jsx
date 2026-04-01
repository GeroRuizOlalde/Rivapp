import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useStore } from '../context/StoreContext';
import { useEntitlements } from '../hooks/useEntitlements';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar as CalendarIcon, Clock, Settings, Plus, Trash2, 
  Briefcase, ExternalLink, ChevronLeft, ChevronRight, 
  User, Users, Phone, RefreshCw, Loader2, TrendingUp, UserPlus, 
  Store, Save, MapPin, Image as ImageIcon, Upload, Camera, UserCog, 
  ToggleLeft, ToggleRight, Tag, Bell, CreditCard, Crown, Check, XCircle, X, Lock, Edit, Volume2, VolumeX, LogOut,
  Inbox, PlayCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURACIÓN ---
const BELL_SOUND_URL = "/sounds/ding.mp3"; 

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
};

const ALL_TABS = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'inbox', label: 'Solicitudes', icon: Inbox },
  { id: 'agenda', label: 'Agenda', icon: CalendarIcon },
  { id: 'team', label: 'Equipo', icon: UserCog, proOnly: true },
  { id: 'servicios', label: 'Servicios', icon: Briefcase },
  { id: 'marketing', label: 'Marketing', icon: Tag, proOnly: true },
  { id: 'profile', label: 'Mi Negocio', icon: Store },
  { id: 'billing', label: 'Suscripción', icon: CreditCard },
  { id: 'config', label: 'Horarios', icon: Settings },
];

export default function AdminServices() {
  const { store } = useStore();
  const { features, canAccessAdmin } = useEntitlements(store);
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [coupons, setCoupons] = useState([]); 
  const [loadingApts, setLoadingApts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [flash, setFlash] = useState(false);

  // --- SONIDO ---
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false); 

  useEffect(() => {
    soundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);
  
  const isFirstLoad = useRef(true);
  const prevAppointmentsCount = useRef(0);

  // --- FORMULARIOS ---
  const [profileForm, setProfileForm] = useState({ 
      name: '', phone: '', address: '', logo_url: '', banner_url: '', 
      color_accent: '#2563eb', 
      enable_staff_selection: true, enable_payments: false, 
      mp_public_key: '', mp_access_token: ''
  });
  const [slotsConfig, setSlotsConfig] = useState({ enable_multislots: false, max_concurrent_slots: 1 });
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(new Date()); 

  // --- MODALES ---
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false); 
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false); 
  const [crmModal, setCrmModal] = useState(null); 

  const [newService, setNewService] = useState({ name: '', price: '', duration: 30 });
  const [newStaff, setNewStaff] = useState({ name: '', role: '', avatar_url: '' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: 10 }); 
  const [manualApt, setManualApt] = useState({ customer_name: '', customer_phone: '', service_id: '', staff_id: '', date: '', time: '' });
  const [editingService, setEditingService] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);

  const [globalNotifications, setGlobalNotifications] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [dismissedMessages, setDismissedMessages] = useState(() => {
    const saved = localStorage.getItem('rivapp_dismissed_turnos_msgs');
    return saved ? JSON.parse(saved) : [];
  });

  const accentColor = store?.color_accent || '#2563eb';

  // 1. CONTROL DE SONIDO
  const playAudioElement = () => {
      const audio = document.getElementById('notification-audio');
      if (audio) {
          audio.currentTime = 0;
          audio.play().catch(e => console.warn("🔇 Audio bloqueado. Interactúa con la página primero."));
      }
  };

  const toggleSound = () => {
      const newState = !isSoundEnabled;
      setIsSoundEnabled(newState);
      soundEnabledRef.current = newState; 
      if (newState) playAudioElement();
  };

  const playNotification = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 1000);
    if (soundEnabledRef.current) { 
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        playAudioElement();
    }
  };

  // 2. CARGA DE DATOS
  const fetchAppointments = async () => { 
      if (!store?.id) return;
      
      const { data } = await supabase
        .from('appointments')
        .select('*, services(name, duration_minutes, price), staff(name)')
        .eq('store_id', store.id)
        .order('start_time', { ascending: true }); 
      
      if (data) {
        setAppointments(data);
        const currentCount = data.filter(a => a.status === 'pendiente').length;

        if (isFirstLoad.current) {
            isFirstLoad.current = false;
            prevAppointmentsCount.current = currentCount;
        } else if (currentCount > prevAppointmentsCount.current) {
            playNotification(); 
        }
        prevAppointmentsCount.current = currentCount;
      }
  };

  useEffect(() => {
    if (!store) return;
    
    setProfileForm({
        name: store.name || '', phone: store.phone || '', address: store.address || '', 
        logo_url: store.logo_url || '', banner_url: store.banner_url || '', 
        color_accent: store.color_accent || '#2563eb',
        enable_staff_selection: store.enable_staff_selection ?? true, enable_payments: store.enable_payments ?? false,
        mp_public_key: store.mp_public_key || '', mp_access_token: store.mp_access_token || ''
    });
    setSlotsConfig({ enable_multislots: store.enable_multislots || false, max_concurrent_slots: store.max_concurrent_slots || 1 });

    refreshAllData();
    fetchGlobalNotifications();

    const channel = supabase.channel('admin_services_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'appointments', filter: `store_id=eq.${store.id}` }, 
        (payload) => {
            fetchAppointments(); 
            if (payload.eventType === 'INSERT') {
                playNotification();
            }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [store]);

  const refreshAllData = () => { fetchServices(); fetchStaff(); fetchAppointments(); fetchSchedules(); fetchCoupons(); };
  const fetchServices = async () => { const { data } = await supabase.from('services').select('*').eq('store_id', store.id).order('name'); if (data) setServices(data); };
  const fetchStaff = async () => { const { data } = await supabase.from('staff').select('*').eq('store_id', store.id).eq('active', true); if (data) setStaffList(data); };
  const fetchSchedules = async () => { const { data } = await supabase.from('store_schedules').select('*').eq('store_id', store.id).order('day_of_week'); if (!data || data.length === 0) { setSchedules(DAYS.map((_, i) => ({ day_of_week: i, open_time: '09:00:00', close_time: '20:00:00', is_closed: i === 0 }))); } else { setSchedules(data); } };
  const fetchCoupons = async () => { const { data } = await supabase.from('coupons').select('*').eq('store_id', store.id).eq('active', true); if(data) setCoupons(data); };
  const fetchGlobalNotifications = async () => { const { data } = await supabase.from('global_notifications').select('*').eq('is_active', true).or(`target.eq.all,target.eq.turnos`).order('created_at', { ascending: false }); if (data && data.length > 0) { const filtered = data.filter(n => !dismissedMessages.includes(n.id)); setGlobalNotifications(filtered); if (filtered.length > 0) setActiveAlert(filtered[0]); } };
  const dismissMessage = (id) => { const updated = [...dismissedMessages, id]; setDismissedMessages(updated); localStorage.setItem('rivapp_dismissed_turnos_msgs', JSON.stringify(updated)); setGlobalNotifications(prev => prev.filter(n => n.id !== id)); if (activeAlert?.id === id) setActiveAlert(null); };

  const pendingAppointments = useMemo(() => appointments.filter(a => a.status === 'pendiente'), [appointments]);
  const filteredAppointments = useMemo(() => appointments.filter(a => isSameDay(new Date(a.start_time), selectedDate) && a.status === 'confirmado'), [appointments, selectedDate]);
  
  const stats = useMemo(() => {
    const today = new Date();
    const todayApts = appointments.filter(a => isSameDay(new Date(a.start_time), today));
    const incomeToday = todayApts.filter(a => a.status === 'confirmado').reduce((sum, a) => sum + (a.price_paid || a.services?.price || 0), 0); 
    const nextApt = appointments.find(a => new Date(a.start_time) > new Date() && a.status === 'confirmado');
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dailyIncome = appointments.filter(a => isSameDay(new Date(a.start_time), d) && a.status === 'confirmado').reduce((sum, a) => sum + (a.price_paid || a.services?.price || 0), 0);
        chartData.push({ name: d.toLocaleDateString('es-AR', { weekday: 'short' }), ingresos: dailyIncome });
    }
    return { todayCount: todayApts.length, incomeToday, nextApt, chartData };
  }, [appointments]);

  const visibleTabs = useMemo(() => { if (!store) return []; if (features.hasProTabs) return ALL_TABS; return ALL_TABS.filter(tab => !tab.proOnly); }, [features, store]);

  const handleUpdateStatus = async (id, newStatus, e) => { if(e) e.stopPropagation(); setAppointments(prev => prev.map(a => a.id === id ? {...a, status: newStatus} : a)); await supabase.from('appointments').update({ status: newStatus }).eq('id', id); fetchAppointments(); };
  const handleDeleteAppointment = async (id, e) => { if(e) e.stopPropagation(); if(!window.confirm("¿Borrar turno permanentemente?")) return; await supabase.from('appointments').delete().eq('id', id); fetchAppointments(); if(crmModal?.id === id) setCrmModal(null); };
  const sendReminder = (apt, e) => { if(e) e.stopPropagation(); const dateStr = new Date(apt.start_time).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' }); const text = `Hola *${apt.customer_name}*! 👋%0ATe escribo de *${store.name}* para recordarte tu turno:%0A%0A✂️ ${apt.services?.name}%0A📅 ${dateStr} hs%0A%0APor favor confirmame si vas a poder asistir. ¡Gracias!`; window.open(`https://wa.me/${apt.customer_phone}?text=${text}`, '_blank'); };
  const handleSaveProfile = async (e) => { e.preventDefault(); await supabase.from('stores').update({ name: profileForm.name, phone: profileForm.phone, address: profileForm.address, logo_url: profileForm.logo_url, banner_url: profileForm.banner_url, color_accent: profileForm.color_accent, enable_staff_selection: profileForm.enable_staff_selection, enable_payments: profileForm.enable_payments }).eq('id', store.id); alert("Perfil guardado"); };
  const handleSaveSchedule = async () => { const upserts = schedules.map(s => ({ store_id: store.id, day_of_week: s.day_of_week, open_time: s.open_time, close_time: s.close_time, is_closed: s.is_closed })); await supabase.from('store_schedules').upsert(upserts, { onConflict: 'store_id, day_of_week' }); await supabase.from('stores').update({ enable_multislots: slotsConfig.enable_multislots, max_concurrent_slots: slotsConfig.max_concurrent_slots }).eq('id', store.id); alert("Configuración guardada ✅"); };
  const handleFileChange = async (e, f, setter = setProfileForm) => { const file = e.target.files[0]; if(!file) return; setUploading(true); try { const ext = file.name.split('.').pop(); const name = `${store.id}/${Date.now()}.${ext}`; await supabase.storage.from('store-assets').upload(name, file); const { data } = supabase.storage.from('store-assets').getPublicUrl(name); if(f==='avatar_url') setter(p=>({...p,avatar_url:data.publicUrl})); else setter(p=>({...p,[f]:data.publicUrl})); } catch(e){alert(e.message)} setUploading(false); };
  const openServiceModal = (s=null) => { setEditingService(s); setNewService(s ? { name: s.name, price: s.price, duration: s.duration_minutes } : { name: '', price: '', duration: 30 }); setShowServiceModal(true); };
  const handleSaveService = async (e) => { e.preventDefault(); if (editingService) await supabase.from('services').update({ name: newService.name, price: newService.price, duration_minutes: newService.duration }).eq('id', editingService.id); else await supabase.from('services').insert([{ store_id: store.id, name: newService.name, price: newService.price, duration_minutes: newService.duration, active: true }]); setShowServiceModal(false); fetchServices(); };
  const deleteService = async (id) => { if(confirm("¿Borrar?")) { await supabase.from('services').delete().eq('id', id); fetchServices(); } };
  const openStaffModal = (s=null) => { setEditingStaff(s); setNewStaff(s ? { name: s.name, role: s.role, avatar_url: s.avatar_url } : { name: '', role: '', avatar_url: '' }); setShowStaffModal(true); };
  const handleSaveStaff = async (e) => { e.preventDefault(); if (editingStaff) await supabase.from('staff').update({ name: newStaff.name, role: newStaff.role, avatar_url: newStaff.avatar_url }).eq('id', editingStaff.id); else await supabase.from('staff').insert([{ store_id: store.id, ...newStaff }]); setShowStaffModal(false); fetchStaff(); };
  const deleteStaff = async (id) => { if(confirm("¿Borrar?")) { await supabase.from('staff').update({ active: false }).eq('id', id); fetchStaff(); } };
  const handleCreateCoupon = async (e) => { e.preventDefault(); await supabase.from('coupons').insert([{ store_id: store.id, code: newCoupon.code.toUpperCase(), discount: newCoupon.discount, active: true }]); setShowCouponModal(false); setNewCoupon({code:'', discount:10}); fetchCoupons(); };
  const deleteCoupon = async (id) => { if(confirm("¿Borrar?")) { await supabase.from('coupons').update({active: false}).eq('id', id); fetchCoupons(); } };
  const handleManualBooking = async (e) => { e.preventDefault(); const srv = services.find(s => s.id === parseInt(manualApt.service_id)); const start = `${manualApt.date}T${manualApt.time}:00`; const end = new Date(new Date(start).getTime() + (srv.duration_minutes * 60000)).toISOString(); await supabase.from('appointments').insert([{ store_id: store.id, service_id: srv.id, staff_id: manualApt.staff_id || null, customer_name: manualApt.customer_name, customer_phone: manualApt.customer_phone, start_time: new Date(start).toISOString(), end_time: end, status: 'confirmado', price_paid: srv.price }]); setShowManualModal(false); fetchAppointments(); alert("Turno creado"); };
  const handleSubscribe = async () => { /* Logic */ };
  const getDaysInMonth = (date) => { const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); const first = new Date(date.getFullYear(), date.getMonth(), 1).getDay(); const arr = Array(first).fill(null); for (let i = 1; i <= days; i++) arr.push(new Date(date.getFullYear(), date.getMonth(), i)); return arr; };
  const changeMonth = (off) => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + off)));
  const getDailyLoad = (d) => d ? appointments.filter(a => isSameDay(new Date(a.start_time), d) && a.status === 'confirmado').length : 0;
  const getClientHistory = (ph) => appointments.filter(a => a.customer_phone === ph && new Date(a.start_time) < new Date()).sort((a,b) => new Date(b.start_time) - new Date(a.start_time));
  const saveInternalNote = async (id, note) => { await supabase.from('appointments').update({ internal_notes: note }).eq('id', id); fetchAppointments(); };

  if (!store) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 size={48} className="text-white animate-spin"/></div>;
  if (!canAccessAdmin) return (<div className="min-h-screen bg-black flex items-center justify-center p-6 text-center text-white">Suscripción Vencida</div>);

  return (
    <div className={`min-h-screen bg-[#050505] text-white font-sans flex flex-col md:flex-row relative transition-colors duration-200 ${flash ? 'bg-blue-900/20' : ''}`}>
      
      <audio id="notification-audio" src={BELL_SOUND_URL} preload="auto"></audio>

      <AnimatePresence>
        {activeAlert && ( <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-lg"><div className="bg-[#0a0a0a] border-2 border-blue-600 p-5 rounded-2xl shadow-2xl flex items-start gap-4"><div className="bg-blue-600/10 p-3 rounded-xl text-blue-500"><Bell size={24}/></div><div className="flex-1"><h4 className="font-black text-blue-500 text-lg leading-tight mb-1">{activeAlert.title}</h4><p className="text-sm text-gray-300">{activeAlert.message}</p></div><button onClick={() => dismissMessage(activeAlert.id)} className="text-gray-500 hover:text-white transition-colors"><X size={20}/></button></div></motion.div> )}
      </AnimatePresence>

      <aside className="w-full md:w-64 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col gap-6 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white overflow-hidden border border-white/10 shrink-0" style={{backgroundColor: accentColor}}>{profileForm.logo_url ? <img src={profileForm.logo_url} className="w-full h-full object-cover"/> : store?.name.substring(0,2).toUpperCase()}</div><div className="min-w-0"><h2 className="font-bold leading-none text-white truncate">{profileForm.name || store?.name}</h2><span className="text-xs" style={{color: accentColor}}>Panel Admin</span></div></div>
        <nav className="flex flex-col gap-2 flex-1">{visibleTabs.map(tab => ( <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`p-3 rounded-xl flex gap-3 transition-all items-center ${activeTab===tab.id ? 'text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`} style={activeTab === tab.id ? {backgroundColor: accentColor + '33', color: accentColor} : {}}><div className="relative"><tab.icon size={20}/>{tab.id === 'inbox' && pendingAppointments.length > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0a0a]"></div>}</div><span>{tab.label}</span>{tab.id === 'inbox' && pendingAppointments.length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingAppointments.length}</span>}</button> ))}</nav>
        <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-2">
            <button onClick={toggleSound} className={`w-full p-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${isSoundEnabled ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{isSoundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>} {isSoundEnabled ? "Sonido ON" : "Sonido OFF"}</button>
            {isSoundEnabled && (
                <button onClick={playNotification} className="w-full p-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-gray-400 flex items-center justify-center gap-2">
                    <PlayCircle size={14}/> Probar Sonido
                </button>
            )}
            <button onClick={() => { localStorage.removeItem('rivapp_session'); navigate('/login'); }} className="w-full p-2 text-gray-500 text-sm flex justify-center gap-2 hover:text-white"><LogOut size={14}/> Salir</button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto h-screen bg-[#050505]">
        {activeTab === 'dashboard' && ( 
            <div className="space-y-6 animate-in fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><h1 className="text-3xl font-bold italic">Hola, {store?.name}</h1><p className="text-sm text-gray-500">Resumen de ventas.</p></div><div className="flex gap-2 w-full md:w-auto"><a href={`/${store?.slug}`} target="_blank" rel="noopener noreferrer" className="bg-[#1a1a1a] border border-white/10 text-white p-3 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 flex-1 md:flex-none justify-center group"><ExternalLink size={20} style={{color: accentColor}} className="group-hover:scale-110 transition-transform"/><span className="font-bold text-sm">Ver Local</span></a><button onClick={() => refreshAllData()} className="p-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-gray-400 hover:text-white"><RefreshCw size={20}/></button></div></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-[#111] p-6 rounded-3xl border border-white/5"><div className="flex justify-between items-center mb-4"><div className="p-3 rounded-2xl" style={{backgroundColor: accentColor + '22', color: accentColor}}><TrendingUp/></div><span className="text-xs font-bold text-gray-500 uppercase">Hoy</span></div><h3 className="text-gray-400 text-sm font-medium">Ingresos estimados</h3><div className="text-3xl font-bold">${stats.incomeToday}</div></div><div className="bg-[#111] p-6 rounded-3xl border border-white/5"><div className="flex justify-between items-center mb-4"><div className="p-3 bg-purple-600/10 rounded-2xl text-purple-500"><CalendarIcon/></div><span className="text-xs font-bold text-gray-500 uppercase">Hoy</span></div><h3 className="text-gray-400 text-sm font-medium">Turnos agendados</h3><div className="text-3xl font-bold">{stats.todayCount}</div></div><div className="bg-[#111] p-6 rounded-3xl border border-white/5"><div className="flex justify-between items-center mb-4"><div className="p-3 bg-green-600/10 rounded-2xl text-green-500"><Clock/></div><span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Próximo</span></div>{stats.nextApt ? (<div><div className="text-xl font-bold truncate">{stats.nextApt.customer_name}</div><div className="text-sm text-gray-500">{new Date(stats.nextApt.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • {stats.nextApt.services?.name}</div></div>) : <div className="text-gray-600 italic">Sin más turnos.</div>}</div></div>
                <div className="bg-[#111] p-8 rounded-3xl border border-white/5">
                    <h3 className="font-bold text-lg mb-8 flex items-center gap-2"><TrendingUp style={{color: accentColor}} size={18}/> Facturación Semanal</h3>
                    <div className="h-96 w-full"> 
                        <ResponsiveContainer width="100%" height="100%"><BarChart data={stats.chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#666', fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#666', fontSize:12}}/><Tooltip cursor={{fill: '#222'}} contentStyle={{backgroundColor:'#111', border:'1px solid #333', borderRadius:'12px'}}/><Bar dataKey="ingresos" fill={accentColor} radius={[6, 6, 0, 0]} barSize={40}/></BarChart></ResponsiveContainer>
                    </div>
                </div>
            </div> 
        )}
        
        {/* INBOX (Solicitudes) */}
        {activeTab === 'inbox' && (
             <div className="space-y-4">
                <h1 className="text-2xl font-bold">Solicitudes ({pendingAppointments.length})</h1>
                {pendingAppointments.map(apt => (
                    <div key={apt.id} className="bg-[#111] p-4 rounded-xl border border-yellow-500/30 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
                        <div className="pl-3"><h3 className="font-bold">{apt.customer_name}</h3><p className="text-gray-400 text-sm">{apt.services?.name} - {new Date(apt.start_time).toLocaleString()}</p></div>
                        <div className="flex gap-2">
                            <button onClick={(e)=>handleUpdateStatus(apt.id,'cancelado',e)} className="text-red-500 px-4 py-2 bg-red-500/10 rounded-lg hover:bg-red-500 hover:text-white transition-colors">Rechazar</button>
                            <button onClick={(e)=>handleUpdateStatus(apt.id,'confirmado',e)} className="text-black font-bold px-4 py-2 bg-green-500 rounded-lg hover:bg-green-400 transition-colors">Aceptar</button>
                        </div>
                    </div>
                ))}
                {pendingAppointments.length === 0 && <p className="text-gray-500 italic">No hay solicitudes pendientes.</p>}
             </div>
        )}

        {/* AGENDA - AQUÍ ESTÁ LA LÓGICA DE VISUALIZACIÓN DE PAGO 🟢 */}
        {activeTab === 'agenda' && ( 
            <div className="flex flex-col md:flex-row gap-8 h-full animate-in fade-in">
                <div className="w-full md:w-[400px] shrink-0 bg-[#111] p-6 rounded-3xl border border-white/5 h-fit"><header className="flex justify-between items-center mb-6"><button onClick={() => changeMonth(-1)}><ChevronLeft/></button><h2 className="font-bold capitalize">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h2><button onClick={() => changeMonth(1)}><ChevronRight/></button></header><div className="grid grid-cols-7 gap-2 text-center text-sm">{getDaysInMonth(currentDate).map((d, i) => d ? <button key={i} onClick={() => setSelectedDate(d)} className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-colors ${isSameDay(d, selectedDate) ? 'text-white' : 'hover:bg-white/5'}`} style={isSameDay(d, selectedDate) ? {backgroundColor: accentColor} : {}}>{d.getDate()}{getDailyLoad(d) > 0 && <div className="w-1 h-1 bg-white rounded-full mt-1"></div>}</button> : <div key={i}></div>)}</div></div>
                <div className="flex-1"><header className="mb-6 flex justify-between items-end"><h1 className="text-3xl font-bold">{selectedDate.toLocaleDateString()}</h1><button onClick={() => setShowManualModal(true)} className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-white" style={{backgroundColor: accentColor}}><Plus size={16}/> Agendar</button></header>
                    <div className="space-y-3">
                        {filteredAppointments.map(apt => ( 
                            <div key={apt.id} onClick={() => setCrmModal(apt)} className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 cursor-pointer transition-all group flex justify-between items-center relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1" style={{backgroundColor: apt.status==='confirmado' ? '#22c55e' : '#eab308'}}></div>
                                <div className="flex gap-4 items-center pl-3">
                                    <div className="text-center"><div className="text-lg font-bold">{new Date(apt.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div></div>
                                    <div><h3 className="font-bold text-lg">{apt.customer_name}</h3><p className="text-sm text-gray-400 flex items-center gap-2">{apt.services?.name} {apt.staff && <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] flex items-center gap-1"><UserCog size={10}/> {apt.staff.name}</span>}</p></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-green-500 font-bold">${apt.price_paid || apt.services?.price}</div>
                                        {apt.coupon_code && <div className="text-[10px] text-blue-400 bg-blue-500/10 px-1 rounded flex items-center justify-end gap-1"><Tag size={10}/> {apt.coupon_code}</div>}
                                        
                                        {/* 🟢 NUEVA LÓGICA DE ETIQUETA DE PAGO */}
                                        {apt.payment_status === 'paid' ? (
                                            <div className="text-[10px] text-black bg-green-500 px-2 py-0.5 rounded mt-1 font-bold flex items-center justify-end gap-1"><Check size={10}/> PAGADO</div>
                                        ) : apt.payment_method === 'mercadopago' ? (
                                            <div className="text-[10px] text-white bg-blue-600 px-2 py-0.5 rounded mt-1 font-bold">MERCADO PAGO</div>
                                        ) : null}

                                    </div>
                                    <button onClick={(e) => handleDeleteAppointment(apt.id, e)} className="p-3 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl text-red-500 transition-colors" title="Borrar Turno"><Trash2 size={18}/></button>
                                    <button onClick={(e) => sendReminder(apt, e)} className="p-3 bg-white/5 hover:bg-green-600 hover:text-white rounded-xl text-gray-400 transition-colors" title="Enviar recordatorio por WhatsApp"><Bell size={18}/></button>
                                </div>
                            </div> 
                        ))}
                    </div>
                </div>
            </div> 
        )}

        {/* ... Resto de tabs ... */}
        {activeTab === 'team' && ( <div className="animate-in fade-in"><header className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Nuestro Equipo</h1><button onClick={() => openStaffModal()} className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-white" style={{backgroundColor: accentColor}}><Plus size={20}/> Agregar</button></header><div className="grid grid-cols-1 md:grid-cols-4 gap-6">{staffList.map(member => (<div key={member.id} className="bg-[#111] p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center group relative hover:border-white/20 transition-all"><div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openStaffModal(member)} className="p-2 bg-white/10 rounded-lg hover:bg-white hover:text-black"><Edit size={16}/></button><button onClick={() => deleteStaff(member.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={16}/></button></div><div className="w-20 h-20 rounded-full bg-gray-800 mb-4 overflow-hidden border-2 border-white/10 group-hover:border-blue-500 transition-colors">{member.avatar_url ? <img src={member.avatar_url} className="w-full h-full object-cover"/> : <UserCog className="w-full h-full p-4 text-gray-500"/>}</div><h3 className="font-bold text-lg">{member.name}</h3><p className="text-sm" style={{color: accentColor}}>{member.role}</p></div>))}</div></div> )}
        {activeTab === 'servicios' && ( <div className="animate-in fade-in"><header className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Catálogo</h1><button onClick={() => openServiceModal()} className="px-6 py-3 rounded-xl font-bold flex gap-2 text-white" style={{backgroundColor: accentColor}}><Plus/> Nuevo</button></header><div className="grid grid-cols-3 gap-6">{services.map(s => (<div key={s.id} className="bg-[#111] p-6 rounded-2xl border border-white/5 relative group hover:border-white/20 transition-all"><div className="absolute top-4 right-4 flex gap-2"><button onClick={() => openServiceModal(s)} className="text-gray-600 hover:text-white transition-colors"><Edit size={18}/></button><button onClick={() => deleteService(s.id)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={18}/></button></div><h3 className="font-bold text-lg mb-1">{s.name}</h3><div className="flex items-center gap-4 text-sm text-gray-400 mt-4 border-t border-white/5 pt-4"><span style={{color: accentColor}} className="font-bold">${s.price}</span><span>{s.duration_minutes} min</span></div></div>))}</div></div> )}
        {activeTab === 'marketing' && ( <div className="animate-in fade-in"><header className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Cupones de Descuento</h1><button onClick={() => setShowCouponModal(true)} className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-white" style={{backgroundColor: accentColor}}><Plus size={20}/> Crear Cupón</button></header><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{coupons.map(c => (<div key={c.id} className="bg-[#111] p-6 rounded-2xl border border-dashed border-white/20 relative group hover:border-blue-500/50 transition-colors"><button onClick={() => deleteCoupon(c.id)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500"><Trash2 size={18}/></button><div className="text-xs font-bold mb-1 tracking-widest uppercase" style={{color: accentColor}}>CÓDIGO</div><h3 className="text-3xl font-bold text-white mb-2 font-mono">{c.code}</h3><div className="inline-block bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm font-bold">-{c.discount}% OFF</div></div>))}</div></div> )}
        {activeTab === 'billing' && ( <div className="animate-in fade-in max-w-4xl"><header className="mb-8"><h1 className="text-3xl font-bold">Suscripción Rivapp</h1></header>{(store.plan_type === 'pro' || store.plan_type === 'profesional' || store.subscription_status === 'active' || store.is_demo) ? ( <div className="bg-gradient-to-br from-blue-900/40 to-[#111] p-8 rounded-3xl border border-blue-500/50 relative overflow-hidden"><div className="relative z-10 flex justify-between items-center"><div><div className="flex items-center gap-3 mb-2"><h3 className="text-blue-400 text-sm font-bold uppercase tracking-widest">TU PLAN ACTUAL</h3><span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1"><Crown size={10}/> PRO</span></div><h2 className="text-5xl font-bold text-white mb-2">Profesional</h2></div><div className="text-right hidden md:block"><div className="text-3xl font-bold text-white">$40.000</div><div className="text-sm text-gray-500">/ mes</div></div></div></div> ) : ( <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="bg-[#111] p-8 rounded-3xl border border-white/10"><h3 className="text-gray-400 text-sm font-bold uppercase mb-2">TU PLAN ACTUAL</h3><h2 className="text-4xl font-bold text-white mb-6">Gratuito</h2><ul className="space-y-3 mb-8 text-gray-400 text-sm"><li className="flex items-center gap-2"><Check size={16}/> Gestión de Turnos Básica</li></ul></div><div className="p-1 rounded-3xl shadow-2xl" style={{background: `linear-gradient(to bottom right, ${accentColor}, #0a0a0a)`}}><div className="bg-[#0f0f0f] h-full w-full rounded-[22px] p-8"><h3 className="text-sm font-bold uppercase mb-2" style={{color: accentColor}}>PLAN PRO</h3><div className="flex items-end gap-2 mb-6"><h2 className="text-5xl font-bold text-white">$40.000</h2></div><button onClick={handleSubscribe} className="w-full py-4 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2" style={{backgroundColor: accentColor}}>Pasarme a PRO <ChevronRight size={18}/></button></div></div></div> )}</div> )}
        {activeTab === 'profile' && ( <div className="animate-in fade-in max-w-2xl pb-20"><header className="mb-8"><h1 className="text-3xl font-bold">Perfil del Negocio</h1></header><form onSubmit={handleSaveProfile} className="space-y-6"><div className="relative rounded-3xl overflow-hidden shadow-2xl group mb-8 bg-[#1a1a1a]"><div className="relative h-52 bg-gray-800">{profileForm.banner_url ? (<img src={profileForm.banner_url} className="w-full h-full object-cover opacity-80" />) : (<div className="w-full h-full flex items-center justify-center bg-[#222]"><ImageIcon className="text-white/10" size={64}/></div>)}<div className="absolute top-4 right-4"><label className="bg-black/50 hover:bg-black/80 text-white px-4 py-2 rounded-full cursor-pointer border border-white/10 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg"><Camera size={14}/><span className="text-xs font-bold">Editar Portada</span><input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'banner_url')}/></label></div></div><div className="h-20 bg-[#1a1a1a]"></div><div className="absolute top-36 left-8 z-10"><div className="w-32 h-32 rounded-full bg-white border-[6px] border-[#1a1a1a] overflow-hidden shadow-2xl relative group/logo flex items-center justify-center">{profileForm.logo_url ? (<img src={profileForm.logo_url} className="w-full h-full object-contain p-1"/>) : (<div className="w-full h-full bg-[#222] flex items-center justify-center text-gray-600"><Store size={40}/></div>)}<label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer rounded-full font-bold text-xs text-white"><Upload size={24}/><input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo_url')}/></label></div></div></div><div className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-6 shadow-xl"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Nombre</label><input className="w-full bg-[#1a1a1a] border border-white/10 p-4 rounded-xl text-white outline-none focus:border-blue-600" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})}/></div><div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase">WhatsApp</label><input className="w-full bg-[#1a1a1a] border border-white/10 p-4 rounded-xl text-white outline-none focus:border-blue-600" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})}/></div></div><div className="pt-4 border-t border-white/10"><label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Color de Acento (Botones y Detalles)</label><div className="flex items-center gap-4 bg-[#1a1a1a] p-4 rounded-2xl border border-white/10"><input type="color" className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none" value={profileForm.color_accent} onChange={e => setProfileForm({...profileForm, color_accent: e.target.value})}/><div className="flex-1"><div className="text-sm font-mono text-white uppercase">{profileForm.color_accent}</div><div className="text-[10px] text-gray-500">Este color se aplicará a tu página pública y al panel.</div></div><div className="w-10 h-10 rounded-full shadow-lg" style={{backgroundColor: profileForm.color_accent}}></div></div></div><div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Dirección</label><div className="flex items-center gap-3 bg-[#1a1a1a] border border-white/10 p-4 rounded-xl focus-within:border-blue-600"><MapPin size={20} className="text-gray-500"/><input className="w-full bg-transparent text-white outline-none" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})}/></div></div><div className="pt-4 border-t border-white/10 flex justify-between items-center"><div><h4 className="font-bold flex items-center gap-2"><Users size={18}/> Selección de Equipo</h4><p className="text-xs text-gray-500">Cliente elige profesional.</p></div><button type="button" onClick={()=>setProfileForm(p=>({...p,enable_staff_selection:!p.enable_staff_selection}))} style={{color: profileForm.enable_staff_selection ? accentColor : '#444'}}>{profileForm.enable_staff_selection?<ToggleRight size={40}/>:<ToggleLeft size={40}/>}</button></div><div className="pt-4 border-t border-white/10"><div className="flex justify-between items-center mb-4"><div><h4 className="font-bold flex items-center gap-2 text-blue-400"><CreditCard size={18}/> Cobros Online</h4><p className="text-xs text-gray-500">Habilitar Mercado Pago.</p></div><button type="button" onClick={()=>setProfileForm(p=>({...p,enable_payments:!p.enable_payments}))} style={{color: profileForm.enable_payments ? accentColor : '#444'}}>{profileForm.enable_payments?<ToggleRight size={40}/>:<ToggleLeft size={40}/>}</button></div>{profileForm.enable_payments && ( <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 bg-blue-900/10 p-4 rounded-xl border border-blue-500/20"><p className="text-xs text-gray-400">Credenciales de Producción (para cobrar dinero real)</p><div><label className="text-xs text-gray-500 font-bold uppercase">Access Token</label><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1" type="password" placeholder="APP_USR-..." value={profileForm.mp_access_token} onChange={e=>setProfileForm({...profileForm, mp_access_token: e.target.value})}/></div><div><label className="text-xs text-gray-500 font-bold uppercase">Public Key</label><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1" placeholder="TEST-..." value={profileForm.mp_public_key} onChange={e=>setProfileForm({...profileForm, mp_public_key: e.target.value})}/></div></motion.div> )}</div></div><div className="flex justify-end pt-4"><button type="submit" className="px-8 py-4 rounded-xl font-bold text-white flex gap-2 shadow-lg hover:scale-105 transition-transform" style={{backgroundColor: accentColor}}><Save size={20}/> Guardar</button></div></form></div> )}
        {activeTab === 'config' && ( <div className="animate-in fade-in max-w-2xl"><header className="flex justify-between mb-8"><h1 className="text-3xl font-bold">Horarios</h1><button onClick={handleSaveSchedule} className="bg-green-600 px-6 py-3 rounded-xl font-bold flex gap-2 text-white"><Save/> Guardar</button></header><div className="bg-[#111] p-6 rounded-3xl border border-white/5 mb-6"><div className="flex justify-between items-center mb-4"><div><label className="text-white font-bold flex items-center gap-2"><Users size={18} style={{color: accentColor}}/> Cupos Simultáneos</label><p className="text-xs text-gray-500 mt-1">Permite que varias personas reserven el mismo horario.</p></div><div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-400">{slotsConfig.enable_multislots ? "ACTIVADO" : "DESACTIVADO"}</span><button type="button" onClick={() => setSlotsConfig({...slotsConfig, enable_multislots: !slotsConfig.enable_multislots})} className={`w-12 h-6 rounded-full p-1 transition-colors ${slotsConfig.enable_multislots ? 'bg-green-600' : 'bg-gray-700'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${slotsConfig.enable_multislots ? 'translate-x-6' : 'translate-x-0'}`} /></button></div></div><AnimatePresence>{slotsConfig.enable_multislots && ( <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="bg-black/30 p-4 rounded-xl border border-white/5"><label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Cantidad de Cupos por Horario</label><div className="flex items-center gap-4"><input type="number" min="1" className="w-full bg-[#1a1a1a] border border-white/10 p-3 rounded-xl text-white font-bold text-lg focus:outline-none" style={{borderColor: accentColor}} value={slotsConfig.max_concurrent_slots} onChange={e => setSlotsConfig({...slotsConfig, max_concurrent_slots: parseInt(e.target.value)})}/><div className="text-xs text-gray-500 w-1/2">Ej: Si tienes <strong>{slotsConfig.max_concurrent_slots} barberos</strong>, pon "{slotsConfig.max_concurrent_slots}".</div></div></div></motion.div> )}</AnimatePresence></div><div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden mt-6">{schedules.map((day,i)=>( <div key={i} className="flex justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"><div className="flex items-center gap-4 w-32"><input type="checkbox" checked={!day.is_closed} onChange={e=>{const n=[...schedules];n[i].is_closed=!e.target.checked;setSchedules(n)}} style={{accentColor: accentColor}} className="w-5 h-5"/><span className={`font-bold ${day.is_closed?'text-gray-600':'text-white'}`}>{DAYS[day.day_of_week]}</span></div><div className={`flex gap-4 items-center ${day.is_closed?'opacity-20':''}`}><div className="flex items-center gap-2 bg-black border border-white/10 px-3 py-1 rounded-lg"><span className="text-xs text-gray-500 font-bold">ABRE</span><input type="time" className="bg-transparent text-white outline-none" value={day.open_time} onChange={e=>{const n=[...schedules];n[i].open_time=e.target.value;setSchedules(n)}}/></div><div className="flex items-center gap-2 bg-black border border-white/10 px-3 py-1 rounded-lg"><span className="text-xs text-gray-500 font-bold">CIERRA</span><input type="time" className="bg-transparent text-white outline-none" value={day.close_time} onChange={e=>{const n=[...schedules];n[i].close_time=e.target.value;setSchedules(n)}}/></div></div></div> ))}</div></div> )}

      </main>

      {/* MODALES */}
      {showServiceModal && <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in"><div className="bg-[#161616] p-8 rounded-3xl w-full max-w-md border border-white/10"><h3 className="text-2xl font-bold mb-6">{editingService ? "Editar Servicio" : "Crear Servicio"}</h3><form onSubmit={handleSaveService} className="space-y-4"><div><label className="text-xs font-bold text-gray-500">NOMBRE</label><input className="w-full bg-black border border-white/10 p-3 rounded-xl text-white" value={newService.name} onChange={e=>setNewService({...newService,name:e.target.value})} autoFocus/></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500">PRECIO</label><input type="number" className="w-full bg-black border border-white/10 p-3 rounded-xl text-white" value={newService.price} onChange={e=>setNewService({...newService,price:e.target.value})}/></div><div><label className="text-xs font-bold text-gray-500">MINUTOS</label><input type="number" className="w-full bg-black border border-white/10 p-3 rounded-xl text-white" value={newService.duration} onChange={e=>setNewService({...newService,duration:e.target.value})}/></div></div><div className="flex gap-3 mt-6"><button type="button" onClick={()=>setShowServiceModal(false)} className="flex-1 bg-white/5 py-3 rounded-xl text-white">Cancelar</button><button type="submit" className="flex-1 py-3 rounded-xl text-white font-bold" style={{backgroundColor: accentColor}}>Guardar</button></div></form></div></div>}
      
      {showStaffModal && <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in"><div className="bg-[#161616] p-8 rounded-3xl w-full max-w-md border border-white/10"><h3 className="text-2xl font-bold mb-6">{editingStaff ? "Editar Miembro" : "Nuevo Miembro"}</h3><form onSubmit={handleSaveStaff} className="space-y-4"><div className="flex justify-center mb-6"><label className="w-24 h-24 rounded-full bg-gray-800 flex justify-center items-center cursor-pointer border-2 border-dashed border-gray-600 hover:border-blue-500 overflow-hidden">{newStaff.avatar_url?<img src={newStaff.avatar_url} className="w-full h-full object-cover"/>:<Camera size={24} className="text-gray-500"/>}<input type="file" className="hidden" onChange={(e)=>handleFileChange(e,'avatar_url',setNewStaff)}/></label></div><input className="w-full bg-black border border-white/10 p-3 rounded-xl text-white" placeholder="Nombre" value={newStaff.name} onChange={e=>setNewStaff({...newStaff,name:e.target.value})} required/><input className="w-full bg-black border border-white/10 p-3 rounded-xl text-white" placeholder="Rol" value={newStaff.role} onChange={e=>setNewStaff({...newStaff,role:e.target.value})} required/><div className="flex gap-3 mt-6"><button type="button" onClick={()=>setShowStaffModal(false)} className="flex-1 bg-white/5 py-3 rounded-xl text-white">Cancelar</button><button type="submit" className="flex-1 py-3 rounded-xl text-white font-bold" style={{backgroundColor: accentColor}}>Guardar</button></div></form></div></div>}
      
      {showManualModal && <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"><div className="bg-[#161616] p-8 rounded-3xl w-full max-w-md border border-white/10"><h3 className="text-2xl font-bold mb-6">Agendar Turno</h3><form onSubmit={handleManualBooking} className="space-y-4"><input className="w-full bg-black border border-white/10 p-3 rounded-xl text-white" placeholder="Cliente" value={manualApt.customer_name} onChange={e=>setManualApt({...manualApt,customer_name:e.target.value})} required/><input className="w-full bg-black border border-white/10 p-3 rounded-xl text-white" placeholder="Teléfono" value={manualApt.customer_phone} onChange={e=>setManualApt({...manualApt,customer_phone:e.target.value})}/><select className="w-full bg-black border border-white/10 p-3 rounded-xl text-white" value={manualApt.service_id} onChange={e=>setManualApt({...manualApt,service_id:e.target.value})} required><option value="">Servicio...</option>{services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><select className="w-full bg-black border border-white/10 p-3 rounded-xl text-white" value={manualApt.staff_id} onChange={e=>setManualApt({...manualApt,staff_id:e.target.value})}><option value="">Cualquiera...</option>{staffList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><div className="grid grid-cols-2 gap-4"><input type="date" className="bg-black border border-white/10 p-3 rounded-xl text-white" value={manualApt.date} onChange={e=>setManualApt({...manualApt,date:e.target.value})} required/><input type="time" className="bg-black border border-white/10 p-3 rounded-xl text-white" value={manualApt.time} onChange={e=>setManualApt({...manualApt,time:e.target.value})} required/></div><div className="flex gap-3 mt-6"><button type="button" onClick={()=>setShowManualModal(false)} className="flex-1 bg-white/5 py-3 rounded-xl text-white">Cancelar</button><button type="submit" className="flex-1 py-3 rounded-xl text-white font-bold" style={{backgroundColor: accentColor}}>Confirmar</button></div></form></div></div>}
      
      {showCouponModal && <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"><div className="bg-[#161616] p-8 rounded-3xl w-full max-w-md border border-white/10"><h3 className="text-2xl font-bold mb-6">Crear Cupón</h3><form onSubmit={handleCreateCoupon} className="space-y-4"><div><label className="text-xs font-bold text-gray-500">CÓDIGO (Ej: VERANO)</label><input className="w-full bg-black border border-white/10 p-3 rounded-xl text-white uppercase font-mono" value={newCoupon.code} onChange={e=>setNewCoupon({...newCoupon,code:e.target.value})} autoFocus required/></div><div><label className="text-xs font-bold text-gray-500">% DESCUENTO</label><input type="number" className="w-full bg-black border border-white/10 p-3 rounded-xl text-white" value={newCoupon.discount} onChange={e=>setNewCoupon({...newCoupon,discount:e.target.value})} required/></div><div className="flex gap-3 mt-6"><button type="button" onClick={()=>setShowCouponModal(false)} className="flex-1 bg-white/5 py-3 rounded-xl text-white">Cancelar</button><button type="submit" className="flex-1 py-3 rounded-xl text-white font-bold" style={{backgroundColor: accentColor}}>Crear</button></div></form></div></div>}
      
      {/* 🟢 MODAL CRM ACTUALIZADO CON INFO DE PAGO */}
      {crmModal && <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"><div className="bg-[#161616] w-full max-w-2xl rounded-3xl border border-white/10 p-6"><h2 className="text-2xl font-bold mb-4">{crmModal.customer_name}</h2>
      
        {/* INFO DE PAGO */}
        <div className="mb-4 bg-[#1a1a1a] p-3 rounded-xl border border-white/5 flex justify-between items-center">
             <span className="text-gray-400 text-sm">Estado del Pago</span>
             <span className={`font-bold ${crmModal.payment_status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                 {crmModal.payment_status === 'paid' ? 'PAGADO ✅' : 'PENDIENTE'}
             </span>
        </div>
        {crmModal.payment_id && (
             <div className="text-xs text-gray-500 mb-4 text-right">Referencia MP: {crmModal.payment_id}</div>
        )}

      <textarea className="w-full bg-[#0a0a0a] p-4 rounded-xl text-white resize-none h-32 outline-none border border-white/10" placeholder="Notas internas..." defaultValue={crmModal.internal_notes} onBlur={(e) => saveInternalNote(crmModal.id, e.target.value)}/><div className="mt-4"><h3 className="font-bold mb-2 text-gray-500">Historial</h3>{getClientHistory(crmModal.customer_phone).map(h => <div key={h.id} className="text-sm border-b border-white/5 py-2 flex justify-between"><span>{new Date(h.start_time).toLocaleDateString()} - {h.services?.name}</span><span className="text-green-500">${h.price_paid || h.services?.price}</span></div>)}</div><button onClick={() => setCrmModal(null)} className="mt-6 w-full bg-white/10 py-3 rounded-xl font-bold">Cerrar</button></div></div>}
    </div>
  );
}