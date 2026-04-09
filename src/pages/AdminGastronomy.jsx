import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useStore } from '../context/StoreContext';
import { useEntitlements } from '../hooks/useEntitlements';
import { useNavigate } from 'react-router-dom';
import AdminBranchSelector from '../components/admin/AdminBranchSelector';
import NotificationPanel from '../components/admin/NotificationPanel';
import NotificationToast from '../components/admin/NotificationToast';
import { useNotifications, NOTIFICATION_TAB_MAP } from '../hooks/useNotifications';
import { logger } from '../utils/logger';

// --- ICONOS (LUCIDE REACT) ---
import {
  Lock, Store, Plus, CheckCircle, XCircle, Clock, LayoutGrid, List, RefreshCw, X,
  Image as ImageIcon, DollarSign, Ticket, Archive, BarChart3, LogOut, Printer,
  History, Bell, Package, MapPin, Bike, Trash2, Edit, Camera, Activity,
  Settings, Save, Upload, PieChart as PieIcon, PlayCircle, TrendingUp, Zap,
  Loader2, Volume2, VolumeX, AlertCircle, Users, Star, MessageSquare,
  ArrowRight, Layers, Infinity, Puzzle, ExternalLink, Menu as MenuIcon, Grid,
  Power, ShoppingBag, Utensils, Crown, Check, CloudUpload, Filter,
  CreditCard, Phone, ChevronRight, MessageCircle, FileText, User, Globe, Shield, ChevronDown, Mail,
  Info
} from 'lucide-react';

// --- GRÁFICOS (RECHARTS) ---
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// 1. CONSTANTES Y CONFIGURACIÓN GLOBAL
// ==========================================

const BELL_SOUND = "/sounds/bell.mp3";

const ALL_TABS = [
  { id: 'dashboard', label: 'Panel', icon: PieIcon },
  { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
  { id: 'team', label: 'Equipo', icon: Users, proOnly: true },
  { id: 'crm', label: 'Clientes', icon: Users, proOnly: true },
  { id: 'menu', label: 'Menú', icon: Utensils },
  { id: 'riders', label: 'Riders', icon: Bike, proOnly: true },
  { id: 'coupons', label: 'Cupones', icon: Ticket, proOnly: true },
  { id: 'reviews', label: 'Reseñas', icon: MessageSquare, proOnly: true },
  { id: 'history', label: 'Historial', icon: History, proOnly: true },
  { id: 'billing', label: 'Suscripción', icon: CreditCard },
  { id: 'config', label: 'Ajustes', icon: Settings },
];

// ==========================================
// 2. FUNCIONES AUXILIARES (HELPERS)
// ==========================================

const getContrastText = (hexcolor) => {
  if (!hexcolor) return 'white';
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
};

const printZTicket = (totals, storeName) => {
  const popupWin = window.open('', '_blank', 'width=350,height=600');
  if (!popupWin) return alert("Por favor permite ventanas emergentes para imprimir.");

  const now = new Date();
  const html = `
      <html>
        <head>
          <title>Cierre de Caja</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
            body { font-family: 'Courier Prime', monospace; padding: 20px; font-size: 12px; color: #000; width: 80mm; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .title { font-size: 16px; font-weight: bold; margin: 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total-row { display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${storeName}</h1>
            <p>REPORTE DE CIERRE Z</p>
            <p>${now.toLocaleDateString()} - ${now.toLocaleTimeString()}</p>
          </div>
          <div class="row"><span>Pedidos Totales:</span><span>${totals.count}</span></div>
          <br/>
          <div class="row"><span>Efectivo:</span><span>$${totals.cash.toLocaleString()}</span></div>
          <div class="row"><span>Digital:</span><span>$${totals.digital.toLocaleString()}</span></div>
          <div class="total-row"><span>TOTAL VENTAS:</span><span>$${totals.total.toLocaleString()}</span></div>
          <div class="footer"><p>Sistema RIVA ESTUDIO</p></div>
          <script>window.print();setTimeout(function(){ window.close(); }, 500);</script>
        </body>
      </html>
    `;
  popupWin.document.write(html);
  popupWin.document.close();
};

// ==========================================
// 3. SUB-COMPONENTES INTERNOS
// ==========================================

const KanbanColumn = ({ title, count, children }) => (
  <div className="flex-1 flex flex-col bg-[#141414] rounded-2xl border border-white/5 min-w-[300px] snap-center h-full max-h-[calc(100vh-140px)]">
    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a] rounded-t-2xl sticky top-0 z-10">
      <h3 className="font-bold text-white text-xs uppercase tracking-widest">{title}</h3>
      <span className="bg-white/10 text-gray-400 text-[10px] px-2 py-1 rounded-full font-bold">{count}</span>
    </div>
    <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
      {children}
    </div>
  </div>
);

