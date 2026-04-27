import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useStore } from '../context/useStore';
import { useEntitlements } from '../hooks/useEntitlements';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import {
  LayoutDashboard, Calendar as CalendarIcon, Clock, Settings, Plus, Trash2,
  Briefcase, ExternalLink, ChevronLeft, ChevronRight, Users, RefreshCw, Loader2,
  TrendingUp, Store, Save, MapPin, Image as ImageIcon, Upload, Camera, UserCog,
  ToggleLeft, ToggleRight, Tag, Bell, CreditCard, Crown, Check, X, Edit, Volume2,
  VolumeX, LogOut, Inbox, PlayCircle, Menu as MenuIcon,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationPanel from '../components/admin/NotificationPanel';
import NotificationToast from '../components/admin/NotificationToast';
import { useNotifications, NOTIFICATION_TAB_MAP } from '../hooks/useNotifications';
import Button from '../components/shared/ui/Button';
import Eyebrow from '../components/shared/ui/Eyebrow';
import Rule from '../components/shared/ui/Rule';

const BELL_SOUND_URL = '/sounds/ding.mp3';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

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
  { id: 'profile', label: 'Mi negocio', icon: Store },
  { id: 'billing', label: 'Suscripción', icon: CreditCard },
  { id: 'config', label: 'Horarios', icon: Settings },
];

function StatCard({ label, value, hint, icon: Icon, accent = 'acid' }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            accent === 'acid' ? 'bg-acid/10 text-acid' : 'bg-ml/10 text-ml-soft'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <Eyebrow>{hint}</Eyebrow>
      </div>
      <p className="mono mt-5 text-[11px] uppercase tracking-[0.22em] text-text-subtle">{label}</p>
      <p className="display num mt-2 text-4xl text-text">{value}</p>
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm anim-fade">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 shadow-[var(--shadow-editorial)]">
        <div className="flex items-center justify-between border-b border-rule p-6">
          <Eyebrow>Formulario</Eyebrow>
          <button
            onClick={onClose}
            className="rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {title && <h3 className="display px-6 pt-6 text-3xl text-text">{title}</h3>}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function AdminInput({ label, ...props }) {
  return (
    <div>
      {label && <label className="eyebrow mb-2 block">{label}</label>}
      <input
        className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text placeholder:text-text-subtle focus:border-text focus:outline-none"
        {...props}
      />
    </div>
  );
}