const OrderCard = ({ order, onStatusChange, onReject, onPrint, isFinished, onAssignRider, onMarkPaid, branchName }) => {
  const isPickup = order.delivery_type?.toLowerCase() === 'retiro';
  const isPaid = order.payment_status === 'paid' || order.paid === true;

  return (
    <div className="bg-[#1e1e1e] p-4 rounded-xl border border-white/5 shadow-xl group hover:border-white/10 transition-all relative overflow-hidden">
      {/* Etiqueta de Pago */}
      {order.payment_method === 'mercadopago' && (
        <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold rounded-bl-xl flex items-center gap-1 ${isPaid ? 'bg-green-500 text-white' : 'bg-[#009EE3] text-white'}`}>
          {isPaid ? <><Check size={10} /> PAGADO</> : 'MERCADO PAGO'}
        </div>
      )}

      {/* Cabecera */}
      <div className="flex justify-between items-start mb-3 mt-2">
        <div>
          <h4 className="font-bold text-white leading-none text-lg">{order.customer_name}</h4>
          {branchName && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded w-fit">
              <MapPin size={10} className="text-[#d0ff00]" /> {branchName}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <p className="text-[10px] text-gray-500 uppercase font-bold">{order.payment_method}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isPickup ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
              {isPickup ? 'Retiro' : 'Delivery'}
            </span>
            {!isPaid && !isFinished && (
              <button onClick={() => onMarkPaid(order.id)} className="text-[10px] bg-white/10 hover:bg-green-500/20 hover:text-green-500 text-gray-400 px-2 py-0.5 rounded transition-colors flex items-center gap-1" title="Marcar como pagado manualmente">
                <Check size={10} />
              </button>
            )}
          </div>
        </div>
        <button onClick={() => onPrint(order)} className="p-2 bg-black/50 rounded-lg text-blue-400 hover:text-white transition-colors">
          <Printer size={16} />
        </button>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-4 border-l-2 border-white/5 pl-3">
        {(order.items || []).map((item, idx) => (
          <div key={idx} className="text-sm text-gray-300">
            <span className="font-bold text-white">{item.quantity}x</span> {item.name} {item.variantName && <span className="text-gray-500 text-xs">({item.variantName})</span>}
            {item.selectedExtras && item.selectedExtras.length > 0 && (
              <div className="text-[10px] text-gray-500 ml-4">+ {item.selectedExtras.map(e => e.name).join(', ')}</div>
            )}
          </div>
        ))}
        {order.note && <p className="text-xs text-yellow-500 italic mt-2 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">Nota: "{order.note}"</p>}
        {!isPickup && (
          <div className="mt-2 text-xs flex items-center gap-1 text-blue-400 font-bold">
            <Bike size={12} /> Envío: ${order.delivery_cost || 0}
          </div>
        )}
        <div className="mt-2 text-lg font-black text-white text-right border-t border-white/10 pt-2">
          ${order.total?.toLocaleString()}
        </div>
      </div>

      {/* Botones de Acción */}
      {!isFinished && (
        <div className="grid grid-cols-2 gap-2">
          {order.status === 'pendiente' && (
            <>
              <button onClick={() => onReject(order.id)} className="bg-red-500/10 text-red-500 py-3 rounded-xl text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-colors">Rechazar</button>
              <button onClick={() => onStatusChange(order.id, 'confirmado')} className="bg-green-500/10 text-green-500 py-3 rounded-xl text-xs font-bold uppercase hover:bg-green-500 hover:text-white transition-colors">Confirmar</button>
            </>
          )}
          {order.status === 'confirmado' && (
            <button onClick={() => onStatusChange(order.id, 'listo')} className="col-span-2 bg-blue-600 py-3 rounded-xl text-xs font-bold text-white uppercase hover:bg-blue-500 transition-colors">Marcar Listo</button>
          )}
          {order.status === 'listo' && (
            <>
              {isPickup ? (
                <button onClick={() => onStatusChange(order.id, 'entregado')} className="col-span-2 bg-green-600 py-3 rounded-xl text-xs font-bold text-white uppercase hover:bg-green-500 transition-colors flex items-center justify-center gap-2">
                  <User size={16} /> Entregado al Cliente
                </button>
              ) : (
                <>
                  <button onClick={onAssignRider} className="col-span-1 bg-yellow-500/10 text-yellow-500 py-3 rounded-xl text-xs font-bold uppercase hover:bg-yellow-500/20 transition-colors">Rider</button>
                  <button onClick={() => onStatusChange(order.id, 'entregado')} className="col-span-1 bg-green-600 py-3 rounded-xl text-xs font-bold text-white uppercase hover:bg-green-500 transition-colors">Entregar</button>
                </>
              )}
            </>
          )}
        </div>
      )}
      {order.status === 'rechazado' && <div className="text-red-500 text-xs font-bold text-center uppercase border border-red-500/20 p-2 rounded">Cancelado</div>}
    </div>
  );
};

// ==========================================
// 4. COMPONENTE PRINCIPAL
// ==========================================

export default function AdminGastronomy() {
  // 🟢 1. OBTENER ROL DEL CONTEXTO
  const { store: config, refreshStore, role, user } = useStore();
  const { features, canAccessAdmin } = useEntitlements(config);
  const navigate = useNavigate();
  const { notifications: storeNotifications, unreadCount, toasts, dismissToast, markAsRead, markAllAsRead, deleteNotification, clearAll: clearAllNotifications } = useNotifications(config?.id, { soundEnabled: false });

  // --- ESTADOS DE UI ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOpen, setIsOpen] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [session, setSession] = useState(null);
  const [flash, setFlash] = useState(false);

  // --- FILTRO DE SUCURSAL ---
  const [viewBranchId, setViewBranchId] = useState(() => {
     return localStorage.getItem('admin_view_branch') || ''; 
  });
  
  const handleBranchChange = (branchId) => {
      const val = branchId || '';
      if (val) localStorage.setItem('admin_view_branch', val);
      else localStorage.removeItem('admin_view_branch');
      setViewBranchId(val);
  };

  const [branches, setBranches] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '', lat: '', lng: '' });

  // --- ESTADOS DE EQUIPO ---
  const [teamInvites, setTeamInvites] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', role: 'staff', branch_id: '' });

  // --- ESTADOS DE DATOS ---
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [riders, setRiders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dashboardData, setDashboardData] = useState({ totalRevenue: 0, totalOrders: 0, avgTicket: 0, chartData: [], topProducts: [], paymentData: [] });
  const [statsFilter, setStatsFilter] = useState('today');

  // --- NOTIFICACIONES ---
  const [globalNotifications, setGlobalNotifications] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [dismissedMessages, setDismissedMessages] = useState(() => {
    const saved = localStorage.getItem('rivapp_dismissed_msgs');
    return saved ? JSON.parse(saved) : [];
  });

  // --- SETTINGS FORM ---
  const [settingsForm, setSettingsForm] = useState({
    store_name: '', color_accent: '#ff6b00', cbu_alias: '', phone: '',
    logo_url: '', banner_url: '', lat: -31.546787, lng: -68.564150,
    schedule_start: '20:00', schedule_end: '00:00', auto_schedule: false,
    mp_access_token: '', mp_public_key: '',
    mp_client_id: '', mp_client_secret: '',
    delivery_base_price: 500, delivery_price_per_km: 300, charge_delivery_in_mp: true
  });

  // --- MODALES ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showCreateRiderModal, setShowCreateRiderModal] = useState(false);
  const [showAssignRiderModal, setShowAssignRiderModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);

  const [selectedOrderForRider, setSelectedOrderForRider] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [promoTargetItem, setPromoTargetItem] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: '', image: '', available: true, stock: 100, has_variants: false, variants: [], has_infinite_stock: false, extras: [] });
  const [tempExtra, setTempExtra] = useState({ name: '', price: '' });
  const [promoConfig, setPromoConfig] = useState({ type: 'discount', value: 15, buy: 2, pay: 1 });
  const [newRider, setNewRider] = useState({ name: '', phone: '', access_pin: '', branch_id: '' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: 10 });
  const [priceConfig, setPriceConfig] = useState({ type: 'percent', action: 'increase', value: 0 });
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const accentColor = config?.color_accent || '#ff6b00';
  const contrastTextColor = getContrastText(accentColor);
  const audioRef = useRef(new Audio(BELL_SOUND));
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);
  const prevOrdersCount = useRef(0);

  // ==========================================
  // 5. FUNCIONES LÓGICAS
  // ==========================================

  const toggleSound = useCallback(() => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    soundEnabledRef.current = newState;
    if (newState) {
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }).catch((e) => logger.debug('Audio permission pending', e));
    }
  }, [isSoundEnabled]);

  const playNotification = useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 1000);
    if (soundEnabledRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Error audio:", e));
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!config) return;
    const { data } = await supabase.from('orders')
      .select('*, riders(name)')
      .eq('store_id', config.id)
      .neq('status', 'archivado')
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data);
      const visibleOrders = !viewBranchId ? data : data.filter(o => o.branch_id === viewBranchId);
      const currentPending = visibleOrders.filter(o => o.status === 'pendiente').length;
      
      if (currentPending > prevOrdersCount.current) {
        playNotification();
      }
      prevOrdersCount.current = currentPending;
    }
  }, [config, viewBranchId, playNotification]);

  const fetchGlobalNotifications = async () => {
    const { data } = await supabase.from('global_notifications').select('*').eq('is_active', true).or(`target.eq.all,target.eq.gastronomia`).order('created_at', { ascending: false });
    if (data && data.length > 0) {
      const filtered = data.filter(n => !dismissedMessages.includes(n.id));
      setGlobalNotifications(filtered);
      if (filtered.length > 0) {
        const newest = filtered[0];
        const fiveMinAgo = new Date(Date.now() - 5 * 60000);
        if (new Date(newest.created_at) > fiveMinAgo) setActiveAlert(newest);
      }
    }
  };

  const fetchBranches = async () => { const { data } = await supabase.from('branches').select('*').eq('store_id', config.id).eq('is_active', true).order('name'); if (data) setBranches(data); };
  
  const fetchRiders = async () => { 
      const { data } = await supabase
        .from('riders')
        .select('*, branches(name)')
        .eq('store_id', config.id)
        .order('id'); 
      if (data) setRiders(data || []); 
  };

  const fetchMenu = async () => { const { data } = await supabase.from('menu').select('*').eq('store_id', config.id).order('id', { ascending: false }); if (data) setMenuItems(data || []); };
  const fetchHistory = async () => { const { data } = await supabase.from('orders').select('*').eq('store_id', config.id).or('status.eq.archivado,status.eq.rechazado,status.eq.entregado').order('created_at', { ascending: false }).limit(500); if (data) setHistoryOrders(data || []); };
  const fetchCoupons = async () => { const { data } = await supabase.from('coupons').select('*').eq('store_id', config.id).order('id'); if (data) setCoupons(data || []); };
  const fetchReviews = async () => { const { data } = await supabase.from('orders').select('*').eq('store_id', config.id).not('rating', 'is', null).order('created_at', { ascending: false }); if (data) setReviews(data || []); };
  const fetchCRMData = async () => { if (!config?.id) return; const { data } = await supabase.from('customer_insights').select('*').eq('store_id', config.id).order('total_orders', { ascending: false }); if (data) setCustomers(data); };
  
  // 🟢 FETCH TEAM INVITES
  const fetchTeamInvites = async () => {
      const { data } = await supabase.from('team_invitations').select('*').eq('store_id', config.id).order('created_at', { ascending: false });
      if (data) setTeamInvites(data);
  };

  const dismissMessage = (id) => {
    const updated = [...dismissedMessages, id];
    setDismissedMessages(updated);
    localStorage.setItem('rivapp_dismissed_msgs', JSON.stringify(updated));
    setGlobalNotifications(prev => prev.filter(n => n.id !== id));
    if (activeAlert?.id === id) setActiveAlert(null);
  };

  useEffect(() => {
    const checkSession = async () => {
      // Primero intentar localStorage (login flow normal)
      const localSession = localStorage.getItem('rivapp_session');
      try {
        const parsed = JSON.parse(localSession);
        if (parsed) { setSession(parsed); setLoadingSession(false); return; }
      } catch (e) { }
      // Fallback: usar sesión de Supabase Auth directamente
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (authSession?.user) {
        const sessionData = { id: authSession.user.id, email: authSession.user.email };
        setSession(sessionData);
        localStorage.setItem('rivapp_session', JSON.stringify(sessionData));
      }
      setLoadingSession(false);
    };
    if (config !== undefined) checkSession();
  }, [config, navigate]);

  useEffect(() => {
    if (!session || !config) return;
    fetchMenu(); fetchHistory(); fetchCoupons(); fetchRiders(); fetchReviews(); fetchGlobalNotifications(); fetchCRMData(); fetchBranches(); fetchTeamInvites();

    setSettingsForm({
      store_name: config.name, color_accent: config.color_accent,
      cbu_alias: config.cbu_alias, phone: config.phone || '',
      logo_url: config.logo_url, banner_url: config.banner_url,
      lat: config.lat, lng: config.lng,
      schedule_start: config.schedule_start, schedule_end: config.schedule_end,
      auto_schedule: config.auto_schedule,
      mp_access_token: '', mp_public_key: '', mp_client_id: '', mp_client_secret: '',
      delivery_base_price: config.delivery_base_price || 500,
      delivery_price_per_km: config.delivery_price_per_km || 300,
      charge_delivery_in_mp: config.charge_delivery_in_mp ?? true
    });
    setIsOpen(config.is_active);
  }, [session, config]);

  useEffect(() => {
    if (!config?.id) return;
    prevOrdersCount.current = 0;
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    const channel = supabase.channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${config.id}` }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_notifications' }, () => fetchGlobalNotifications())
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [config?.id, viewBranchId, fetchOrders]);

  // 🟢 2. FILTRADO DE TABS SEGÚN ROL
  const visibleTabs = useMemo(() => {
    if (!config) return [];
    
    // Lista base basada en Plan
    let tabs = features.hasProTabs ? ALL_TABS : ALL_TABS.filter(tab => !tab.proOnly);

    // Filtro por ROL
    if (role === 'staff') {
        // Staff (Cajero) SOLO ve Dashboard (para abrir/cerrar) y Pedidos
        tabs = tabs.filter(t => ['dashboard', 'orders'].includes(t.id));
    } else if (role === 'manager') {
        // Manager no ve Facturación (Suscripción)
        tabs = tabs.filter(t => t.id !== 'billing');
    }

    return tabs;
  }, [config, features, role]);

  const filteredOrders = useMemo(() => {
    if (!viewBranchId) return orders;
    return orders.filter(o => o.branch_id === viewBranchId);
  }, [orders, viewBranchId]);

  const filteredHistory = useMemo(() => {
    if (!viewBranchId) return historyOrders;
    return historyOrders.filter(o => o.branch_id === viewBranchId);
  }, [historyOrders, viewBranchId]);

  const getBranchName = (id) => branches.find(b => b.id === id)?.name || null;

  useEffect(() => {
     if (viewBranchId) {
         const branch = branches.find(b => b.id === viewBranchId);
         if (branch) setBranchForm(branch);
     }
  }, [viewBranchId, branches]);

  const calculateDashboardStats = useCallback(() => {
    const combinedOrders = [...(filteredOrders || []), ...(filteredHistory || [])];
    const uniqueOrders = Array.from(new Map(combinedOrders.map(item => [item.id, item])).values());
    const validOrders = uniqueOrders.filter(o => o.status !== 'rechazado');

    let filtered = [];
    const now = new Date();

    if (statsFilter === 'today') {
      const todayStr = now.toLocaleDateString('en-CA');
      filtered = validOrders.filter(o => new Date(o.created_at).toLocaleDateString('en-CA') === todayStr);
    }
    else if (statsFilter === 'week') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      filtered = validOrders.filter(o => new Date(o.created_at) >= d);
    }
    else if (statsFilter === 'month') {
      const m = now.toISOString().slice(0, 7);
      filtered = validOrders.filter(o => o.created_at?.startsWith(m));
    }

    const totalOrders = filtered.length;
    const totalRevenue = filtered.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const chartMap = {};
    filtered.forEach(o => {
      const dateObj = new Date(o.created_at);
      const key = statsFilter === 'today' ? `${dateObj.getHours()}:00` : `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
      chartMap[key] = (chartMap[key] || 0) + (o.total || 0);
    });
    const chartData = Object.keys(chartMap).map(k => ({ name: k, value: chartMap[k] }));
    const productCount = {};
    filtered.forEach(o => o.items.forEach(i => productCount[i.name] = (productCount[i.name] || 0) + i.quantity));
    const topProducts = Object.keys(productCount).map(n => ({ name: n, value: productCount[n] })).sort((a, b) => b.value - a.value).slice(0, 5);
    const cash = filtered.filter(o => o.payment_method === 'efectivo').length;
    const digital = filtered.length - cash;

    setDashboardData({
      totalRevenue, totalOrders, avgTicket, chartData, topProducts,
      paymentData: [{ name: 'Efectivo', value: cash }, { name: 'Digital', value: digital }]
    });
  }, [filteredOrders, filteredHistory, statsFilter]);

  useEffect(() => { calculateDashboardStats(); }, [calculateDashboardStats]);

  const handleSaveBranch = async (e) => { e.preventDefault(); if (!branchForm.name) return alert("El nombre es obligatorio"); const payload = { store_id: config.id, name: branchForm.name, address: branchForm.address, phone: branchForm.phone, lat: branchForm.lat || null, lng: branchForm.lng || null, is_active: true }; try { let result; if (editingBranch) { result = await supabase.from('branches').update(payload).eq('id', editingBranch.id).select(); } else { result = await supabase.from('branches').insert([payload]).select(); } if (result.error) throw result.error; const savedBranch = result.data[0]; setBranches(prev => { if (editingBranch) return prev.map(b => b.id === savedBranch.id ? savedBranch : b); return [...prev, savedBranch]; }); setShowBranchModal(false); setEditingBranch(null); setBranchForm({ name: '', address: '', phone: '', lat: '', lng: '' }); } catch (error) { alert("Error al guardar: " + error.message); } };
  const handleDeleteBranch = async (id) => { if (!window.confirm("¿Seguro que quieres eliminar?")) return; await supabase.from('branches').update({ is_active: false }).eq('id', id); setBranches(prev => prev.filter(b => b.id !== id)); };
  const handleSetMainBranch = async (branchId) => { if (!window.confirm("¿Marcar Principal?")) return; await supabase.from('branches').update({ is_main: false }).eq('store_id', config.id); await supabase.from('branches').update({ is_main: true }).eq('id', branchId); setBranches(prev => prev.map(b => ({ ...b, is_main: b.id === branchId }))); };
  const getBranchLocation = () => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition((pos) => { setBranchForm(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })); alert("📍 Ubicación detectada"); }); } };
  const handleUpdateBranchDetails = async (e) => { e.preventDefault(); if (!viewBranchId) return; try { const { error } = await supabase.from('branches').update({ address: branchForm.address, phone: branchForm.phone, lat: branchForm.lat, lng: branchForm.lng }).eq('id', viewBranchId); if (error) throw error; alert("¡Datos actualizados! 📍"); fetchBranches(); } catch (err) { alert("Error: " + err.message); } };

  const handleCreateProduct = async (e) => { e.preventDefault(); if (!newProduct.name) return alert("Falta el nombre"); const productToSave = { ...newProduct, store_id: config.id, price: newProduct.has_variants ? 0 : parseFloat(newProduct.price || 0), stock: newProduct.has_infinite_stock ? 0 : parseInt(newProduct.stock || 0) }; const { error } = await supabase.from('menu').insert([productToSave]); if (!error) { alert("Plato creado 🎉"); setShowCreateModal(false); setNewProduct({ name: '', description: '', price: '', category: '', image: '', available: true, stock: 100, has_variants: false, variants: [], has_infinite_stock: false, extras: [] }); fetchMenu(); } };
  const handleUpdateProduct = async (e) => { e.preventDefault(); if (!editingProduct) return; const { error } = await supabase.from('menu').update(editingProduct).eq('id', editingProduct.id); if (!error) { alert("Actualizado!"); setShowEditProductModal(false); setEditingProduct(null); fetchMenu(); } };
  const deleteProduct = async (id) => { if (window.confirm("¿Borrar?")) { await supabase.from('menu').delete().eq('id', id); fetchMenu(); } };
  const updateProductField = async (id, f, v) => { setMenuItems(p => p.map(i => i.id === id ? { ...i, [f]: v } : i)); await supabase.from('menu').update({ [f]: v }).eq('id', id); };
  const handleAddExtra = (isEditing = false) => { if (!tempExtra.name || !tempExtra.price) return; const setter = isEditing ? setEditingProduct : setNewProduct; setter(prev => ({ ...prev, extras: [...(prev.extras || []), { ...tempExtra }] })); setTempExtra({ name: '', price: '' }); };
  const handleRemoveExtra = (idx, isEditing = false) => { const setter = isEditing ? setEditingProduct : setNewProduct; setter(prev => ({ ...prev, extras: prev.extras.filter((_, i) => i !== idx) })); };

  const updateOrderStatus = async (id, status) => { await supabase.from('orders').update({ status }).eq('id', id); fetchOrders(); };
  
  const handleMarkAsPaid = async (id) => { 
      if (!window.confirm("¿Confirmar que el cliente realizó el pago?")) return; 
      await supabase.from('orders').update({ paid: true, payment_status: 'paid' }).eq('id', id); 
      fetchOrders(); 
  };

  const handleRejectOrder = async (id) => { const reason = window.prompt("Motivo:"); if (!reason) return; await supabase.from('orders').update({ status: 'rechazado', rejection_reason: reason }).eq('id', id); fetchOrders(); };
  const handlePrintOrder = (order) => { const popupWin = window.open('', '_blank', 'width=350,height=600'); const itemsHtml = (order.items || []).map(i => `<tr><td>${i.quantity}</td><td>${i.name}</td><td>$${(i.finalPrice * i.quantity).toLocaleString()}</td></tr>`).join(''); const html = `<html><body style=\"font-family:monospace\"><h2>${config.name}</h2><p>Pedido #${order.id.slice(0, 6)}</p><hr/><table style=\"width:100%\">${itemsHtml}</table><hr/><h3>TOTAL: $${order.total}</h3><p>${order.note ? 'NOTA: ' + order.note : ''}</p><script>window.print();setTimeout(window.close, 500);</script></body></html>`; popupWin.document.write(html); popupWin.document.close(); };
  const handleCloseRegister = async () => { if (!window.confirm("¿Estás seguro de cerrar la caja?")) return; const validOrders = orders.filter(o => o.status !== 'rechazado' && o.status !== 'archivado'); if (validOrders.length === 0) return alert("No hay pedidos para cerrar."); const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0); const cashTotal = validOrders.filter(o => o.payment_method === 'efectivo').reduce((sum, o) => sum + (o.total || 0), 0); printZTicket({ count: validOrders.length, total: totalRevenue, cash: cashTotal, digital: totalRevenue - cashTotal }, settingsForm.store_name); await supabase.from('orders').update({ status: 'archivado' }).eq('store_id', config.id).neq('status', 'archivado'); setOrders([]); fetchHistory(); };
  const handleImageUpload = async (e, isEditing = false) => { const file = e.target.files[0]; if (!file) return; setUploadingImage(true); try { const fileName = `${config.id}-${Date.now()}`; await supabase.storage.from('menu-images').upload(fileName, file); const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName); if (isEditing) setEditingProduct(prev => ({ ...prev, image: data.publicUrl })); else setNewProduct(prev => ({ ...prev, image: data.publicUrl })); } catch (err) { alert("Error subiendo imagen"); } setUploadingImage(false); };
  const handleStoreImageUpload = async (e, type) => { const file = e.target.files[0]; if (!file) return; setUploadingImage(true); try { const fileName = `${type}-${config.id}-${Date.now()}`; await supabase.storage.from('menu-images').upload(fileName, file); const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName); if (type === 'logo') setSettingsForm(prev => ({ ...prev, logo_url: data.publicUrl })); if (type === 'banner') setSettingsForm(prev => ({ ...prev, banner_url: data.publicUrl })); } catch (err) { alert("Error subiendo imagen"); } setUploadingImage(false); };
    
  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      const { mp_access_token, mp_public_key, mp_client_id, mp_client_secret, store_name, ...restSettings } = settingsForm;
      if (mp_access_token || mp_public_key || mp_client_id || mp_client_secret) {
        const { error: fnError } = await supabase.functions.invoke('save-mp-settings', {
          body: { store_id: config.id, mp_access_token, mp_public_key, mp_client_id, mp_client_secret }
        });
        if (fnError) throw new Error("Error guardando credenciales MP: " + fnError.message);
      }
      const updates = { ...restSettings, name: store_name, delivery_base_price: parseFloat(restSettings.delivery_base_price || 0), delivery_price_per_km: parseFloat(restSettings.delivery_price_per_km || 0) };
      const { error: dbError } = await supabase.from('stores').update(updates).eq('id', config.id);
      if (dbError) throw dbError;
      alert("¡Guardado correctamente! ✅");
      if (refreshStore) refreshStore();
    } catch (error) { console.error(error); alert("Error al guardar: " + error.message); }
  };

  const toggleStore = async () => { const nextStatus = !isOpen; setIsOpen(nextStatus); await supabase.from('stores').update({ is_active: nextStatus }).eq('id', config.id); };
  const handleLogout = async () => { localStorage.removeItem('rivapp_session'); navigate('/login'); };

  const handleCreateRider = async (e) => { e.preventDefault(); await supabase.from('riders').insert([{ ...newRider, store_id: config.id }]); setShowCreateRiderModal(false); fetchRiders(); };
  const deleteRider = async (id) => { if (window.confirm("¿Borrar?")) { await supabase.from('riders').delete().eq('id', id); fetchRiders(); } };
  const handleAssignRider = async (riderId) => { if (!selectedOrderForRider) return; await supabase.from('orders').update({ rider_id: riderId, status: 'listo' }).eq('id', selectedOrderForRider.id); setShowAssignRiderModal(false); fetchOrders(); };
  const handleCreateCoupon = async (e) => { e.preventDefault(); await supabase.from('coupons').insert([{ store_id: config.id, code: newCoupon.code.toUpperCase(), discount: newCoupon.discount }]); setShowCouponModal(false); fetchCoupons(); };
  const deleteCoupon = async (id) => { if (window.confirm("¿Borrar?")) { await supabase.from('coupons').update({ active: false }).eq('id', id); fetchCoupons(); } };
  const handleBulkPriceUpdate = async () => { if (!window.confirm(`¿Seguro?`)) return; const updates = menuItems.map(item => { let cPrice = parseFloat(item.price), nPrice = cPrice, v = parseFloat(priceConfig.value); if (priceConfig.type === 'percent') nPrice = Math.round(cPrice * (priceConfig.action === 'increase' ? 1 + v / 100 : 1 - v / 100)); else nPrice = priceConfig.action === 'increase' ? cPrice + v : cPrice - v; return { ...item, price: nPrice > 0 ? nPrice : 0 }; }); await supabase.from('menu').upsert(updates); setShowPriceModal(false); fetchMenu(); };
  const handleCreatePromo = async (e) => { e.preventDefault(); if (!promoTargetItem) return; let pName = "", pPrice = 0, bPrice = parseFloat(promoTargetItem.price); if (promoConfig.type === 'nxm') { pName = `${promoConfig.buy}x${promoConfig.pay} ${promoTargetItem.name}`; pPrice = bPrice * promoConfig.pay; } else { pName = `${promoTargetItem.name} (${promoConfig.value}% OFF)`; pPrice = Math.round(bPrice * (1 - promoConfig.value / 100)); } await supabase.from('menu').insert([{ name: pName, store_id: config.id, description: `Promoción: ${pName}`, price: pPrice, category: 'Promociones', image: promoTargetItem.image, available: true, stock: promoTargetItem.stock, has_infinite_stock: promoTargetItem.has_infinite_stock, extras: promoTargetItem.extras || [] }]); setShowPromoModal(false); fetchMenu(); };
  const handleSubscribe = async () => { if (!config?.id) return alert("Error: No se identificó la tienda."); const btn = document.activeElement; if (btn) btn.innerText = "Procesando..."; try { const { data, error } = await supabase.functions.invoke('create-checkout', { body: JSON.stringify({ store_id: config.id, price: 40000, title: "Suscripción Plan Profesional", domain_url: window.location.origin }), headers: { "Content-Type": "application/json" } }); if (error) throw new Error(error.message || "Falló la función"); if (data?.init_point) window.open(data.init_point, '_blank'); else alert("Mercado Pago no devolvió el link."); } catch (err) { alert("Error de conexión."); } finally { if (btn) btn.innerText = "Pasarme a PRO"; } };
  const exportCustomers = () => { if (customers.length === 0) return alert("No hay datos."); const headers = ["Cliente", "Telefono", "Pedidos Totales", "Inversion Total", "Ultima Compra"]; const csvContent = [headers.join(';'), ...customers.map(c => [`"${c.customer_name || 'Sin Nombre'}"`, `"${c.customer_phone || ''}"`, c.total_orders, c.total_spent, `"${new Date(c.last_order).toLocaleDateString()}"`].join(';'))].join('\r\n'); const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", `clientes_${config.slug}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); };
  
  const saveOrderChanges = async (e) => { e.preventDefault(); await supabase.from('orders').update({ customer_name: editingOrder.customer_name, total: parseFloat(editingOrder.total), payment_method: editingOrder.payment_method, status: editingOrder.status, note: editingOrder.note }).eq('id', editingOrder.id); setShowEditOrderModal(false); fetchHistory(); fetchOrders(); };
  const openEditOrder = (order) => { setEditingOrder(order); setShowEditOrderModal(true); };
  const handleDeleteSingleOrder = async (id) => { if (window.confirm("¿Borrar?")) { await supabase.from('orders').delete().eq('id', id); fetchHistory(); } };
  const handleDeleteAllHistory = async () => { if (window.confirm("¿Vaciar todo?")) { await supabase.from('orders').delete().eq('store_id', config.id).or('status.eq.archivado,status.eq.rechazado,status.eq.entregado'); fetchHistory(); } };

  // 🟢 TEAM HANDLERS (LOGICA DE ENVÍO DE EMAIL INTEGRADA)
  const handleInviteMember = async (e) => {
      e.preventDefault();
      
      if (!newMember.email) return alert("Falta el email");
      
      const btn = document.activeElement;
      const originalText = btn.innerText;
      btn.innerText = "Enviando...";
      btn.disabled = true;

      try {
          // 1. Guardar en Base de Datos (La invitación formal)
          const payload = {
              store_id: config.id,
              email: newMember.email,
              role: newMember.role,
              branch_id: (newMember.role === 'manager' || newMember.role === 'staff') ? newMember.branch_id : null,
              status: 'pending'
          };

          const { data: dbData, error } = await supabase.from('team_invitations').insert([payload]).select().single();
          
          if (error) throw error;

          // 2. Preparar datos para el correo
          const inviteLink = `${window.location.origin}/login?invite=${dbData.id}`;
          const branchName = newMember.branch_id ? getBranchName(newMember.branch_id) : null;

          // 3. 🚀 Llamar a la Edge Function para disparar el email real
          const { error: fnError } = await supabase.functions.invoke('invite-user', {
              body: {
                  email: newMember.email,
                  role: newMember.role,
                  store_name: config.name,
                  branch_name: branchName,
                  invite_link: inviteLink
              }
          });

          if (fnError) {
              console.error("Error enviando mail:", fnError);
              alert("Invitación guardada, pero falló el envío del correo. (Revisar logs)");
          } else {
              alert(`¡Invitación enviada a ${newMember.email}! 📨`);
          }

          setShowTeamModal(false);
          setNewMember({ email: '', role: 'staff', branch_id: '' }); // Reset
          fetchTeamInvites();

      } catch (err) {
          alert("Error: " + err.message);
      } finally {
          btn.innerText = originalText;
          btn.disabled = false;
      }
  };

  const handleDeleteInvite = async (id) => {
      if(!window.confirm("¿Eliminar invitación?")) return;
      await supabase.from('team_invitations').delete().eq('id', id);
      fetchTeamInvites();
  }

  // ==========================================
  // 6. RENDER
  // ==========================================

  if (loadingSession) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 size={48} className="text-orange-500 animate-spin" /></div>;

  if (!canAccessAdmin) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-[#111] p-10 rounded-[3rem] border border-red-500/30 shadow-2xl">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500"><Lock size={40} /></div>
        <h2 className="text-3xl font-black text-white mb-4">Suscripción Vencida</h2>
        <p className="text-gray-400 mb-8">Tu periodo de servicio ha finalizado.</p>
        <button onClick={handleSubscribe} className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-[#d0ff00] transition-all flex items-center justify-center gap-2">Pagar Ahora <ArrowRight size={20} /></button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#0f0f0f] text-white flex flex-col lg:flex-row relative ${flash ? 'bg-orange-900/50' : ''} transition-colors duration-200`}>

      {/* TOASTS EN TIEMPO REAL */}
      <NotificationToast
        toasts={toasts}
        onDismiss={dismissToast}
        onClickToast={(toast) => {
          const tab = NOTIFICATION_TAB_MAP[toast.type];
          if (tab) setActiveTab(tab);
          markAsRead(toast.id);
        }}
      />

      {/* ALERTA GLOBAL FLOTANTE */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-lg">
            <div className="bg-[#1e1e1e] border-2 border-[#d0ff00] p-5 rounded-2xl shadow-2xl flex items-start gap-4">
              <div className="bg-[#d0ff00]/10 p-3 rounded-xl text-[#d0ff00]"><Bell size={24} /></div>
              <div className="flex-1"><h4 className="font-black text-[#d0ff00] text-lg mb-1">{activeAlert.title}</h4><p className="text-sm text-gray-300">{activeAlert.message}</p></div>
              <button onClick={() => dismissMessage(activeAlert.id)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR (ESCRITORIO) --- */}
      <aside className="hidden lg:flex w-64 border-r border-white/5 flex-col p-4 bg-[#141414] h-screen sticky top-0 z-40 overflow-y-auto custom-scrollbar">
        <div className="font-bold text-2xl mb-8 flex items-center gap-2" style={{ color: accentColor }}><Store /><span>Admin</span></div>

        {/* 🟢 WIDGET DE SELECCIÓN DE SUCURSAL */}
        <div className="mb-6 p-1 rounded-xl bg-white/5 border border-white/10 relative">
          <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1 px-2 pt-1">Viendo datos de:</p>
          <AdminBranchSelector 
            selectedBranchId={viewBranchId}
            onSelect={handleBranchChange}
          />
        </div>

        <nav className="flex flex-col gap-2">
          {visibleTabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl capitalize transition-all ${activeTab === t.id ? 'shadow-lg' : 'text-gray-400 hover:bg-white/5'}`} style={activeTab === t.id ? { backgroundColor: accentColor, color: contrastTextColor } : {}}><t.icon size={20} /> {t.label}</button>))}
        </nav>
        <div className="mt-auto pt-4 border-t border-white/10">
          <button onClick={toggleSound} className={`w-full p-2 rounded-lg font-bold text-sm mb-2 ${isSoundEnabled ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{isSoundEnabled ? "🔊 SONIDO ON" : "🔇 SONIDO OFF"}</button>
          <button onClick={toggleStore} className={`w-full p-2 rounded-lg font-bold text-sm mb-2 ${isOpen ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{isOpen ? "🟢 ABIERTO" : "🔴 CERRADO"}</button>
          <button onClick={handleLogout} className="w-full p-2 text-gray-500 text-sm flex justify-center gap-2 hover:text-white"><LogOut size={14} /> Salir</button>
        </div>
      </aside>

      {/* --- MENÚ INFERIOR (MÓVIL) --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#141414]/95 backdrop-blur-md border-t border-white/10 z-50 flex justify-around items-center p-2 pb-safe">
        {visibleTabs.slice(0, 4).map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className="flex flex-col items-center p-2 transition-all" style={activeTab === t.id ? { color: accentColor } : { color: '#666' }}><t.icon size={24} /><span className="text-[10px] font-bold mt-1">{t.label}</span></button>))}
        <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center p-2 text-gray-500"><MenuIcon size={24} /><span className="text-[10px] font-bold mt-1">Más</span></button>
      </nav>

      {/* --- ÁREA PRINCIPAL --- */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-screen bg-[#050505] pb-24 lg:pb-0">

        {/* HEADER MÓVIL CON SELECTOR */}
        <div className="lg:hidden flex justify-between items-center mb-6">
          <div className="w-2/3">
             <AdminBranchSelector
                selectedBranchId={viewBranchId}
                onSelect={handleBranchChange}
             />
          </div>
        </div>

        {/* ... CONTENIDO TABS ... */}
        {activeTab === 'dashboard' && (
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
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onDelete={deleteNotification}
                  onClearAll={clearAllNotifications}
                  accentColor={accentColor}
                />
                <a href={`/${config?.slug}`} target="_blank" rel="noopener noreferrer" className="bg-[#1a1a1a] border border-white/10 text-white p-3 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 group"><ExternalLink size={20} style={{ color: accentColor }} className="group-hover:scale-110 transition-transform" /> <span className="font-bold text-sm">Ver Local</span></a>
              </div>
            </div>
            {globalNotifications.length > 0 && (
              <div className="bg-[#1a1a1a] p-6 rounded-[2rem] border border-[#d0ff00]/20 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 bg-[#d0ff00]/5 w-32 h-32 blur-3xl rounded-full -mr-10 -mt-10"></div>
                <h3 className="font-black text-[#d0ff00] text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Bell size={16} /> Comunicados Rivapp</h3>
                <div className="space-y-3">
                  {globalNotifications.map(n => (
                    <div key={n.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex justify-between items-start gap-4">
                      <div className="flex-1"><h4 className="font-bold text-white text-sm mb-1">{n.title}</h4><p className="text-xs text-gray-400 leading-relaxed">{n.message}</p><span className="text-[9px] text-gray-600 font-bold uppercase mt-2 block">{new Date(n.created_at).toLocaleDateString()}</span></div>
                      <button onClick={() => dismissMessage(n.id)} className="p-1 hover:bg-white/10 rounded-lg text-gray-600 hover:text-white transition-colors"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 🟢 PROTECCIÓN: Solo mostramos métricas de dinero si NO es staff (Cajero) */}
            {role !== 'staff' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5"><div className="text-gray-400 text-xs font-bold uppercase mb-2">Facturación</div><div className="text-2xl md:text-3xl font-bold text-white">${dashboardData.totalRevenue.toLocaleString()}</div></div>
                  <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5"><div className="text-gray-400 text-xs font-bold uppercase mb-2">Pedidos</div><div className="text-2xl md:text-3xl font-bold text-white">{dashboardData.totalOrders}</div></div>
                  <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5"><div className="text-gray-400 text-xs font-bold uppercase mb-2">Ticket Promedio</div><div className="text-2xl md:text-3xl font-bold text-blue-400">${Math.round(dashboardData.avgTicket).toLocaleString()}</div></div>
                  <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5"><div className="text-gray-400 text-xs font-bold uppercase mb-2">Top Producto</div><div className="text-lg font-bold text-orange-400 truncate">{dashboardData.topProducts[0]?.name || "N/A"}</div></div>
                </div>
            )}

            {/* Si es staff, mostramos solo pedidos activos para que no quede vacio */}
            {role === 'staff' && (
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
                    <div className="text-gray-400 text-xs font-bold uppercase mb-2">Pedidos de Hoy</div>
                    <div className="text-2xl md:text-3xl font-bold text-white">{dashboardData.totalOrders}</div>
                </div>
            )}

            {role !== 'staff' && (
                <div className="col-span-2 bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 h-96 relative">
                  <ResponsiveContainer width="100%" height="100%"><AreaChart data={dashboardData.chartData}><defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={accentColor} stopOpacity={0.3} /><stop offset="95%" stopColor={accentColor} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} /><XAxis dataKey="name" stroke="#666" /><YAxis stroke="#666" /><Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} /><Area type="monotone" dataKey="value" stroke={accentColor} fill="url(#colorValue)" strokeWidth={3} /></AreaChart></ResponsiveContainer>
                </div>
            )}

            <button onClick={handleCloseRegister} className="w-full bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-8 py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 transition-all"><Archive size={20} /> CERRAR CAJA Y ARCHIVAR</button>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="h-full flex flex-col animate-in fade-in">
            <header className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold flex items-center gap-3">Cocina <span className="text-sm bg-[#1a1a1a] px-3 py-1 rounded-full text-gray-400 font-normal">{filteredOrders.length} pedidos</span></h1>
              <div className="flex gap-2">
                <button onClick={toggleSound} className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${isSoundEnabled ? 'bg-green-500/20 text-green-500 border-green-500/20' : 'bg-red-500/20 text-red-500 border-red-500/20'}`}>{isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />} {isSoundEnabled ? "Sonido ON" : "Activar Sonido"}</button>
                <button onClick={() => fetchOrders()} className="p-2 bg-[#1a1a1a] rounded-xl border border-white/10 hover:bg-white/5"><RefreshCw size={20} /></button>
              </div>
            </header>
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
              <KanbanColumn title="ENVIADO" count={filteredOrders.filter(o => o.status === 'pendiente').length}>{filteredOrders.filter(o => o.status === 'pendiente').map(o => <OrderCard key={o.id} order={o} onStatusChange={updateOrderStatus} onReject={handleRejectOrder} onPrint={handlePrintOrder} onMarkPaid={handleMarkAsPaid} branchName={getBranchName(o.branch_id)} />)}</KanbanColumn>
              <KanbanColumn title="CONFIRMADO" count={filteredOrders.filter(o => o.status === 'confirmado').length}>{filteredOrders.filter(o => o.status === 'confirmado').map(o => <OrderCard key={o.id} order={o} onStatusChange={updateOrderStatus} onPrint={handlePrintOrder} onMarkPaid={handleMarkAsPaid} branchName={getBranchName(o.branch_id)} />)}</KanbanColumn>
              <KanbanColumn title="LISTO" count={filteredOrders.filter(o => o.status === 'listo').length}>{filteredOrders.filter(o => o.status === 'listo').map(o => (<OrderCard key={o.id} order={o} onStatusChange={updateOrderStatus} onPrint={handlePrintOrder} onAssignRider={() => { setSelectedOrderForRider(o); setShowAssignRiderModal(true); }} onMarkPaid={handleMarkAsPaid} branchName={getBranchName(o.branch_id)} />))}</KanbanColumn>
              <KanbanColumn title="ENTREGADO" count={filteredOrders.filter(o => o.status === 'entregado').length}>{filteredOrders.filter(o => o.status === 'entregado').map(o => <OrderCard key={o.id} order={o} onStatusChange={updateOrderStatus} onPrint={handlePrintOrder} isFinished onMarkPaid={handleMarkAsPaid} branchName={getBranchName(o.branch_id)} />)}</KanbanColumn>
            </div>
          </div>
        )}

        {/* 🟢 NUEVO TAB: EQUIPO (GESTIÓN DE ROLES) */}
        {activeTab === 'team' && (
          <div className="animate-in fade-in">
            <header className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="text-[#d0ff00]" /> Equipo</h1>
              <div className="flex gap-2">
                {/* 🔵 BOTÓN DE INFORMACIÓN DE ROLES */}
                <button 
                  onClick={() => setShowRolesModal(true)} 
                  className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Ver explicación de roles"
                >
                  <Info size={20} />
                </button>

                <button onClick={() => setShowTeamModal(true)} className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-black shadow-lg hover:scale-105 transition-transform" style={{ backgroundColor: '#d0ff00' }}>
                  <Plus size={18} /> Invitar Miembro
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamInvites.map(invite => (
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
                        {invite.branch_id ? getBranchName(invite.branch_id) : '👑 Global (Todas)'}
                      </span>
                    </div>
                  </div>

                  <button onClick={() => handleDeleteInvite(invite.id)} className="w-full py-3 rounded-xl border border-red-500/20 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all text-xs flex items-center justify-center gap-2">
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
        )}

        {/* ... Resto de Tabs (Menu, CRM, etc.) se mantienen igual ... */}
        {activeTab === 'menu' && (
          <div className="animate-in fade-in">
            <header className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Gestión del Menú</h1><div className="flex gap-2"><button onClick={() => setShowPriceModal(true)} className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 font-bold flex items-center gap-2"><TrendingUp size={16} /> Precios</button><button onClick={() => setShowCreateModal(true)} className="px-6 py-2 rounded-xl font-bold flex items-center gap-2 text-black" style={{ backgroundColor: '#d0ff00' }}><Plus size={18} /> Nuevo</button></div></header>
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar"><button onClick={() => setSelectedCategory("Todos")} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === "Todos" ? "bg-white text-black" : "bg-[#1a1a1a] text-gray-400 border border-white/10 hover:bg-white/10"}`}>Todas</button>{Array.from(new Set(menuItems.map(item => item.category))).filter(Boolean).map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? "bg-white text-black" : "bg-[#1a1a1a] text-gray-400 border border-white/10 hover:bg-white/10"}`}>{cat}</button>))}</div>
            <div className="flex flex-col gap-2">{menuItems.filter(i => selectedCategory === "Todos" ? true : i.category === selectedCategory).map(item => (<div key={item.id} className="bg-[#1a1a1a] p-3 rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all"><div className="flex items-center gap-4 overflow-hidden"><img src={item.image || "https://placehold.co/100"} className="w-12 h-12 rounded-lg object-cover bg-black/40 shrink-0" /><div className="min-w-0"><h3 className="font-bold text-white text-sm truncate">{item.name}</h3><span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{item.category}</span></div></div><div className="flex items-center gap-3 shrink-0"><button onClick={() => { setPromoTargetItem(item); setShowPromoModal(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all" title="Crear Promoción"><Zap size={16} /></button><div className="bg-black/30 px-3 py-1 rounded-lg border border-white/5 font-mono text-sm font-bold w-20 text-center">${item.price}</div><button onClick={() => updateProductField(item.id, 'available', !item.available)} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${item.available ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{item.available ? <CheckCircle size={16} /> : <XCircle size={16} />}</button><button onClick={() => { setEditingProduct(item); setShowEditProductModal(true) }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"><Edit size={16} /></button><button onClick={() => deleteProduct(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button></div></div>))}</div>
          </div>
        )}

        {activeTab === 'crm' && (
          <div className="animate-in fade-in space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><h1 className="text-3xl font-bold italic">Clientes</h1><p className="text-sm text-gray-500">Base de datos de clientes.</p></div><button onClick={exportCustomers} className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#d0ff00] transition-all shadow-xl text-sm"><FileText size={18} /> Exportar CSV</button></header>
            <div className="bg-[#1a1a1a] rounded-[2rem] border border-white/5 overflow-hidden"><table className="w-full text-left text-white border-collapse"><thead className="bg-black/50 text-[10px] font-black uppercase tracking-widest text-gray-500"><tr><th className="p-6">Nombre</th><th className="p-6">Pedidos</th><th className="p-6">Total Gastado</th><th className="p-6">Acción</th></tr></thead><tbody>{customers.map((c, i) => (<tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors text-sm"><td className="p-6 font-bold">{c.customer_name}<div className="text-xs font-normal text-gray-500">{c.customer_phone}</div></td><td className="p-6">{c.total_orders}</td><td className="p-6 font-black text-[#d0ff00]">${c.total_spent?.toLocaleString()}</td><td className="p-6"><a href={`https://wa.me/${c.customer_phone}`} target="_blank" className="bg-[#25d366]/10 text-[#25d366] p-2 rounded-lg hover:bg-[#25d366] hover:text-white transition-all inline-block"><MessageCircle size={18} /></a></td></tr>))}</tbody></table></div>
          </div>
        )}

        {activeTab === 'riders' && (
          <div className="animate-in fade-in">
            <header className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Repartidores</h1><button onClick={() => { setNewRider({ name: '', phone: '', access_pin: '', branch_id: '' }); setShowCreateRiderModal(true); }} className="bg-blue-600 px-6 py-3 rounded-xl font-bold flex gap-2"><Plus /> Nuevo Rider</button></header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {riders.map(r => (
                    <div key={r.id} className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 flex justify-between items-center relative overflow-hidden">
                        {/* Etiqueta de Sucursal */}
                        {r.branches?.name && (
                            <div className="absolute top-0 right-0 bg-[#d0ff00]/10 text-[#d0ff00] text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                                {r.branches.name}
                            </div>
                        )}
                        
                        <div>
                            <h3 className="font-bold text-white flex items-center gap-2"><Bike size={18} /> {r.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">PIN: <span className="font-mono bg-white/10 px-1 rounded text-white">{r.access_pin}</span></p>
                        </div>
                        <button onClick={() => deleteRider(r.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"><Trash2 size={18} /></button>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="animate-in fade-in">
            <header className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Cupones</h1><button onClick={() => setShowCouponModal(true)} className="bg-blue-600 px-6 py-3 rounded-xl font-bold flex gap-2"><Plus /> Crear</button></header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{coupons.map(c => (<div key={c.id} className="bg-[#1a1a1a] p-6 rounded-2xl border border-dashed border-white/20"><div className="text-xs font-bold text-blue-500 mb-1 tracking-widest">CÓDIGO</div><h3 className="text-3xl font-bold text-white mb-2 font-mono">{c.code}</h3><div className="flex justify-between items-end"><div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm font-bold">-{c.discount}% OFF</div><button onClick={() => deleteCoupon(c.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={18} /></button></div></div>))}</div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="animate-in fade-in">
            <header className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Reseñas</h1></header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{reviews.length === 0 ? <p className="text-gray-500">Aún no hay reseñas.</p> : reviews.map(r => (<div key={r.id} className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5"><div className="flex justify-between items-start mb-2"><div><div className="flex gap-1 mb-1">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= r.rating ? accentColor : "transparent"} color={s <= r.rating ? accentColor : "gray"} />)}</div><h4 className="font-bold text-white">{r.customer_name}</h4></div><span className="text-[10px] text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span></div><p className="text-sm text-gray-300 italic">"{r.review || 'Sin comentario'}"</p></div>))}</div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in">
            <header className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Historial</h1><button onClick={handleDeleteAllHistory} className="text-red-500 text-sm font-bold flex items-center gap-2 hover:bg-red-500/10 px-4 py-2 rounded-lg"><Trash2 size={16} /> Vaciar Todo</button></header>
            <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden"><table className="w-full text-left"><thead className="bg-black/50 text-gray-500 text-xs uppercase"><tr className="border-b border-white/5"><th className="p-4">Fecha</th><th className="p-4">Cliente</th><th className="p-4">Sucursal</th><th className="p-4">Total</th><th className="p-4">Acción</th></tr></thead><tbody>{filteredHistory.map(o => (<tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition-colors"><td className="p-4 text-xs">{new Date(o.created_at).toLocaleString()}</td><td className="p-4 font-bold">{o.customer_name}</td><td className="p-4 text-xs text-gray-400">{getBranchName(o.branch_id) || '-'}</td><td className="p-4 font-bold text-green-500">${o.total}</td><td className="p-4 flex gap-2"><button onClick={() => openEditOrder(o)} className="text-blue-500 hover:text-blue-400 p-2 bg-blue-500/10 rounded-lg"><Edit size={16} /></button><button onClick={() => handleDeleteSingleOrder(o.id)} className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded-lg"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* ... Tab Billing & Config ... */}
        {activeTab === 'billing' && (
          <div className="animate-in fade-in max-w-4xl">
            <header className="mb-8"><h1 className="text-3xl font-bold">Suscripción Rivapp</h1></header>
            {(config.plan_type === 'pro' || config.plan_type === 'profesional' || config.subscription_status === 'active' || config.is_demo) ? (
              <div className="bg-gradient-to-br from-blue-900/40 to-[#111] p-8 rounded-3xl border border-blue-500/50 relative overflow-hidden"><div className="relative z-10 flex justify-between items-center"><div><div className="flex items-center gap-3 mb-2"><h3 className="text-blue-400 text-sm font-bold uppercase tracking-widest">TU PLAN ACTUAL</h3><span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1"><Crown size={10} /> PRO</span></div><h2 className="text-5xl font-bold text-white mb-2">Profesional</h2></div><div className="text-right hidden md:block"><div className="text-3xl font-bold text-white">$40.000</div><div className="text-sm text-gray-500">/ mes</div></div></div></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="bg-[#111] p-8 rounded-3xl border border-white/10"><h3 className="text-gray-400 text-sm font-bold uppercase mb-2">TU PLAN ACTUAL</h3><h2 className="text-4xl font-bold text-white mb-6">Plan Emprendedor</h2><ul className="space-y-3 mb-8 text-gray-400 text-sm"><li className="flex items-center gap-2"><Check size={16} /> Menú Digital & Pedidos</li><li className="flex items-center gap-2"><Check size={16} /> Gestión Básica</li></ul></div><div className="p-1 rounded-3xl shadow-2xl" style={{ background: `linear-gradient(to bottom right, ${accentColor}, #0a0a0a)` }}><div className="bg-[#0f0f0f] h-full w-full rounded-[22px] p-8"><h3 className="text-sm font-bold uppercase mb-2" style={{ color: accentColor }}>PLAN PRO</h3><div className="flex items-end gap-2 mb-6"><h2 className="text-5xl font-bold text-white">$40.000</h2></div><button onClick={handleSubscribe} className="w-full py-4 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2" style={{ backgroundColor: accentColor }}>Pasarme a PRO <ChevronRight size={18} /></button></div></div></div>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6 animate-in fade-in max-w-2xl">
            {!viewBranchId ? (
              // 👑 MODO DUEÑO (CONFIGURACIÓN GLOBAL)
              <>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Globe className="text-[#d0ff00]" /> Configuración Global</h1>
                <p className="text-gray-400 text-sm">Gestiona la marca, pagos y crea nuevas sucursales.</p>

                {/* Panel de Sucursales */}
                <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2"><MapPin className="text-[#d0ff00]" /> Mis Sucursales</h3>
                    <button onClick={() => { setEditingBranch(null); setBranchForm({ name: '', address: '', phone: '', lat: '', lng: '' }); setShowBranchModal(true); }} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"><Plus size={16} /> Nueva Sucursal</button>
                  </div>
                  <div className="space-y-3">
                    {branches.map(branch => (
                      <div key={branch.id} className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${branch.is_main ? 'bg-[#d0ff00]/5 border-[#d0ff00]/30' : 'bg-black/30 border-white/5'}`}>
                        <div><h4 className="font-bold text-white flex items-center gap-2">{branch.name}{branch.is_main && <span className="bg-[#d0ff00] text-black text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest">Principal</span>}</h4><p className="text-xs text-gray-400 mt-1">{branch.address}</p></div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleSetMainBranch(branch.id)} title="Marcar Principal" className={`p-2 rounded-lg transition-colors ${branch.is_main ? 'text-[#d0ff00]' : 'text-gray-600 hover:text-[#d0ff00]'}`}><Star size={18} fill={branch.is_main ? "#d0ff00" : "transparent"} /></button>
                          <button onClick={() => { setEditingBranch(branch); setBranchForm(branch); setShowBranchModal(true); }} className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10"><Edit size={18} /></button>
                          <button onClick={() => handleDeleteBranch(branch.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Configuración de Marca (Banner/Logo) */}
                <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 relative overflow-hidden"><div className="h-40 bg-black/50 rounded-xl w-full relative overflow-hidden group"><img src={settingsForm.banner_url || "https://placehold.co/600x200"} className="w-full h-full object-cover opacity-50" /><label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/40 transition-colors"><div className="bg-black/50 p-2 rounded-full text-white flex items-center gap-2 text-xs font-bold border border-white/20"><Camera size={16} /> Cambiar Portada</div><input type="file" className="hidden" onChange={(e) => handleStoreImageUpload(e, 'banner')} /></label></div><div className="absolute top-32 left-6"><div className="w-24 h-24 rounded-full bg-black border-4 border-[#1a1a1a] relative group overflow-hidden"><img src={settingsForm.logo_url || "https://placehold.co/100"} className="w-full h-full object-cover" /><label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={20} className="text-white" /><input type="file" className="hidden" onChange={(e) => handleStoreImageUpload(e, 'logo')} /></label></div></div><div className="mt-14 space-y-4"><div><label className="text-xs text-gray-500 uppercase font-bold">Nombre del Local</label><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white font-bold mt-1" value={settingsForm.store_name} onChange={e => setSettingsForm({ ...settingsForm, store_name: e.target.value })} /></div><div><label className="text-xs text-gray-500 uppercase font-bold">Color de Marca</label><div className="flex items-center gap-2 mt-1"><input type="color" className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" value={settingsForm.color_accent} onChange={e => setSettingsForm({ ...settingsForm, color_accent: e.target.value })} /><span className="text-xs text-gray-400 font-mono">{settingsForm.color_accent}</span></div></div></div></div>

                {/* 🆕 CONFIGURACIÓN DE ENVÍOS */}
                <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                    <Bike size={16} /> Configuración de Envíos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-bold">Precio Base ($)</label>
                      <input
                        type="number"
                        className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1"
                        value={settingsForm.delivery_base_price}
                        onChange={e => setSettingsForm({ ...settingsForm, delivery_base_price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-bold">Precio x Km ($)</label>
                      <input
                        type="number"
                        className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1"
                        value={settingsForm.delivery_price_per_km}
                        onChange={e => setSettingsForm({ ...settingsForm, delivery_price_per_km: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-[#d0ff00]"
                      checked={settingsForm.charge_delivery_in_mp}
                      onChange={e => setSettingsForm({ ...settingsForm, charge_delivery_in_mp: e.target.checked })}
                    />
                    <div>
                      <p className="text-sm font-bold text-white">Cobrar envío en Mercado Pago</p>
                      <p className="text-xs text-gray-500">Si se desactiva, el envío se cobra en efectivo al entregar.</p>
                    </div>
                  </div>
                </div>

                {/* Configuración MercadoPago Global (PROTEGIDA) */}
                <div className="bg-blue-900/10 p-6 rounded-3xl border border-blue-500/20 space-y-4">
                  <h3 className="text-blue-400 font-bold text-sm flex items-center gap-2"><CreditCard size={16} /> Integración Mercado Pago (Cobros Online)</h3>
                  <p className="text-xs text-gray-400">Pega aquí tus credenciales de producción. 🔒 Estos datos se guardan encriptados.</p>
                  <div><label className="text-xs text-gray-500 uppercase font-bold">Access Token (Production)</label><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1" type="password" placeholder="APP_USR-..." value={settingsForm.mp_access_token} onChange={e => setSettingsForm({ ...settingsForm, mp_access_token: e.target.value })} /></div>
                  <div><label className="text-xs text-gray-500 uppercase font-bold">Public Key (Production)</label><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1" placeholder="TEST-..." value={settingsForm.mp_public_key} onChange={e => setSettingsForm({ ...settingsForm, mp_public_key: e.target.value })} /></div>
                </div>
                <button onClick={saveSettings} className="w-full py-4 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2" style={{ backgroundColor: accentColor, color: contrastTextColor }}><Save size={20} /> Guardar Cambios Globales</button>
              </>
            ) : (
              // 📍 MODO SUCURSAL (CONFIGURACIÓN ESPECÍFICA)
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">{getBranchName(viewBranchId)}</h1>
                    <p className="text-gray-400 text-sm">Configurando datos específicos de este local.</p>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest border-b border-white/10 pb-2 mb-4">Información de Contacto</h3>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Dirección Física</label>
                    <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1" value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Teléfono / WhatsApp de Sucursal</label>
                    <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1" value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} />
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest border-b border-white/10 pb-2 mb-4">Geolocalización</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-gray-500 uppercase font-bold">Latitud</label><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1" value={branchForm.lat || ''} onChange={e => setBranchForm({ ...branchForm, lat: e.target.value })} /></div>
                    <div><label className="text-xs text-gray-500 uppercase font-bold">Longitud</label><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1" value={branchForm.lng || ''} onChange={e => setBranchForm({ ...branchForm, lng: e.target.value })} /></div>
                  </div>
                  <button onClick={getBranchLocation} className="text-blue-400 text-xs font-bold flex items-center gap-2 hover:text-blue-300"><MapPin size={14} /> Usar mi ubicación actual</button>
                </div>

                <button onClick={handleUpdateBranchDetails} className="w-full py-4 rounded-xl font-bold bg-[#d0ff00] text-black shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"><Save size={20} /> Actualizar Sucursal</button>
              </>
            )}
          </div>
        )}

      </main>

      {/* ==========================================
          7. MODALES GLOBALES
         ========================================== */}

      {/* Modal Sucursales, Productos, etc (Se mantienen igual) */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
          <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative">
            <button onClick={() => setShowBranchModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
            <h2 className="text-white font-bold text-xl mb-4">{editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
            <form onSubmit={handleSaveBranch} className="space-y-4">
              <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Nombre (ej: Centro)" value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} />
              <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Dirección" value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} />
              <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Teléfono" value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className="bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Latitud" value={branchForm.lat || ''} onChange={e => setBranchForm({ ...branchForm, lat: e.target.value })} />
                <input className="bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Longitud" value={branchForm.lng || ''} onChange={e => setBranchForm({ ...branchForm, lng: e.target.value })} />
              </div>
              <button type="button" onClick={getBranchLocation} className="w-full py-2 text-xs font-bold text-blue-400 flex items-center justify-center gap-1 hover:text-blue-300"><MapPin size={12} /> Detectar mi ubicación</button>
              <button type="submit" className="w-full py-3 rounded-xl font-bold bg-[#d0ff00] text-black">Guardar Sucursal</button>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 MODAL DE INVITACIÓN DE MIEMBRO */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
          <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative">
            <button onClick={() => setShowTeamModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
            <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2"><Mail className="text-[#d0ff00]" /> Invitar Miembro</h2>
            <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase">Email del Usuario</label>
                    <input type="email" className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1" placeholder="ejemplo@email.com" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} required />
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase">Rol</label>
                    <div className="flex gap-2 mt-1">
                        <button type="button" onClick={() => setNewMember({ ...newMember, role: 'manager' })} className={`flex-1 py-2 rounded-lg font-bold border ${newMember.role === 'manager' ? 'bg-[#d0ff00]/20 border-[#d0ff00] text-[#d0ff00]' : 'border-white/10 text-gray-500'}`}>Gerente</button>
                        <button type="button" onClick={() => setNewMember({ ...newMember, role: 'staff' })} className={`flex-1 py-2 rounded-lg font-bold border ${newMember.role === 'staff' ? 'bg-blue-600/20 border-blue-600 text-blue-500' : 'border-white/10 text-gray-500'}`}>Cajero</button>
                        <button type="button" onClick={() => setNewMember({ ...newMember, role: 'admin' })} className={`flex-1 py-2 rounded-lg font-bold border ${newMember.role === 'admin' ? 'bg-purple-600/20 border-purple-600 text-purple-500' : 'border-white/10 text-gray-500'}`}>Admin</button>
                    </div>
                </div>

                {/* Si es Gerente o Staff, debe seleccionar sucursal */}
                {(newMember.role === 'manager' || newMember.role === 'staff') && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs text-gray-500 font-bold uppercase">Asignar a Sucursal</label>
                        <select 
                            className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1 outline-none"
                            value={newMember.branch_id}
                            onChange={e => setNewMember({ ...newMember, branch_id: e.target.value })}
                            required
                        >
                            <option value="">Selecciona una sucursal...</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <button type="submit" className="w-full py-3 rounded-xl font-bold bg-[#d0ff00] text-black shadow-lg">Enviar Invitación</button>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 MODAL DE EXPLICACIÓN DE ROLES (NUEVO) */}
      {showRolesModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-[#1a1a1a] p-8 rounded-3xl w-full max-w-2xl border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button onClick={() => setShowRolesModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X size={24} /></button>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Niveles de Acceso</h2>
              <p className="text-gray-400">¿Qué puede hacer cada miembro de tu equipo?</p>
            </div>

            <div className="grid gap-4">
              
              {/* ROL: ADMIN */}
              <div className="bg-black/40 p-4 rounded-2xl border border-purple-500/30 flex gap-4">
                <div className="bg-purple-500/20 p-3 rounded-xl h-fit text-purple-400"><Crown size={24} /></div>
                <div>
                  <h3 className="text-purple-400 font-bold text-lg">Admin (Dueño)</h3>
                  <p className="text-gray-300 text-sm mb-2">Acceso total a todo el negocio.</p>
                  <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                    <li>Ve y gestiona <strong>todas las sucursales</strong>.</li>
                    <li>Acceso a Facturación y Suscripción.</li>
                    <li>Puede crear/borrar productos y empleados.</li>
                    <li>Configuración global de la marca.</li>
                  </ul>
                </div>
              </div>

              {/* ROL: GERENTE */}
              <div className="bg-black/40 p-4 rounded-2xl border border-[#d0ff00]/30 flex gap-4">
                <div className="bg-[#d0ff00]/20 p-3 rounded-xl h-fit text-[#d0ff00]"><Store size={24} /></div>
                <div>
                  <h3 className="text--[#d0ff00] font-bold text-lg">Gerente (Manager)</h3>
                  <p className="text-gray-300 text-sm mb-2">Líder de una sucursal específica.</p>
                  <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                    <li>Solo ve los datos de <strong>SU sucursal asignada</strong>.</li>
                    <li>Puede editar el Menú y Precios.</li>
                    <li>Gestiona los Riders de su local.</li>
                    <li>Ve métricas de ventas de su local.</li>
                    <li>❌ No puede ver facturación global ni otras sucursales.</li>
                  </ul>
                </div>
              </div>

              {/* ROL: CAJERO */}
              <div className="bg-black/40 p-4 rounded-2xl border border-blue-500/30 flex gap-4">
                <div className="bg-blue-500/20 p-3 rounded-xl h-fit text-blue-400"><User size={24} /></div>
                <div>
                  <h3 className="text-blue-400 font-bold text-lg">Cajero (Staff)</h3>
                  <p className="text-gray-300 text-sm mb-2">Operativo para el día a día.</p>
                  <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                    <li>Recibe y gestiona pedidos (Confirmar, Listo, Entregar).</li>
                    <li>Puede abrir/cerrar la sucursal.</li>
                    <li>❌ No puede editar productos ni precios.</li>
                    <li>❌ No puede ver métricas financieras sensibles.</li>
                  </ul>
                </div>
              </div>

            </div>
            
            <button onClick={() => setShowRolesModal(false)} className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white transition-colors">
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* 🟢 MODAL DE EDICIÓN DE PEDIDO MEJORADO (VISUALIZACIÓN DE PAGO) */}
      {showEditOrderModal && editingOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
          <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl relative">
            <button onClick={() => setShowEditOrderModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
            <h2 className="text-white font-bold text-xl mb-4">Editar Pedido #{editingOrder.id.slice(0,6)}</h2>
            
            {/* INFO DE PAGO */}
            <div className="mb-4 bg-[#111] p-3 rounded-xl border border-white/5 flex justify-between items-center">
                <span className="text-gray-400 text-xs">Estado del Pago</span>
                <span className={`font-bold text-sm ${(editingOrder.payment_status === 'paid' || editingOrder.paid) ? 'text-green-500' : 'text-blue-400'}`}>
                    {(editingOrder.payment_status === 'paid' || editingOrder.paid) ? 'PAGADO ✅' : 'PENDIENTE'}
                </span>
            </div>
            {editingOrder.payment_id && (
                <div className="text-xs text-gray-500 mb-4 text-right font-mono">Ref MP: {editingOrder.payment_id}</div>
            )}

            <form onSubmit={saveOrderChanges} className="space-y-4">
              <div><label className="text-xs text-gray-400">Nombre Cliente</label><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" value={editingOrder.customer_name} onChange={e => setEditingOrder({ ...editingOrder, customer_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-gray-400">Total ($)</label><input type="number" className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" value={editingOrder.total} onChange={e => setEditingOrder({ ...editingOrder, total: e.target.value })} /></div><div><label className="text-xs text-gray-400">Estado</label><select className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" value={editingOrder.status} onChange={e => setEditingOrder({ ...editingOrder, status: e.target.value })}><option value="pendiente">Pendiente</option><option value="confirmado">Confirmado</option><option value="listo">Listo</option><option value="entregado">Entregado</option><option value="archivado">Archivado</option><option value="rechazado">Rechazado</option></select></div></div><div><label className="text-xs text-gray-400">Pago</label><select className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" value={editingOrder.payment_method} onChange={e => setEditingOrder({ ...editingOrder, payment_method: e.target.value })}><option value="efectivo">Efectivo</option><option value="mercadopago">MercadoPago</option></select></div><div><label className="text-xs text-gray-400">Nota</label><textarea className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white h-20 resize-none" value={editingOrder.note || ''} onChange={e => setEditingOrder({ ...editingOrder, note: e.target.value })} /></div><button type="submit" className="w-full py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {showAssignRiderModal && selectedOrderForRider && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
            <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative">
                <button onClick={() => setShowAssignRiderModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
                <h2 className="text-white font-bold text-xl mb-1">Asignar Rider</h2>
                
                {/* Mostramos para qué sucursal es el pedido */}
                <p className="text-xs text-gray-500 mb-4">
                    Para pedido en: <strong className="text-[#d0ff00]">{getBranchName(selectedOrderForRider.branch_id)}</strong>
                </p>

                <div className="space-y-2">
                    {riders
                        // 🟢 FILTRO MÁGICO: Solo riders de esta sucursal (o globales si branch_id es null)
                        .filter(r => !r.branch_id || r.branch_id === selectedOrderForRider.branch_id)
                        .map(r => (
                        <button key={r.id} onClick={() => handleAssignRider(r.id)} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white flex justify-between items-center hover:border-white/30 hover:bg-white/5 transition-all">
                            <span className="font-bold flex items-center gap-2"><Bike size={16} /> {r.name}</span>
                            <span className="text-xs bg-white/10 px-2 py-1 rounded">Seleccionar</span>
                        </button>
                    ))}
                    
                    {riders.filter(r => !r.branch_id || r.branch_id === selectedOrderForRider.branch_id).length === 0 && (
                        <div className="text-center py-4 bg-red-500/10 rounded-xl border border-red-500/20">
                            <p className="text-red-500 text-sm font-bold">No hay riders en esta sucursal.</p>
                            <p className="text-xs text-gray-400 mt-1">Crea uno en la pestaña Riders.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] overflow-y-auto"><div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl relative my-8"><button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button><h2 className="text-white font-bold text-xl mb-4">Nuevo Producto</h2><form onSubmit={handleCreateProduct} className="space-y-4"><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Nombre" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} /><textarea className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white h-20 resize-none" placeholder="Descripción" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} /><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Categoría" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} /><div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:border-white/30 transition-colors cursor-pointer relative">{uploadingImage ? <Loader2 className="animate-spin text-white" /> : <CloudUpload size={24} />}<span className="text-xs mt-2">{newProduct.image ? "Imagen cargada" : "Subir Foto"}</span><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} /></div><div className="bg-white/5 p-3 rounded-xl"><div className="flex items-center justify-between mb-2"><label className="text-sm font-bold flex items-center gap-2"><Layers size={16} /> ¿Tiene Variantes?</label><input type="checkbox" className="w-5 h-5 accent-orange-500" checked={newProduct.has_variants} onChange={e => setNewProduct({ ...newProduct, has_variants: e.target.checked })} /></div>{!newProduct.has_variants && (<input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Precio Único" type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />)}</div><div className="bg-white/5 p-3 rounded-xl"><label className="text-sm font-bold flex items-center gap-2 mb-2"><Plus size={16} /> Extras (Opcional)</label><div className="flex gap-2 mb-2"><input className="flex-1 bg-black/50 border border-white/10 p-2 rounded-lg text-sm text-white" placeholder="Ej: Bacon" value={tempExtra.name} onChange={e => setTempExtra({ ...tempExtra, name: e.target.value })} /><input className="w-20 bg-black/50 border border-white/10 p-2 rounded-lg text-sm text-white" placeholder="$" type="number" value={tempExtra.price} onChange={e => setTempExtra({ ...tempExtra, price: e.target.value })} /><button type="button" onClick={() => handleAddExtra(false)} className="bg-white/10 p-2 rounded-lg hover:bg-white/20"><Plus size={16} /></button></div><div className="flex flex-wrap gap-2">{newProduct.extras.map((ex, i) => (<span key={i} className="bg-black/40 border border-white/10 px-2 py-1 rounded text-xs flex items-center gap-1">{ex.name} (${ex.price}) <button type="button" onClick={() => handleRemoveExtra(i, false)}><X size={12} /></button></span>))}</div></div><div className="flex items-center justify-between bg-white/5 p-3 rounded-xl"><label className="text-sm font-bold flex items-center gap-2"><Infinity size={16} /> ¿Stock Infinito?</label><input type="checkbox" className="w-5 h-5 accent-orange-500" checked={newProduct.has_infinite_stock} onChange={e => setNewProduct({ ...newProduct, has_infinite_stock: e.target.checked })} /></div>{!newProduct.has_infinite_stock && (<input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Cantidad Stock" type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} />)}<div className="flex gap-2 mt-4"><button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-700 py-3 rounded-xl font-bold">Cancelar</button><button type="submit" className="flex-1 py-3 rounded-xl font-bold" style={{ backgroundColor: accentColor, color: contrastTextColor }}>Guardar</button></div></form></div></div>
      )}

      {showEditProductModal && editingProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] overflow-y-auto"><div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl relative my-8"><button onClick={() => setShowEditProductModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button><h2 className="text-white font-bold text-xl mb-4">Editar Producto</h2><form onSubmit={handleUpdateProduct} className="space-y-4"><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} /><textarea className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white h-20 resize-none" value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} /><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} /><div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:border-white/30 transition-colors cursor-pointer relative">{uploadingImage ? <Loader2 className="animate-spin text-white" /> : <CloudUpload size={24} />}<span className="text-xs mt-2">Cambiar Foto</span><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, true)} /></div><div className="bg-white/5 p-3 rounded-xl"><div className="flex items-center justify-between mb-2"><label className="text-sm font-bold flex items-center gap-2"><Layers size={16} /> ¿Tiene Variantes?</label><input type="checkbox" className="w-5 h-5 accent-orange-500" checked={editingProduct.has_variants} onChange={e => setEditingProduct({ ...editingProduct, has_variants: e.target.checked })} /></div>{!editingProduct.has_variants && (<input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} />)}</div><div className="bg-white/5 p-3 rounded-xl"><label className="text-sm font-bold flex items-center gap-2 mb-2"><Plus size={16} /> Extras</label><div className="flex gap-2 mb-2"><input className="flex-1 bg-black/50 border border-white/10 p-2 rounded-lg text-sm text-white" placeholder="Ej: Bacon" value={tempExtra.name} onChange={e => setTempExtra({ ...tempExtra, name: e.target.value })} /><input className="w-20 bg-black/50 border border-white/10 p-2 rounded-lg text-sm text-white" placeholder="$" type="number" value={tempExtra.price} onChange={e => setTempExtra({ ...tempExtra, price: e.target.value })} /><button type="button" onClick={() => handleAddExtra(true)} className="bg-white/10 p-2 rounded-lg hover:bg-white/20"><Plus size={16} /></button></div><div className="flex flex-wrap gap-2">{(editingProduct.extras || []).map((ex, i) => (<span key={i} className="bg-black/40 border border-white/10 px-2 py-1 rounded text-xs flex items-center gap-1">{ex.name} (${ex.price}) <button type="button" onClick={() => handleRemoveExtra(i, true)}><X size={12} /></button></span>))}</div></div><div className="flex items-center justify-between bg-white/5 p-3 rounded-xl"><label className="text-sm font-bold flex items-center gap-2"><Infinity size={16} /> ¿Stock Infinito?</label><input type="checkbox" className="w-5 h-5 accent-orange-500" checked={editingProduct.has_infinite_stock} onChange={e => setEditingProduct({ ...editingProduct, has_infinite_stock: e.target.checked })} /></div>{!editingProduct.has_infinite_stock && (<input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" type="number" value={editingProduct.stock} onChange={e => setEditingProduct({ ...editingProduct, stock: e.target.value })} />)}<button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4">Guardar Cambios</button></form></div></div>
      )}

      {showPromoModal && promoTargetItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]"><div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative"><button onClick={() => setShowPromoModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button><h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2"><Zap className="text-yellow-500" /> Crear Promoción</h2><p className="text-sm text-gray-400 mb-4">Producto: <strong className="text-white">{promoTargetItem.name}</strong></p><div className="space-y-4"><div className="flex gap-2"><button onClick={() => setPromoConfig({ ...promoConfig, type: 'discount' })} className={`flex-1 py-2 rounded-lg font-bold border ${promoConfig.type === 'discount' ? 'bg-blue-600/20 border-blue-600 text-blue-500' : 'border-white/10 text-gray-500'}`}>% Descuento</button><button onClick={() => setPromoConfig({ ...promoConfig, type: 'nxm' })} className={`flex-1 py-2 rounded-lg font-bold border ${promoConfig.type === 'nxm' ? 'bg-purple-600/20 border-purple-600 text-purple-500' : 'border-white/10 text-gray-500'}`}>NxM</button></div>{promoConfig.type === 'discount' && (<div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl p-3"><span className="text-gray-400 font-bold">%</span><input className="bg-transparent text-white outline-none w-full text-lg font-bold" type="number" value={promoConfig.value} onChange={e => setPromoConfig({ ...promoConfig, value: e.target.value })} /></div>)}{promoConfig.type === 'nxm' && (<div className="flex items-center gap-2"><div className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3"><label className="text-[10px] text-gray-500 block uppercase font-bold">Lleva</label><input className="bg-transparent text-white outline-none w-full text-lg font-bold" type="number" value={promoConfig.buy} onChange={e => setPromoConfig({ ...promoConfig, buy: e.target.value })} /></div><span className="font-bold text-gray-500">X</span><div className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3"><label className="text-[10px] text-gray-500 block uppercase font-bold">Paga</label><input className="bg-transparent text-white outline-none w-full text-lg font-bold" type="number" value={promoConfig.pay} onChange={e => setPromoConfig({ ...promoConfig, pay: e.target.value })} /></div></div>)}<button onClick={handleCreatePromo} className="w-full py-3 rounded-xl font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition-colors">Lanzar Promo</button></div></div></div>
      )}

      {showPriceModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]"><div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative"><button onClick={() => setShowPriceModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button><h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2"><TrendingUp /> Precios Masivos</h2><div className="space-y-4"><div className="flex gap-2"><button onClick={() => setPriceConfig({ ...priceConfig, action: 'increase' })} className={`flex-1 py-2 rounded-lg font-bold border ${priceConfig.action === 'increase' ? 'bg-green-600/20 border-green-600 text-green-500' : 'border-white/10 text-gray-500'}`}>Aumentar</button><button onClick={() => setPriceConfig({ ...priceConfig, action: 'decrease' })} className={`flex-1 py-2 rounded-lg font-bold border ${priceConfig.action === 'decrease' ? 'bg-red-600/20 border-red-600 text-red-500' : 'border-white/10 text-gray-500'}`}>Reducir</button></div><div className="flex gap-2"><button onClick={() => setPriceConfig({ ...priceConfig, type: 'percent' })} className={`flex-1 py-2 rounded-lg font-bold border ${priceConfig.type === 'percent' ? 'bg-blue-600/20 border-blue-600 text-blue-500' : 'border-white/10 text-gray-500'}`}>% Porcentaje</button><button onClick={() => setPriceConfig({ ...priceConfig, type: 'fixed' })} className={`flex-1 py-2 rounded-lg font-bold border ${priceConfig.type === 'fixed' ? 'bg-blue-600/20 border-blue-600 text-blue-500' : 'border-white/10 text-gray-500'}`}>$ Fijo</button></div><input type="number" placeholder="Valor (ej: 10)" className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-white text-center font-bold text-lg" value={priceConfig.value} onChange={e => setPriceConfig({ ...priceConfig, value: e.target.value })} /><button onClick={handleBulkPriceUpdate} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600">Aplicar</button></div></div></div>
      )}

      {showCouponModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]"><div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative"><button onClick={() => setShowCouponModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button><h2 className="text-white font-bold text-xl mb-4">Nuevo Cupón</h2><form onSubmit={handleCreateCoupon} className="space-y-4"><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white uppercase" placeholder="CÓDIGO (ej: RIVA10)" value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })} /><div className="flex items-center gap-2"><span className="text-gray-400 font-bold">Descuento:</span><input className="w-20 bg-black/50 border border-white/10 p-2 rounded-lg text-white text-center" type="number" value={newCoupon.discount} onChange={e => setNewCoupon({ ...newCoupon, discount: e.target.value })} /><span className="text-white font-bold">%</span></div><button className="w-full py-3 rounded-xl font-bold" style={{ backgroundColor: accentColor, color: contrastTextColor }}>Crear Cupón</button></form></div></div>
      )}

      {showCreateRiderModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]"><div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative"><button onClick={() => setShowCreateRiderModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button><h2 className="text-white font-bold text-xl mb-4">Nuevo Rider</h2><form onSubmit={handleCreateRider} className="space-y-3"><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Nombre" value={newRider.name} onChange={e => setNewRider({ ...newRider, name: e.target.value })} required /><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="PIN de Acceso" value={newRider.access_pin} onChange={e => setNewRider({ ...newRider, access_pin: e.target.value })} required />
        
        {/* 🟢 SELECTOR DE SUCURSAL PARA RIDER */}
        <div><label className="text-xs text-gray-500 font-bold uppercase ml-1">Asignar a Sucursal</label><select className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1 outline-none" value={newRider.branch_id || ''} onChange={e => setNewRider({ ...newRider, branch_id: e.target.value })} required><option value="">Selecciona sucursal...</option>{branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}</select></div><button className="w-full py-3 rounded-xl font-bold" style={{ backgroundColor: accentColor, color: contrastTextColor }}>Crear Rider</button></form></div></div>
      )}

    </div>
  );
}