export default function AdminServices() {
  const { store } = useStore();
  const { features, canAccessAdmin } = useEntitlements(store);
  const navigate = useNavigate();
  const {
    notifications: storeNotifications,
    unreadCount,
    toasts,
    dismissToast,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll: clearAllNotifications,
  } = useNotifications(store?.id, { soundEnabled: false });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [, setUploading] = useState(false);
  const [flash, setFlash] = useState(false);

  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);

  useEffect(() => {
    soundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  const isFirstLoad = useRef(true);
  const prevAppointmentsCount = useRef(0);

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    logo_url: '',
    banner_url: '',
    color_accent: '#2563eb',
    enable_staff_selection: true,
    enable_payments: false,
    mp_public_key: '',
    mp_access_token: '',
  });
  const [slotsConfig, setSlotsConfig] = useState({ enable_multislots: false, max_concurrent_slots: 1 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [crmModal, setCrmModal] = useState(null);

  const [newService, setNewService] = useState({ name: '', price: '', duration: 30 });
  const [newStaff, setNewStaff] = useState({ name: '', role: '', avatar_url: '' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: 10 });
  const [manualApt, setManualApt] = useState({
    customer_name: '',
    customer_phone: '',
    service_id: '',
    staff_id: '',
    date: '',
    time: '',
  });
  const [editingService, setEditingService] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);

  const [, setGlobalNotifications] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [dismissedMessages, setDismissedMessages] = useState(() => {
    const saved = localStorage.getItem('rivapp_dismissed_turnos_msgs');
    return saved ? JSON.parse(saved) : [];
  });

  const accentColor = store?.color_accent || '#D0FF00';

  const playAudioElement = useCallback(() => {
    const audio = document.getElementById('notification-audio');
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => logger.warn('Audio bloqueado. Interactuá con la página primero.'));
    }
  }, []);

  const toggleSound = useCallback(() => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    soundEnabledRef.current = newState;
    if (newState) playAudioElement();
  }, [isSoundEnabled, playAudioElement]);

  const playNotification = useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 1000);
    if (soundEnabledRef.current) {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      playAudioElement();
    }
  }, [playAudioElement]);

  const fetchAppointments = useCallback(async () => {
    if (!store?.id) return;

    const { data } = await supabase
      .from('appointments')
      .select('*, services(name, duration_minutes, price), staff(name)')
      .eq('store_id', store.id)
      .order('start_time', { ascending: true });

    if (data) {
      setAppointments(data);
      const currentCount = data.filter((a) => a.status === 'pendiente').length;

      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        prevAppointmentsCount.current = currentCount;
      } else if (currentCount > prevAppointmentsCount.current) {
        playNotification();
      }
      prevAppointmentsCount.current = currentCount;
    }
  }, [playNotification, store]);

  const fetchServices = useCallback(async () => {
    if (!store?.id) return;
    const { data } = await supabase.from('services').select('*').eq('store_id', store.id).order('name');
    if (data) setServices(data);
  }, [store]);

  const fetchStaff = useCallback(async () => {
    if (!store?.id) return;
    const { data } = await supabase.from('staff').select('*').eq('store_id', store.id).eq('active', true);
    if (data) setStaffList(data);
  }, [store]);

  const fetchSchedules = useCallback(async () => {
    if (!store?.id) return;
    const { data } = await supabase
      .from('store_schedules')
      .select('*')
      .eq('store_id', store.id)
      .order('day_of_week');
    if (!data || data.length === 0) {
      setSchedules(
        DAYS.map((_, index) => ({
          day_of_week: index,
          open_time: '09:00:00',
          close_time: '20:00:00',
          is_closed: index === 0,
        }))
      );
    } else {
      setSchedules(data);
    }
  }, [store]);

  const fetchCoupons = useCallback(async () => {
    if (!store?.id) return;
    const { data } = await supabase.from('coupons').select('*').eq('store_id', store.id).eq('active', true);
    if (data) setCoupons(data);
  }, [store]);

  const fetchGlobalNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('global_notifications')
      .select('*')
      .eq('is_active', true)
      .or('target.eq.all,target.eq.turnos')
      .order('created_at', { ascending: false });
    if (data && data.length > 0) {
      const filtered = data.filter((n) => !dismissedMessages.includes(n.id));
      setGlobalNotifications(filtered);
      if (filtered.length > 0) setActiveAlert(filtered[0]);
    }
  }, [dismissedMessages]);

  const refreshAllData = useCallback(() => {
    void fetchServices();
    void fetchStaff();
    void fetchAppointments();
    void fetchSchedules();
    void fetchCoupons();
  }, [fetchAppointments, fetchCoupons, fetchSchedules, fetchServices, fetchStaff]);

  const dismissMessage = useCallback(
    (id) => {
      const updated = [...dismissedMessages, id];
      setDismissedMessages(updated);
      localStorage.setItem('rivapp_dismissed_turnos_msgs', JSON.stringify(updated));
      setGlobalNotifications((prev) => prev.filter((n) => n.id !== id));
      if (activeAlert?.id === id) setActiveAlert(null);
    },
    [activeAlert, dismissedMessages]
  );

  useEffect(() => {
    if (!store) return;

    const syncStoreStateTimeout = window.setTimeout(() => {
      setProfileForm({
        name: store.name || '',
        phone: store.phone || '',
        address: store.address || '',
        logo_url: store.logo_url || '',
        banner_url: store.banner_url || '',
        color_accent: store.color_accent || '#2563eb',
        enable_staff_selection: store.enable_staff_selection ?? true,
        enable_payments: store.enable_payments ?? false,
        mp_public_key: store.mp_public_key || '',
        mp_access_token: store.mp_access_token || '',
      });
      setSlotsConfig({
        enable_multislots: store.enable_multislots || false,
        max_concurrent_slots: store.max_concurrent_slots || 1,
      });
    }, 0);

    const initialLoadTimeout = window.setTimeout(() => {
      refreshAllData();
      void fetchGlobalNotifications();
    }, 0);

    const channel = supabase
      .channel('admin_services_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `store_id=eq.${store.id}` },
        (payload) => {
          void fetchAppointments();
          if (payload.eventType === 'INSERT') playNotification();
        }
      )
      .subscribe();

    return () => {
      window.clearTimeout(syncStoreStateTimeout);
      window.clearTimeout(initialLoadTimeout);
      supabase.removeChannel(channel);
    };
  }, [fetchAppointments, fetchGlobalNotifications, playNotification, refreshAllData, store]);

  const pendingAppointments = useMemo(
    () => appointments.filter((a) => a.status === 'pendiente'),
    [appointments]
  );
  const filteredAppointments = useMemo(
    () =>
      appointments.filter(
        (a) => isSameDay(new Date(a.start_time), selectedDate) && a.status === 'confirmado'
      ),
    [appointments, selectedDate]
  );

  const stats = useMemo(() => {
    const today = new Date();
    const todayApts = appointments.filter((a) => isSameDay(new Date(a.start_time), today));
    const incomeToday = todayApts
      .filter((a) => a.status === 'confirmado')
      .reduce((sum, a) => sum + (a.price_paid || a.services?.price || 0), 0);
    const nextApt = appointments.find(
      (a) => new Date(a.start_time) > new Date() && a.status === 'confirmado'
    );
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dailyIncome = appointments
        .filter((a) => isSameDay(new Date(a.start_time), d) && a.status === 'confirmado')
        .reduce((sum, a) => sum + (a.price_paid || a.services?.price || 0), 0);
      chartData.push({
        name: d.toLocaleDateString('es-AR', { weekday: 'short' }),
        ingresos: dailyIncome,
      });
    }
    return { todayCount: todayApts.length, incomeToday, nextApt, chartData };
  }, [appointments]);

  const visibleTabs = useMemo(() => {
    if (!store) return [];
    if (features.hasProTabs) return ALL_TABS;
    return ALL_TABS.filter((tab) => !tab.proOnly);
  }, [features, store]);

  const handleUpdateStatus = async (id, newStatus, e) => {
    if (e) e.stopPropagation();
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    await supabase.from('appointments').update({ status: newStatus }).eq('id', id).eq('store_id', store.id);
    fetchAppointments();
  };

  const handleDeleteAppointment = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('¿Borrar turno permanentemente?')) return;
    await supabase.from('appointments').delete().eq('id', id).eq('store_id', store.id);
    fetchAppointments();
    if (crmModal?.id === id) setCrmModal(null);
  };

  const sendReminder = (apt, e) => {
    if (e) e.stopPropagation();
    const dateStr = new Date(apt.start_time).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const text = `Hola *${apt.customer_name}*! 👋\nTe escribo de *${store.name}* para recordarte tu turno:\n\n✂️ ${apt.services?.name}\n📅 ${dateStr} hs\n\nPor favor confirmame si vas a poder asistir. ¡Gracias!`;
    window.open(`https://wa.me/${apt.customer_phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await supabase
      .from('stores')
      .update({
        name: profileForm.name,
        phone: profileForm.phone,
        address: profileForm.address,
        logo_url: profileForm.logo_url,
        banner_url: profileForm.banner_url,
        color_accent: profileForm.color_accent,
        enable_staff_selection: profileForm.enable_staff_selection,
        enable_payments: profileForm.enable_payments,
      })
      .eq('id', store.id);
    alert('Perfil guardado');
  };

  const handleSaveSchedule = async () => {
    const upserts = schedules.map((s) => ({
      store_id: store.id,
      day_of_week: s.day_of_week,
      open_time: s.open_time,
      close_time: s.close_time,
      is_closed: s.is_closed,
    }));
    await supabase.from('store_schedules').upsert(upserts, { onConflict: 'store_id, day_of_week' });
    await supabase
      .from('stores')
      .update({
        enable_multislots: slotsConfig.enable_multislots,
        max_concurrent_slots: slotsConfig.max_concurrent_slots,
      })
      .eq('id', store.id);
    alert('Configuración guardada ✅');
  };

  const handleFileChange = async (e, f, setter = setProfileForm) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const name = `${store.id}/${Date.now()}.${ext}`;
      await supabase.storage.from('store-assets').upload(name, file);
      const { data } = supabase.storage.from('store-assets').getPublicUrl(name);
      if (f === 'avatar_url') setter((p) => ({ ...p, avatar_url: data.publicUrl }));
      else setter((p) => ({ ...p, [f]: data.publicUrl }));
    } catch (e) {
      alert(e.message);
    }
    setUploading(false);
  };

  const openServiceModal = (s = null) => {
    setEditingService(s);
    setNewService(s ? { name: s.name, price: s.price, duration: s.duration_minutes } : { name: '', price: '', duration: 30 });
    setShowServiceModal(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (editingService)
      await supabase
        .from('services')
        .update({ name: newService.name, price: newService.price, duration_minutes: newService.duration })
        .eq('id', editingService.id)
        .eq('store_id', store.id);
    else
      await supabase.from('services').insert([
        {
          store_id: store.id,
          name: newService.name,
          price: newService.price,
          duration_minutes: newService.duration,
          active: true,
        },
      ]);
    setShowServiceModal(false);
    fetchServices();
  };

  const deleteService = async (id) => {
    if (confirm('¿Borrar?')) {
      await supabase.from('services').delete().eq('id', id).eq('store_id', store.id);
      fetchServices();
    }
  };

  const openStaffModal = (s = null) => {
    setEditingStaff(s);
    setNewStaff(s ? { name: s.name, role: s.role, avatar_url: s.avatar_url } : { name: '', role: '', avatar_url: '' });
    setShowStaffModal(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (editingStaff)
      await supabase
        .from('staff')
        .update({ name: newStaff.name, role: newStaff.role, avatar_url: newStaff.avatar_url })
        .eq('id', editingStaff.id)
        .eq('store_id', store.id);
    else await supabase.from('staff').insert([{ store_id: store.id, ...newStaff }]);
    setShowStaffModal(false);
    fetchStaff();
  };

  const deleteStaff = async (id) => {
    if (confirm('¿Borrar?')) {
      await supabase.from('staff').update({ active: false }).eq('id', id).eq('store_id', store.id);
      fetchStaff();
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    await supabase.from('coupons').insert([
      { store_id: store.id, code: newCoupon.code.toUpperCase(), discount: newCoupon.discount, active: true },
    ]);
    setShowCouponModal(false);
    setNewCoupon({ code: '', discount: 10 });
    fetchCoupons();
  };

  const deleteCoupon = async (id) => {
    if (confirm('¿Borrar?')) {
      await supabase.from('coupons').update({ active: false }).eq('id', id).eq('store_id', store.id);
      fetchCoupons();
    }
  };

  const handleManualBooking = async (e) => {
    e.preventDefault();
    const srv = services.find((s) => s.id === parseInt(manualApt.service_id));
    const start = `${manualApt.date}T${manualApt.time}:00`;
    const end = new Date(new Date(start).getTime() + srv.duration_minutes * 60000).toISOString();
    await supabase.from('appointments').insert([
      {
        store_id: store.id,
        service_id: srv.id,
        staff_id: manualApt.staff_id || null,
        customer_name: manualApt.customer_name,
        customer_phone: manualApt.customer_phone,
        start_time: new Date(start).toISOString(),
        end_time: end,
        status: 'confirmado',
        price_paid: srv.price,
      },
    ]);
    setShowManualModal(false);
    fetchAppointments();
    alert('Turno creado');
  };

  const handleSubscribe = async () => {};

  const getDaysInMonth = (date) => {
    const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const first = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const arr = Array(first).fill(null);
    for (let i = 1; i <= days; i++) arr.push(new Date(date.getFullYear(), date.getMonth(), i));
    return arr;
  };

  const changeMonth = (off) => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + off)));
  const getDailyLoad = (d) =>
    d ? appointments.filter((a) => isSameDay(new Date(a.start_time), d) && a.status === 'confirmado').length : 0;
  const getClientHistory = (ph) =>
    appointments
      .filter((a) => a.customer_phone === ph && new Date(a.start_time) < new Date())
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  const saveInternalNote = async (id, note) => {
    await supabase.from('appointments').update({ internal_notes: note }).eq('id', id).eq('store_id', store.id);
    fetchAppointments();
  };

  if (!store)
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="h-10 w-10 animate-spin text-acid" />
      </div>
    );
  if (!canAccessAdmin)
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink p-6 text-center text-text">
        <div>
          <Eyebrow className="justify-center">Suscripción</Eyebrow>
          <h2 className="display mt-3 text-4xl">
            Suscripción <em className="display-italic text-signal">vencida</em>
          </h2>
        </div>
      </div>
    );

  return (
    <div className={`relative flex min-h-screen flex-col bg-ink text-text md:flex-row ${flash ? 'bg-ml/10' : ''} transition-colors duration-200`}>
      <audio id="notification-audio" src={BELL_SOUND_URL} preload="auto"></audio>

      <NotificationToast
        toasts={toasts}
        onDismiss={dismissToast}
        onClickToast={(toast) => {
          const tab = NOTIFICATION_TAB_MAP[toast.type];
          if (tab) setActiveTab(tab);
          markAsRead(toast.id);
        }}
      />

      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed left-1/2 top-0 z-[200] w-[90%] max-w-lg -translate-x-1/2"
          >
            <div className="flex items-start gap-4 rounded-[var(--radius-xl)] border border-ml/50 bg-ink-2 p-5 shadow-[var(--shadow-editorial)]">
              <div className="rounded-[var(--radius-sm)] bg-ml/10 p-3 text-ml-soft">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Eyebrow>Aviso</Eyebrow>
                <h4 className="display mt-1 text-xl text-text">{activeAlert.title}</h4>
                <p className="mt-2 text-sm text-text-muted">{activeAlert.message}</p>
              </div>
              <button
                onClick={() => dismissMessage(activeAlert.id)}
                className="rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col gap-6 overflow-y-auto border-r border-rule bg-ink-2 p-6 md:flex">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-rule text-ink-text"
            style={{ backgroundColor: accentColor }}
          >
            {profileForm.logo_url ? (
              <img src={profileForm.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="display text-sm font-semibold">
                {store?.name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="display truncate text-lg text-text">{profileForm.name || store?.name}</h2>
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">Panel admin</p>
          </div>
        </div>

        <Rule />

        <nav className="flex flex-1 flex-col gap-1">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/5 text-text'
                    : 'text-text-muted hover:bg-white/[0.02] hover:text-text'
                }`}
                style={isActive ? { color: accentColor } : {}}
              >
                <div className="relative">
                  <tab.icon className="h-4 w-4" />
                  {tab.id === 'inbox' && pendingAppointments.length > 0 && (
                    <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-ink-2 bg-signal" />
                  )}
                </div>
                <span>{tab.label}</span>
                {tab.id === 'inbox' && pendingAppointments.length > 0 && (
                  <span
                    className="num ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold text-ink"
                    style={{ backgroundColor: accentColor }}
                  >
                    {pendingAppointments.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <Rule />

        <div className="flex flex-col gap-2">
          <button
            onClick={toggleSound}
            className={`mono flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] py-2 text-[11px] uppercase tracking-[0.2em] ${
              isSoundEnabled ? 'bg-acid/10 text-acid' : 'bg-signal/10 text-signal-soft'
            }`}
          >
            {isSoundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            Sonido {isSoundEnabled ? 'on' : 'off'}
          </button>
          {isSoundEnabled && (
            <button
              onClick={playNotification}
              className="mono flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-white/5 py-2 text-[10px] uppercase tracking-[0.2em] text-text-muted hover:bg-white/10"
            >
              <PlayCircle className="h-3.5 w-3.5" /> Probar
            </button>
          )}
          <button
            onClick={() => {
              localStorage.removeItem('rivapp_session');
              navigate('/login');
            }}
            className="mono flex w-full items-center justify-center gap-2 py-2 text-[11px] uppercase tracking-[0.22em] text-text-subtle hover:text-text"
          >
            <LogOut className="h-3.5 w-3.5" /> Salir
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-rule bg-ink-2/95 p-2 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
      >
        {visibleTabs.slice(0, 4).map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="relative flex flex-col items-center p-2"
              style={{ color: isActive ? accentColor : 'var(--color-text-subtle)' }}
            >
              <t.icon className="h-5 w-5" />
              {t.id === 'inbox' && pendingAppointments.length > 0 && (
                <span
                  className="num absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold text-ink"
                  style={{ backgroundColor: accentColor }}
                >
                  {pendingAppointments.length}
                </span>
              )}
              <span className="mono mt-1 text-[9px] uppercase tracking-[0.2em]">{t.label}</span>
            </button>
          );
        })}
        {visibleTabs.length > 4 && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center p-2"
            style={{
              color: visibleTabs.slice(4).some((t) => t.id === activeTab)
                ? accentColor
                : 'var(--color-text-subtle)',
            }}
          >
            <MenuIcon className="h-5 w-5" />
            <span className="mono mt-1 text-[9px] uppercase tracking-[0.2em]">Más</span>
          </button>
        )}
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[var(--radius-2xl)] border-t border-rule-strong bg-ink-2 p-6"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <Eyebrow>Más opciones</Eyebrow>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {visibleTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border p-4 text-center transition-colors ${
                        isActive ? 'border-rule-strong bg-white/5' : 'border-rule bg-ink-3 hover:bg-white/[0.03]'
                      }`}
                      style={isActive ? { color: accentColor } : { color: 'var(--color-text-muted)' }}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span className="text-[11px] capitalize">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <Rule className="my-6" />

              <div className="flex flex-col gap-2">
                <button
                  onClick={toggleSound}
                  className={`mono flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] py-3 text-[11px] uppercase tracking-[0.2em] ${
                    isSoundEnabled ? 'bg-acid/10 text-acid' : 'bg-signal/10 text-signal-soft'
                  }`}
                >
                  {isSoundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  Sonido {isSoundEnabled ? 'on' : 'off'}
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('rivapp_session');
                    navigate('/login');
                  }}
                  className="mono flex w-full items-center justify-center gap-2 py-3 text-[11px] uppercase tracking-[0.22em] text-text-subtle hover:text-text"
                >
                  <LogOut className="h-3.5 w-3.5" /> Salir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="h-screen flex-1 overflow-y-auto bg-ink p-6 pb-28 md:p-10 md:pb-10">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 anim-rise">
            <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <Eyebrow>Panel</Eyebrow>
                <h1 className="display mt-3 text-4xl md:text-5xl">
                  Hola, <em className="display-italic" style={{ color: accentColor }}>{store?.name}</em>
                </h1>
                <p className="mt-2 text-sm text-text-muted">Resumen de ventas y turnos.</p>
              </div>
              <div className="flex items-center gap-2">
                <NotificationPanel
                  notifications={storeNotifications}
                  unreadCount={unreadCount}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onDelete={deleteNotification}
                  onClearAll={clearAllNotifications}
                  accentColor={accentColor}
                />
                <Button
                  href={`/${store?.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  size="md"
                >
                  <ExternalLink className="h-4 w-4" /> Ver local
                </Button>
                <button
                  onClick={() => refreshAllData()}
                  className="rounded-[var(--radius-md)] border border-rule p-3 text-text-muted hover:border-text hover:text-text"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Ingresos estimados" value={`$${stats.incomeToday.toLocaleString()}`} hint="Hoy" icon={TrendingUp} accent="acid" />
              <StatCard label="Turnos agendados" value={stats.todayCount} hint="Hoy" icon={CalendarIcon} accent="ml" />
              <div className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-acid/10 text-acid">
                    <Clock className="h-4 w-4" />
                  </div>
                  <Eyebrow>Próximo</Eyebrow>
                </div>
                {stats.nextApt ? (
                  <div className="mt-5">
                    <p className="display truncate text-2xl text-text">{stats.nextApt.customer_name}</p>
                    <p className="mono mt-1 text-[11px] uppercase tracking-[0.22em] text-text-subtle">
                      {new Date(stats.nextApt.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      · {stats.nextApt.services?.name}
                    </p>
                  </div>
                ) : (
                  <p className="display mt-5 text-xl italic text-text-subtle">Sin más turnos.</p>
                )}
              </div>
            </div>

            <section className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-8">
              <Eyebrow>Facturación</Eyebrow>
              <h3 className="display mt-3 text-3xl text-text">
                Últimos <em className="display-italic" style={{ color: accentColor }}>7 días</em>
              </h3>

              <div className="mt-8 h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-rule-strong)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{
                        backgroundColor: 'var(--color-ink-2)',
                        border: '1px solid var(--color-rule-strong)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    />
                    <Bar dataKey="ingresos" fill={accentColor} radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="space-y-5 anim-rise">
            <div>
              <Eyebrow>Solicitudes</Eyebrow>
              <h1 className="display mt-3 text-4xl md:text-5xl">
                Pendientes <em className="display-italic" style={{ color: accentColor }}>({pendingAppointments.length})</em>
              </h1>
            </div>

            {pendingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="relative flex items-center justify-between overflow-hidden rounded-[var(--radius-md)] border border-signal/30 bg-ink-2 p-5"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-signal" />
                <div className="pl-4">
                  <p className="display text-xl text-text">{apt.customer_name}</p>
                  <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                    {apt.services?.name} · {new Date(apt.start_time).toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleUpdateStatus(apt.id, 'cancelado', e)}
                    className="rounded-[var(--radius-sm)] border border-signal/40 bg-signal/10 px-4 py-2 text-sm text-signal-soft hover:bg-signal hover:text-white"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={(e) => handleUpdateStatus(apt.id, 'confirmado', e)}
                    className="rounded-[var(--radius-sm)] bg-acid px-4 py-2 text-sm font-semibold text-ink hover:brightness-110"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            ))}
            {pendingAppointments.length === 0 && (
              <p className="mono text-center text-[11px] uppercase tracking-[0.22em] text-text-subtle">
                No hay solicitudes pendientes
              </p>
            )}
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="flex h-full flex-col gap-8 anim-rise md:flex-row">
            <div className="h-fit w-full shrink-0 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6 md:w-[400px]">
              <header className="mb-6 flex items-center justify-between">
                <button
                  onClick={() => changeMonth(-1)}
                  className="rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="display text-xl capitalize">
                  {MONTHS[currentDate.getMonth()]}{' '}
                  <span className="num text-text-muted">{currentDate.getFullYear()}</span>
                </p>
                <button
                  onClick={() => changeMonth(1)}
                  className="rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </header>
              <div className="grid grid-cols-7 gap-1 text-center">
                {getDaysInMonth(currentDate).map((d, i) =>
                  d ? (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(d)}
                      className={`num flex aspect-square flex-col items-center justify-center rounded-[var(--radius-sm)] transition-colors ${
                        isSameDay(d, selectedDate) ? 'text-ink' : 'hover:bg-white/5 text-text'
                      }`}
                      style={isSameDay(d, selectedDate) ? { backgroundColor: accentColor } : {}}
                    >
                      <span className="text-sm">{d.getDate()}</span>
                      {getDailyLoad(d) > 0 && (
                        <div className="mt-1 h-1 w-1 rounded-full bg-current" />
                      )}
                    </button>
                  ) : (
                    <div key={i} />
                  )
                )}
              </div>
            </div>

            <div className="flex-1">
              <header className="mb-6 flex items-end justify-between">
                <div>
                  <Eyebrow>Agenda</Eyebrow>
                  <h1 className="display mt-3 text-3xl capitalize md:text-4xl">
                    {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h1>
                </div>
                <Button onClick={() => setShowManualModal(true)} variant="acid" size="md">
                  <Plus className="h-4 w-4" /> Agendar
                </Button>
              </header>

              <div className="space-y-3">
                {filteredAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => setCrmModal(apt)}
                    className="relative flex cursor-pointer items-center justify-between overflow-hidden rounded-[var(--radius-md)] border border-rule-strong bg-ink-2 p-5 transition-colors hover:border-text-muted"
                  >
                    <div
                      className="absolute inset-y-0 left-0 w-1"
                      style={{ backgroundColor: apt.status === 'confirmado' ? accentColor : '#FF9F1C' }}
                    />
                    <div className="flex items-center gap-5 pl-4">
                      <div className="text-center">
                        <p className="num display text-2xl text-text">
                          {new Date(apt.start_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="display text-lg text-text">{apt.customer_name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                            {apt.services?.name}
                          </span>
                          {apt.staff && (
                            <span className="mono inline-flex items-center gap-1 rounded-sm bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-text-muted">
                              <UserCog className="h-2.5 w-2.5" /> {apt.staff.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="num text-lg font-semibold" style={{ color: accentColor }}>
                          ${apt.price_paid || apt.services?.price}
                        </p>
                        {apt.coupon_code && (
                          <span className="mono inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.22em] text-ml-soft">
                            <Tag className="h-2.5 w-2.5" /> {apt.coupon_code}
                          </span>
                        )}
                        {apt.payment_status === 'paid' ? (
                          <p className="mono mt-1 inline-flex items-center gap-1 rounded-sm bg-acid px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink">
                            <Check className="h-2.5 w-2.5" /> Pagado
                          </p>
                        ) : apt.payment_method === 'mercadopago' ? (
                          <p className="mono mt-1 rounded-sm bg-ml px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white">
                            MP
                          </p>
                        ) : null}
                      </div>
                      <button
                        onClick={(e) => handleDeleteAppointment(apt.id, e)}
                        className="rounded-[var(--radius-sm)] border border-signal/30 bg-signal/10 p-2.5 text-signal hover:bg-signal hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => sendReminder(apt, e)}
                        className="rounded-[var(--radius-sm)] border border-rule bg-white/5 p-2.5 text-text-muted hover:border-acid hover:text-acid"
                      >
                        <Bell className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredAppointments.length === 0 && (
                  <p className="mono py-10 text-center text-[11px] uppercase tracking-[0.22em] text-text-subtle">
                    Sin turnos confirmados
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="anim-rise">
            <header className="mb-8 flex items-end justify-between">
              <div>
                <Eyebrow>Equipo</Eyebrow>
                <h1 className="display mt-3 text-4xl md:text-5xl">
                  Nuestro <em className="display-italic" style={{ color: accentColor }}>equipo</em>
                </h1>
              </div>
              <Button onClick={() => openStaffModal()} variant="acid" size="md">
                <Plus className="h-4 w-4" /> Agregar
              </Button>
            </header>
            <div className="grid gap-4 md:grid-cols-4">
              {staffList.map((member) => (
                <div
                  key={member.id}
                  className="group relative flex flex-col items-center gap-4 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6 text-center transition-colors hover:border-text-muted"
                >
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openStaffModal(member)}
                      className="rounded-[var(--radius-sm)] bg-white/5 p-1.5 text-text-muted hover:bg-white/10 hover:text-text"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteStaff(member.id)}
                      className="rounded-[var(--radius-sm)] bg-signal/10 p-1.5 text-signal hover:bg-signal hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="h-20 w-20 overflow-hidden rounded-full border border-rule-strong bg-ink-3">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <UserCog className="h-full w-full p-5 text-text-muted" />
                    )}
                  </div>
                  <div>
                    <p className="display text-lg text-text">{member.name}</p>
                    <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em]" style={{ color: accentColor }}>
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'servicios' && (
          <div className="anim-rise">
            <header className="mb-8 flex items-end justify-between">
              <div>
                <Eyebrow>Catálogo</Eyebrow>
                <h1 className="display mt-3 text-4xl md:text-5xl">
                  Tus <em className="display-italic" style={{ color: accentColor }}>servicios</em>
                </h1>
              </div>
              <Button onClick={() => openServiceModal()} variant="acid" size="md">
                <Plus className="h-4 w-4" /> Nuevo
              </Button>
            </header>
            <div className="grid gap-4 md:grid-cols-3">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="group relative rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6 transition-colors hover:border-text-muted"
                >
                  <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => openServiceModal(s)} className="text-text-muted hover:text-text">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteService(s.id)} className="text-text-muted hover:text-signal">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="display text-2xl text-text">{s.name}</p>
                  <Rule className="my-5" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="num font-semibold" style={{ color: accentColor }}>
                      ${s.price}
                    </span>
                    <span className="mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                      {s.duration_minutes} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="anim-rise">
            <header className="mb-8 flex items-end justify-between">
              <div>
                <Eyebrow>Marketing</Eyebrow>
                <h1 className="display mt-3 text-4xl md:text-5xl">
                  Cupones <em className="display-italic" style={{ color: accentColor }}>activos</em>
                </h1>
              </div>
              <Button onClick={() => setShowCouponModal(true)} variant="acid" size="md">
                <Plus className="h-4 w-4" /> Crear cupón
              </Button>
            </header>
            <div className="grid gap-4 md:grid-cols-3">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="relative rounded-[var(--radius-xl)] border border-dashed border-rule-strong bg-ink-2 p-6"
                >
                  <button
                    onClick={() => deleteCoupon(c.id)}
                    className="absolute right-4 top-4 text-text-muted hover:text-signal"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <p className="mono text-[10px] uppercase tracking-[0.22em]" style={{ color: accentColor }}>
                    Código
                  </p>
                  <p className="display mono mt-3 text-3xl text-text">{c.code}</p>
                  <p
                    className="mono mt-4 inline-block rounded-full bg-acid/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-acid"
                  >
                    -{c.discount}% OFF
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="max-w-4xl anim-rise">
            <header className="mb-8">
              <Eyebrow>Plan</Eyebrow>
              <h1 className="display mt-3 text-4xl md:text-5xl">
                Tu <em className="display-italic" style={{ color: accentColor }}>suscripción</em>
              </h1>
            </header>

            {store.plan_type === 'pro' ||
            store.plan_type === 'profesional' ||
            store.subscription_status === 'active' ||
            store.is_demo ? (
              <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-acid/40 bg-ink-2 p-10">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <Eyebrow tone="acid">Tu plan actual</Eyebrow>
                      <span className="mono inline-flex items-center gap-1 rounded-sm bg-acid px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-ink">
                        <Crown className="h-3 w-3" /> Pro
                      </span>
                    </div>
                    <h2 className="display mt-4 text-6xl text-text">Profesional</h2>
                  </div>
                  <div className="text-right">
                    <p className="display num text-5xl text-text">$40.000</p>
                    <p className="mono mt-1 text-[11px] uppercase tracking-[0.22em] text-text-subtle">/ mes</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-[var(--radius-2xl)] border border-rule-strong bg-ink-2 p-8">
                  <Eyebrow>Tu plan actual</Eyebrow>
                  <h2 className="display mt-4 text-4xl text-text">Gratuito</h2>
                  <ul className="mt-6 space-y-3 text-sm text-text-muted">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-text-subtle" /> Gestión de turnos básica
                    </li>
                  </ul>
                </div>
                <div
                  className="rounded-[var(--radius-2xl)] p-px"
                  style={{ background: `linear-gradient(to bottom right, ${accentColor}, var(--color-ink))` }}
                >
                  <div className="rounded-[calc(var(--radius-2xl)-1px)] bg-ink-2 p-8">
                    <Eyebrow tone="acid">Plan Pro</Eyebrow>
                    <p className="display num mt-4 text-5xl text-text">$40.000</p>
                    <button
                      onClick={handleSubscribe}
                      className="mt-8 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] py-4 font-semibold text-ink"
                      style={{ backgroundColor: accentColor }}
                    >
                      Pasarme a Pro <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-3xl pb-20 anim-rise">
            <header className="mb-8">
              <Eyebrow>Perfil</Eyebrow>
              <h1 className="display mt-3 text-4xl md:text-5xl">
                Tu <em className="display-italic" style={{ color: accentColor }}>negocio</em>
              </h1>
            </header>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Banner + logo */}
              <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2">
                <div className="relative h-52 bg-ink-3">
                  {profileForm.banner_url ? (
                    <img src={profileForm.banner_url} alt="" className="h-full w-full object-cover opacity-80" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-rule-strong" />
                    </div>
                  )}
                  <label className="mono absolute right-4 top-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-rule-strong bg-ink/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-text backdrop-blur-md hover:border-text">
                    <Camera className="h-3.5 w-3.5" /> Portada
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'banner_url')}
                    />
                  </label>
                </div>
                <div className="h-16" />
                <div className="absolute left-8 top-36">
                  <div className="group/logo relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[5px] border-ink-2 bg-ink-3">
                    {profileForm.logo_url ? (
                      <img src={profileForm.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-10 w-10 text-text-muted" />
                    )}
                    <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-ink/70 opacity-0 transition-opacity group-hover/logo:opacity-100">
                      <Upload className="h-5 w-5 text-text" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'logo_url')}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <AdminInput
                    label="Nombre"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                  <AdminInput
                    label="WhatsApp"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>

                <Rule />

                <div>
                  <label className="eyebrow mb-3 block">Color de acento</label>
                  <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-4">
                    <input
                      type="color"
                      className="h-12 w-12 cursor-pointer rounded-[var(--radius-sm)] border-none bg-transparent"
                      value={profileForm.color_accent}
                      onChange={(e) => setProfileForm({ ...profileForm, color_accent: e.target.value })}
                    />
                    <div className="flex-1">
                      <p className="mono text-sm uppercase text-text">{profileForm.color_accent}</p>
                      <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                        Se aplica a tu página pública y a los botones del panel
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="eyebrow mb-2 block">Dirección</label>
                  <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 focus-within:border-text">
                    <MapPin className="h-4 w-4 text-text-muted" />
                    <input
                      className="w-full bg-transparent text-sm text-text outline-none"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    />
                  </div>
                </div>

                <Rule />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="display text-xl text-text">Selección de equipo</p>
                    <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                      El cliente elige profesional
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm((p) => ({ ...p, enable_staff_selection: !p.enable_staff_selection }))
                    }
                    style={{ color: profileForm.enable_staff_selection ? accentColor : 'var(--color-rule-strong)' }}
                  >
                    {profileForm.enable_staff_selection ? (
                      <ToggleRight className="h-10 w-10" />
                    ) : (
                      <ToggleLeft className="h-10 w-10" />
                    )}
                  </button>
                </div>

                <Rule />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="display inline-flex items-center gap-2 text-xl text-ml-soft">
                        <CreditCard className="h-4 w-4" /> Cobros online
                      </p>
                      <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                        Habilitar Mercado Pago
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfileForm((p) => ({ ...p, enable_payments: !p.enable_payments }))}
                      style={{ color: profileForm.enable_payments ? accentColor : 'var(--color-rule-strong)' }}
                    >
                      {profileForm.enable_payments ? (
                        <ToggleRight className="h-10 w-10" />
                      ) : (
                        <ToggleLeft className="h-10 w-10" />
                      )}
                    </button>
                  </div>
                  {profileForm.enable_payments && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="space-y-3 rounded-[var(--radius-md)] border border-ml/30 bg-ml/10 p-4"
                    >
                      <p className="mono text-[10px] uppercase tracking-[0.22em] text-ml-soft">
                        Credenciales · Producción
                      </p>
                      <AdminInput
                        label="Access Token"
                        type="password"
                        placeholder="APP_USR-…"
                        value={profileForm.mp_access_token}
                        onChange={(e) => setProfileForm({ ...profileForm, mp_access_token: e.target.value })}
                      />
                      <AdminInput
                        label="Public Key"
                        placeholder="APP_USR-…"
                        value={profileForm.mp_public_key}
                        onChange={(e) => setProfileForm({ ...profileForm, mp_public_key: e.target.value })}
                      />
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-[var(--radius-md)] px-8 py-4 font-semibold text-ink shadow-[var(--shadow-lift)]"
                  style={{ backgroundColor: accentColor }}
                >
                  <Save className="h-4 w-4" /> Guardar
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="max-w-3xl anim-rise">
            <header className="mb-8 flex items-end justify-between">
              <div>
                <Eyebrow>Configuración</Eyebrow>
                <h1 className="display mt-3 text-4xl md:text-5xl">
                  <em className="display-italic" style={{ color: accentColor }}>Horarios</em>
                </h1>
              </div>
              <button
                onClick={handleSaveSchedule}
                className="flex items-center gap-2 rounded-[var(--radius-md)] bg-acid px-6 py-3 text-sm font-semibold text-ink"
              >
                <Save className="h-4 w-4" /> Guardar
              </button>
            </header>

            <div className="mb-6 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="display inline-flex items-center gap-2 text-xl" style={{ color: accentColor }}>
                    <Users className="h-4 w-4" /> Cupos simultáneos
                  </p>
                  <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                    Varias personas en el mismo horario
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSlotsConfig({ ...slotsConfig, enable_multislots: !slotsConfig.enable_multislots })
                  }
                  className={`h-6 w-12 rounded-full p-1 transition-colors ${
                    slotsConfig.enable_multislots ? 'bg-acid' : 'bg-rule-strong'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      slotsConfig.enable_multislots ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <AnimatePresence>
                {slotsConfig.enable_multislots && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 flex items-center gap-4 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-4">
                      <input
                        type="number"
                        min="1"
                        className="num w-24 rounded-[var(--radius-sm)] border bg-ink p-3 text-center text-xl font-semibold text-text"
                        style={{ borderColor: accentColor }}
                        value={slotsConfig.max_concurrent_slots}
                        onChange={(e) =>
                          setSlotsConfig({ ...slotsConfig, max_concurrent_slots: parseInt(e.target.value) })
                        }
                      />
                      <p className="mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
                        Cupos por horario · ej: {slotsConfig.max_concurrent_slots} profesionales
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2">
              {schedules.map((day, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-rule p-4 last:border-0 hover:bg-white/[0.02]"
                >
                  <div className="flex w-40 items-center gap-4">
                    <input
                      type="checkbox"
                      checked={!day.is_closed}
                      onChange={(e) => {
                        const n = [...schedules];
                        n[i].is_closed = !e.target.checked;
                        setSchedules(n);
                      }}
                      style={{ accentColor }}
                      className="h-4 w-4"
                    />
                    <span className={`display text-lg ${day.is_closed ? 'text-text-subtle' : 'text-text'}`}>
                      {DAYS[day.day_of_week]}
                    </span>
                  </div>
                  <div className={`flex items-center gap-3 ${day.is_closed ? 'opacity-30' : ''}`}>
                    <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-rule bg-ink-3 px-3 py-1.5">
                      <span className="mono text-[9px] uppercase tracking-[0.2em] text-text-subtle">Abre</span>
                      <input
                        type="time"
                        className="mono bg-transparent text-sm text-text outline-none"
                        value={day.open_time}
                        onChange={(e) => {
                          const n = [...schedules];
                          n[i].open_time = e.target.value;
                          setSchedules(n);
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-rule bg-ink-3 px-3 py-1.5">
                      <span className="mono text-[9px] uppercase tracking-[0.2em] text-text-subtle">Cierra</span>
                      <input
                        type="time"
                        className="mono bg-transparent text-sm text-text outline-none"
                        value={day.close_time}
                        onChange={(e) => {
                          const n = [...schedules];
                          n[i].close_time = e.target.value;
                          setSchedules(n);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modales */}
      {showServiceModal && (
        <Modal onClose={() => setShowServiceModal(false)} title={editingService ? 'Editar servicio' : 'Nuevo servicio'}>
          <form onSubmit={handleSaveService} className="space-y-4">
            <AdminInput
              label="Nombre"
              autoFocus
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <AdminInput
                label="Precio"
                type="number"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
              />
              <AdminInput
                label="Minutos"
                type="number"
                value={newService.duration}
                onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={() => setShowServiceModal(false)} variant="outline" size="md" className="flex-1">
                Cancelar
              </Button>
              <button
                type="submit"
                className="flex-1 rounded-[var(--radius-md)] py-3 font-semibold text-ink"
                style={{ backgroundColor: accentColor }}
              >
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showStaffModal && (
        <Modal onClose={() => setShowStaffModal(false)} title={editingStaff ? 'Editar miembro' : 'Nuevo miembro'}>
          <form onSubmit={handleSaveStaff} className="space-y-4">
            <div className="flex justify-center">
              <label className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-rule-strong bg-ink-3 hover:border-text">
                {newStaff.avatar_url ? (
                  <img src={newStaff.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-5 w-5 text-text-muted" />
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'avatar_url', setNewStaff)}
                />
              </label>
            </div>
            <AdminInput
              label="Nombre"
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              required
            />
            <AdminInput
              label="Rol"
              value={newStaff.role}
              onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
              required
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={() => setShowStaffModal(false)} variant="outline" size="md" className="flex-1">
                Cancelar
              </Button>
              <button
                type="submit"
                className="flex-1 rounded-[var(--radius-md)] py-3 font-semibold text-ink"
                style={{ backgroundColor: accentColor }}
              >
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showManualModal && (
        <Modal onClose={() => setShowManualModal(false)} title="Agendar turno">
          <form onSubmit={handleManualBooking} className="space-y-3">
            <AdminInput
              label="Cliente"
              value={manualApt.customer_name}
              onChange={(e) => setManualApt({ ...manualApt, customer_name: e.target.value })}
              required
            />
            <AdminInput
              label="Teléfono"
              value={manualApt.customer_phone}
              onChange={(e) => setManualApt({ ...manualApt, customer_phone: e.target.value })}
            />
            <div>
              <label className="eyebrow mb-2 block">Servicio</label>
              <select
                className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-text focus:outline-none"
                value={manualApt.service_id}
                onChange={(e) => setManualApt({ ...manualApt, service_id: e.target.value })}
                required
              >
                <option value="">Servicio…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow mb-2 block">Staff</label>
              <select
                className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-text focus:outline-none"
                value={manualApt.staff_id}
                onChange={(e) => setManualApt({ ...manualApt, staff_id: e.target.value })}
              >
                <option value="">Cualquiera…</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <AdminInput
                label="Fecha"
                type="date"
                value={manualApt.date}
                onChange={(e) => setManualApt({ ...manualApt, date: e.target.value })}
                required
              />
              <AdminInput
                label="Hora"
                type="time"
                value={manualApt.time}
                onChange={(e) => setManualApt({ ...manualApt, time: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={() => setShowManualModal(false)} variant="outline" size="md" className="flex-1">
                Cancelar
              </Button>
              <button
                type="submit"
                className="flex-1 rounded-[var(--radius-md)] py-3 font-semibold text-ink"
                style={{ backgroundColor: accentColor }}
              >
                Confirmar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showCouponModal && (
        <Modal onClose={() => setShowCouponModal(false)} title="Crear cupón">
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label className="eyebrow mb-2 block">Código</label>
              <input
                className="mono w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm uppercase tracking-[0.2em] text-text focus:border-text focus:outline-none"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                autoFocus
                required
                placeholder="Ej: VERANO25"
              />
            </div>
            <AdminInput
              label="Descuento (%)"
              type="number"
              value={newCoupon.discount}
              onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
              required
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={() => setShowCouponModal(false)} variant="outline" size="md" className="flex-1">
                Cancelar
              </Button>
              <button
                type="submit"
                className="flex-1 rounded-[var(--radius-md)] py-3 font-semibold text-ink"
                style={{ backgroundColor: accentColor }}
              >
                Crear
              </button>
            </div>
          </form>
        </Modal>
      )}

      {crmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm anim-fade">
          <div className="w-full max-w-2xl overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 shadow-[var(--shadow-editorial)]">
            <div className="flex items-center justify-between border-b border-rule p-6">
              <Eyebrow>Cliente</Eyebrow>
              <button
                onClick={() => setCrmModal(null)}
                className="rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-6">
              <h2 className="display text-3xl text-text">{crmModal.customer_name}</h2>

              <div className="mt-5 flex items-center justify-between rounded-[var(--radius-md)] border border-rule bg-ink-3 p-4">
                <span className="mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                  Estado del pago
                </span>
                <span
                  className={`mono text-[11px] font-semibold uppercase tracking-[0.22em] ${
                    crmModal.payment_status === 'paid' ? 'text-acid' : 'text-signal-soft'
                  }`}
                >
                  {crmModal.payment_status === 'paid' ? 'Pagado ✓' : 'Pendiente'}
                </span>
              </div>
              {crmModal.payment_id && (
                <p className="mono mt-2 text-right text-[10px] uppercase tracking-[0.2em] text-text-subtle">
                  Ref MP: {crmModal.payment_id}
                </p>
              )}

              <textarea
                className="mt-5 h-32 w-full resize-none rounded-[var(--radius-md)] border border-rule bg-ink-3 p-4 text-sm text-text placeholder:text-text-subtle focus:border-text focus:outline-none"
                placeholder="Notas internas…"
                defaultValue={crmModal.internal_notes}
                onBlur={(e) => saveInternalNote(crmModal.id, e.target.value)}
              />

              <Rule className="my-6" label="Historial" />

              <div className="space-y-2">
                {getClientHistory(crmModal.customer_phone).map((h) => (
                  <div
                    key={h.id}
                    className="flex justify-between border-b border-rule py-2 text-sm last:border-0"
                  >
                    <span className="text-text-muted">
                      {new Date(h.start_time).toLocaleDateString('es-AR')} · {h.services?.name}
                    </span>
                    <span className="num font-semibold text-acid">
                      ${h.price_paid || h.services?.price}
                    </span>
                  </div>
                ))}
              </div>

              <Button onClick={() => setCrmModal(null)} variant="ghost" size="lg" className="mt-6 w-full">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
