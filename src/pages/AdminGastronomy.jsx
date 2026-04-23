import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useStore } from '../context/useStore';
import { useEntitlements } from '../hooks/useEntitlements';
import { useNavigate } from 'react-router-dom';
import AdminBranchSelector from '../components/admin/AdminBranchSelector';
import NotificationToast from '../components/admin/NotificationToast';
import { useNotifications, NOTIFICATION_TAB_MAP } from '../hooks/useNotifications';
import { logger } from '../utils/logger';

import { Lock, Store, ArrowRight, Loader2, LogOut, Menu as MenuIcon, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { ALL_TABS, BELL_SOUND } from './admin-gastronomy/constants';
import { getContrastText, printZTicket } from './admin-gastronomy/utils';

import DashboardTab from './admin-gastronomy/DashboardTab';
import OrdersTab from './admin-gastronomy/OrdersTab';
import TeamTab from './admin-gastronomy/TeamTab';
import MenuTab from './admin-gastronomy/MenuTab';
import BillingTab from './admin-gastronomy/BillingTab';
import ConfigTab from './admin-gastronomy/ConfigTab';
import CRMTab from './admin-gastronomy/CRMTab';
import RidersTab from './admin-gastronomy/RidersTab';
import CouponsTab from './admin-gastronomy/CouponsTab';
import ReviewsTab from './admin-gastronomy/ReviewsTab';
import HistoryTab from './admin-gastronomy/HistoryTab';

import {
  BranchModal, TeamModal, RolesModal, EditOrderModal, AssignRiderModal,
  CreateProductModal, EditProductModal, PromoModal, PriceModal, CouponModal, CreateRiderModal,
} from './admin-gastronomy/AdminModals';

import Button from '../components/shared/ui/Button';
import Eyebrow from '../components/shared/ui/Eyebrow';
import Rule from '../components/shared/ui/Rule';

export default function AdminGastronomy() {
  const { store: config, refreshStore, role } = useStore();
  const { features, canAccessAdmin } = useEntitlements(config);
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
  } = useNotifications(config?.id, { soundEnabled: false });

  const [, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOpen, setIsOpen] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [session, setSession] = useState(null);
  const [flash, setFlash] = useState(false);

  const [viewBranchId, setViewBranchId] = useState(() => localStorage.getItem('admin_view_branch') || '');
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

  const [teamInvites, setTeamInvites] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', role: 'staff', branch_id: '' });

  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [riders, setRiders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgTicket: 0,
    chartData: [],
    topProducts: [],
    paymentData: [],
  });
  const statsFilter = 'today';

  const [globalNotifications, setGlobalNotifications] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [dismissedMessages, setDismissedMessages] = useState(() => {
    const saved = localStorage.getItem('rivapp_dismissed_msgs');
    return saved ? JSON.parse(saved) : [];
  });

  const [settingsForm, setSettingsForm] = useState({
    store_name: '', color_accent: '#ff6b00', cbu_alias: '', phone: '',
    logo_url: '', banner_url: '', lat: -31.546787, lng: -68.56415,
    schedule_start: '20:00', schedule_end: '00:00', auto_schedule: false,
    mp_access_token: '', mp_public_key: '', mp_client_id: '', mp_client_secret: '',
    delivery_base_price: 500, delivery_price_per_km: 300, charge_delivery_in_mp: true,
  });

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
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', category: '', image: '',
    available: true, stock: 100, has_variants: false, variants: [],
    has_infinite_stock: false, extras: [],
  });
  const [tempExtra, setTempExtra] = useState({ name: '', price: '' });
  const [promoConfig, setPromoConfig] = useState({ type: 'discount', value: 15, buy: 2, pay: 1 });
  const [newRider, setNewRider] = useState({ name: '', phone: '', access_pin: '', branch_id: '' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: 10 });
  const [priceConfig, setPriceConfig] = useState({ type: 'percent', action: 'increase', value: 0 });
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const accentColor = config?.color_accent || '#ff6b00';
  const contrastTextColor = getContrastText(accentColor);
  const audioRef = useRef(new Audio(BELL_SOUND));
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);
  const prevOrdersCount = useRef(0);

  const HISTORY_PAGE_SIZE = 50;

  const toggleSound = useCallback(() => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    soundEnabledRef.current = newState;
    if (newState) {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        })
        .catch((e) => logger.debug('Audio permission pending', e));
    }
  }, [isSoundEnabled]);

  const playNotification = useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 1000);
    if (soundEnabledRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => logger.error('Error audio:', e));
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!config) return;
    const { data } = await supabase
      .from('orders')
      .select('*, riders(name)')
      .eq('store_id', config.id)
      .neq('status', 'archivado')
      .order('created_at', { ascending: false });
    if (data) {
      setOrders(data);
      const visibleOrders = !viewBranchId ? data : data.filter((o) => o.branch_id === viewBranchId);
      const currentPending = visibleOrders.filter((o) => o.status === 'pendiente').length;
      if (currentPending > prevOrdersCount.current) playNotification();
      prevOrdersCount.current = currentPending;
    }
  }, [config, viewBranchId, playNotification]);

  const fetchGlobalNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('global_notifications')
      .select('*')
      .eq('is_active', true)
      .or(`target.eq.all,target.eq.gastronomia`)
      .order('created_at', { ascending: false });
    if (data && data.length > 0) {
      const filtered = data.filter((n) => !dismissedMessages.includes(n.id));
      setGlobalNotifications(filtered);
      if (filtered.length > 0) {
        const newest = filtered[0];
        if (new Date(newest.created_at) > new Date(Date.now() - 5 * 60000)) setActiveAlert(newest);
      }
    }
  }, [dismissedMessages]);

  const fetchBranches = useCallback(async () => {
    const { data } = await supabase
      .from('branches')
      .select('*')
      .eq('store_id', config.id)
      .eq('is_active', true)
      .order('name');
    if (data) setBranches(data);
  }, [config?.id]);
  const fetchRiders = useCallback(async () => {
    const { data } = await supabase.from('riders').select('*, branches(name)').eq('store_id', config.id).order('id');
    if (data) setRiders(data || []);
  }, [config?.id]);
  const fetchMenu = useCallback(async () => {
    const { data } = await supabase.from('menu').select('*').eq('store_id', config.id).order('id', { ascending: false });
    if (data) setMenuItems(data || []);
  }, [config?.id]);

  const fetchHistory = useCallback(
    async (reset = true) => {
      const offset = reset ? 0 : historyOrders.length;
      if (!reset) setHistoryLoadingMore(true);
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', config.id)
        .or('status.eq.archivado,status.eq.rechazado,status.eq.entregado')
        .order('created_at', { ascending: false })
        .range(offset, offset + HISTORY_PAGE_SIZE - 1);
      if (data) {
        if (reset) setHistoryOrders(data);
        else setHistoryOrders((prev) => [...prev, ...data]);
        setHistoryHasMore(data.length === HISTORY_PAGE_SIZE);
      }
      setHistoryLoadingMore(false);
    },
    [config?.id, historyOrders.length]
  );

  const fetchCoupons = useCallback(async () => {
    const { data } = await supabase.from('coupons').select('*').eq('store_id', config.id).order('id');
    if (data) setCoupons(data || []);
  }, [config?.id]);
  const fetchReviews = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', config.id)
      .not('rating', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setReviews(data || []);
  }, [config?.id]);
  const fetchCRMData = useCallback(async () => {
    if (!config?.id) return;
    const { data } = await supabase
      .from('customer_insights')
      .select('*')
      .eq('store_id', config.id)
      .order('total_orders', { ascending: false })
      .limit(200);
    if (data) setCustomers(data);
  }, [config?.id]);
  const fetchTeamInvites = useCallback(async () => {
    const { data } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('store_id', config.id)
      .order('created_at', { ascending: false });
    if (data) setTeamInvites(data);
  }, [config?.id]);

  const dismissMessage = (id) => {
    const updated = [...dismissedMessages, id];
    setDismissedMessages(updated);
    localStorage.setItem('rivapp_dismissed_msgs', JSON.stringify(updated));
    setGlobalNotifications((prev) => prev.filter((n) => n.id !== id));
    if (activeAlert?.id === id) setActiveAlert(null);
  };

  useEffect(() => {
    const checkSession = async () => {
      const localSession = localStorage.getItem('rivapp_session');
      try {
        const parsed = JSON.parse(localSession);
        if (parsed) {
          setSession(parsed);
          setLoadingSession(false);
          return;
        }
      } catch {
        /* ignore */
      }
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
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
    fetchMenu();
    fetchHistory(true);
    fetchCoupons();
    fetchRiders();
    fetchReviews();
    fetchGlobalNotifications();
    fetchCRMData();
    fetchBranches();
    fetchTeamInvites();
    setSettingsForm({
      store_name: config.name,
      color_accent: config.color_accent,
      cbu_alias: config.cbu_alias,
      phone: config.phone || '',
      logo_url: config.logo_url,
      banner_url: config.banner_url,
      lat: config.lat,
      lng: config.lng,
      schedule_start: config.schedule_start,
      schedule_end: config.schedule_end,
      auto_schedule: config.auto_schedule,
      mp_access_token: '',
      mp_public_key: '',
      mp_client_id: '',
      mp_client_secret: '',
      delivery_base_price: config.delivery_base_price || 500,
      delivery_price_per_km: config.delivery_price_per_km || 300,
      charge_delivery_in_mp: config.charge_delivery_in_mp ?? true,
    });
    setIsOpen(config.is_active);
  }, [
    config,
    fetchBranches,
    fetchCRMData,
    fetchCoupons,
    fetchGlobalNotifications,
    fetchHistory,
    fetchMenu,
    fetchReviews,
    fetchRiders,
    fetchTeamInvites,
    session,
  ]);

  useEffect(() => {
    if (!config?.id) return;
    prevOrdersCount.current = 0;
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    const channel = supabase
      .channel('admin_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${config.id}` },
        () => fetchOrders()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_notifications' }, () =>
        fetchGlobalNotifications()
      )
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [config?.id, fetchGlobalNotifications, fetchOrders, viewBranchId]);

  const visibleTabs = useMemo(() => {
    if (!config) return [];
    let tabs = features.hasProTabs ? ALL_TABS : ALL_TABS.filter((tab) => !tab.proOnly);
    if (role === 'staff') tabs = tabs.filter((t) => ['dashboard', 'orders'].includes(t.id));
    else if (role === 'manager') tabs = tabs.filter((t) => t.id !== 'billing');
    return tabs;
  }, [config, features, role]);

  const filteredOrders = useMemo(
    () => (!viewBranchId ? orders : orders.filter((o) => o.branch_id === viewBranchId)),
    [orders, viewBranchId]
  );
  const filteredHistory = useMemo(
    () => (!viewBranchId ? historyOrders : historyOrders.filter((o) => o.branch_id === viewBranchId)),
    [historyOrders, viewBranchId]
  );
  const getBranchName = (id) => branches.find((b) => b.id === id)?.name || null;

  const calculateDashboardStats = useCallback(() => {
    const combinedOrders = [...(filteredOrders || []), ...(filteredHistory || [])];
    const uniqueOrders = Array.from(new Map(combinedOrders.map((item) => [item.id, item])).values());
    const validOrders = uniqueOrders.filter((o) => o.status !== 'rechazado');
    let filtered = [];
    const now = new Date();
    if (statsFilter === 'today') {
      const todayStr = now.toLocaleDateString('en-CA');
      filtered = validOrders.filter((o) => new Date(o.created_at).toLocaleDateString('en-CA') === todayStr);
    } else if (statsFilter === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      filtered = validOrders.filter((o) => new Date(o.created_at) >= d);
    } else if (statsFilter === 'month') {
      const m = now.toISOString().slice(0, 7);
      filtered = validOrders.filter((o) => o.created_at?.startsWith(m));
    }
    const totalOrders = filtered.length;
    const totalRevenue = filtered.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const chartMap = {};
    filtered.forEach((o) => {
      const dateObj = new Date(o.created_at);
      const key =
        statsFilter === 'today'
          ? `${dateObj.getHours()}:00`
          : `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
      chartMap[key] = (chartMap[key] || 0) + (o.total || 0);
    });
    const chartData = Object.keys(chartMap).map((k) => ({ name: k, value: chartMap[k] }));
    const productCount = {};
    filtered.forEach((o) =>
      o.items.forEach((i) => (productCount[i.name] = (productCount[i.name] || 0) + i.quantity))
    );
    const topProducts = Object.keys(productCount)
      .map((n) => ({ name: n, value: productCount[n] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const cash = filtered.filter((o) => o.payment_method === 'efectivo').length;
    const digital = filtered.length - cash;
    setDashboardData({
      totalRevenue,
      totalOrders,
      avgTicket,
      chartData,
      topProducts,
      paymentData: [
        { name: 'Efectivo', value: cash },
        { name: 'Digital', value: digital },
      ],
    });
  }, [filteredOrders, filteredHistory, statsFilter]);

  useEffect(() => {
    calculateDashboardStats();
  }, [calculateDashboardStats]);
  useEffect(() => {
    if (viewBranchId) {
      const branch = branches.find((b) => b.id === viewBranchId);
      if (branch) setBranchForm(branch);
    }
  }, [viewBranchId, branches]);

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name) return alert('El nombre es obligatorio');
    const payload = {
      store_id: config.id,
      name: branchForm.name,
      address: branchForm.address,
      phone: branchForm.phone,
      lat: branchForm.lat || null,
      lng: branchForm.lng || null,
      is_active: true,
    };
    try {
      let result;
      if (editingBranch) result = await supabase.from('branches').update(payload).eq('id', editingBranch.id).select();
      else result = await supabase.from('branches').insert([payload]).select();
      if (result.error) throw result.error;
      const savedBranch = result.data[0];
      setBranches((prev) =>
        editingBranch ? prev.map((b) => (b.id === savedBranch.id ? savedBranch : b)) : [...prev, savedBranch]
      );
      setShowBranchModal(false);
      setEditingBranch(null);
      setBranchForm({ name: '', address: '', phone: '', lat: '', lng: '' });
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    }
  };
  const handleDeleteBranch = async (id) => {
    if (!window.confirm('¿Seguro que querés eliminar?')) return;
    await supabase.from('branches').update({ is_active: false }).eq('id', id);
    setBranches((prev) => prev.filter((b) => b.id !== id));
  };
  const handleSetMainBranch = async (branchId) => {
    if (!window.confirm('¿Marcar principal?')) return;
    await supabase.from('branches').update({ is_main: false }).eq('store_id', config.id);
    await supabase.from('branches').update({ is_main: true }).eq('id', branchId);
    setBranches((prev) => prev.map((b) => ({ ...b, is_main: b.id === branchId })));
  };
  const getBranchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setBranchForm((prev) => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        alert('Ubicación detectada');
      });
    }
  };
  const handleUpdateBranchDetails = async (e) => {
    e.preventDefault();
    if (!viewBranchId) return;
    try {
      const { error } = await supabase
        .from('branches')
        .update({
          address: branchForm.address,
          phone: branchForm.phone,
          lat: branchForm.lat,
          lng: branchForm.lng,
        })
        .eq('id', viewBranchId);
      if (error) throw error;
      alert('Datos actualizados!');
      fetchBranches();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name) return alert('Falta el nombre');
    const productToSave = {
      ...newProduct,
      store_id: config.id,
      price: newProduct.has_variants ? 0 : parseFloat(newProduct.price || 0),
      stock: newProduct.has_infinite_stock ? 0 : parseInt(newProduct.stock || 0),
    };
    const { error } = await supabase.from('menu').insert([productToSave]);
    if (!error) {
      alert('Plato creado!');
      setShowCreateModal(false);
      setNewProduct({
        name: '', description: '', price: '', category: '', image: '',
        available: true, stock: 100, has_variants: false, variants: [],
        has_infinite_stock: false, extras: [],
      });
      fetchMenu();
    }
  };
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    const { error } = await supabase.from('menu').update(editingProduct).eq('id', editingProduct.id).eq('store_id', config.id);
    if (!error) {
      alert('Actualizado!');
      setShowEditProductModal(false);
      setEditingProduct(null);
      fetchMenu();
    }
  };
  const deleteProduct = async (id) => {
    if (window.confirm('¿Borrar?')) {
      await supabase.from('menu').delete().eq('id', id).eq('store_id', config.id);
      fetchMenu();
    }
  };
  const updateProductField = async (id, f, v) => {
    setMenuItems((p) => p.map((i) => (i.id === id ? { ...i, [f]: v } : i)));
    await supabase.from('menu').update({ [f]: v }).eq('id', id).eq('store_id', config.id);
  };
  const handleAddExtra = (isEditing = false) => {
    if (!tempExtra.name || !tempExtra.price) return;
    const setter = isEditing ? setEditingProduct : setNewProduct;
    setter((prev) => ({ ...prev, extras: [...(prev.extras || []), { ...tempExtra }] }));
    setTempExtra({ name: '', price: '' });
  };
  const handleRemoveExtra = (idx, isEditing = false) => {
    const setter = isEditing ? setEditingProduct : setNewProduct;
    setter((prev) => ({ ...prev, extras: prev.extras.filter((_, i) => i !== idx) }));
  };

  const updateOrderStatus = async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id).eq('store_id', config.id);
    fetchOrders();
  };
  const handleMarkAsPaid = async (id) => {
    if (!window.confirm('¿Confirmar que el cliente pagó?')) return;
    await supabase
      .from('orders')
      .update({ paid: true, payment_status: 'paid' })
      .eq('id', id)
      .eq('store_id', config.id);
    fetchOrders();
  };
  const handleRejectOrder = async (id) => {
    const reason = window.prompt('Motivo:');
    if (!reason) return;
    await supabase
      .from('orders')
      .update({ status: 'rechazado', rejection_reason: reason })
      .eq('id', id)
      .eq('store_id', config.id);
    fetchOrders();
  };
  const handlePrintOrder = (order) => {
    const popupWin = window.open('', '_blank', 'width=350,height=600');
    const itemsHtml = (order.items || [])
      .map(
        (item) =>
          `<tr><td>${item.quantity}</td><td>${item.name}</td><td>$${(item.finalPrice * item.quantity).toLocaleString()}</td></tr>`
      )
      .join('');
    const html = `<html><body style="font-family: monospace"><h2>${config.name}</h2><p>Pedido #${order.id.slice(0, 6)}</p><hr /><table style="width: 100%">${itemsHtml}</table><hr /><h3>TOTAL: $${order.total}</h3><p>${order.note ? `NOTA: ${order.note}` : ''}</p><script>window.print();setTimeout(window.close, 500);</script></body></html>`;
    popupWin.document.write(html);
    popupWin.document.close();
  };
  const handleCloseRegister = async () => {
    if (!window.confirm('¿Cerrar caja?')) return;
    const validOrders = orders.filter((o) => o.status !== 'rechazado' && o.status !== 'archivado');
    if (validOrders.length === 0) return alert('No hay pedidos para cerrar.');
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const cashTotal = validOrders
      .filter((o) => o.payment_method === 'efectivo')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    printZTicket(
      { count: validOrders.length, total: totalRevenue, cash: cashTotal, digital: totalRevenue - cashTotal },
      settingsForm.store_name
    );
    await supabase.from('orders').update({ status: 'archivado' }).eq('store_id', config.id).neq('status', 'archivado');
    setOrders([]);
    fetchHistory(true);
  };
  const handleImageUpload = async (e, isEditing = false) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileName = `${config.id}-${Date.now()}`;
      await supabase.storage.from('menu-images').upload(fileName, file);
      const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
      if (isEditing) setEditingProduct((prev) => ({ ...prev, image: data.publicUrl }));
      else setNewProduct((prev) => ({ ...prev, image: data.publicUrl }));
    } catch {
      alert('Error subiendo imagen');
    }
    setUploadingImage(false);
  };
  const handleStoreImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileName = `${type}-${config.id}-${Date.now()}`;
      await supabase.storage.from('menu-images').upload(fileName, file);
      const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
      if (type === 'logo') setSettingsForm((prev) => ({ ...prev, logo_url: data.publicUrl }));
      if (type === 'banner') setSettingsForm((prev) => ({ ...prev, banner_url: data.publicUrl }));
    } catch {
      alert('Error subiendo imagen');
    }
    setUploadingImage(false);
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      const { mp_access_token, mp_public_key, mp_client_id, mp_client_secret, store_name, ...restSettings } = settingsForm;
      if (mp_access_token || mp_public_key || mp_client_id || mp_client_secret) {
        const { error: fnError } = await supabase.functions.invoke('save-mp-settings', {
          body: { store_id: config.id, mp_access_token, mp_public_key, mp_client_id, mp_client_secret },
        });
        if (fnError) throw new Error('Error guardando credenciales MP: ' + fnError.message);
      }
      const updates = {
        ...restSettings,
        name: store_name,
        delivery_base_price: parseFloat(restSettings.delivery_base_price || 0),
        delivery_price_per_km: parseFloat(restSettings.delivery_price_per_km || 0),
      };
      const { error: dbError } = await supabase.from('stores').update(updates).eq('id', config.id);
      if (dbError) throw dbError;
      alert('Guardado correctamente!');
      if (refreshStore) refreshStore();
    } catch (error) {
      logger.error(error);
      alert('Error al guardar: ' + error.message);
    }
  };

  const toggleStore = async () => {
    const nextStatus = !isOpen;
    setIsOpen(nextStatus);
    await supabase.from('stores').update({ is_active: nextStatus }).eq('id', config.id);
  };
  const handleLogout = async () => {
    localStorage.removeItem('rivapp_session');
    navigate('/login');
  };
  const handleCreateRider = async (e) => {
    e.preventDefault();
    await supabase.from('riders').insert([{ ...newRider, store_id: config.id }]);
    setShowCreateRiderModal(false);
    fetchRiders();
  };
  const deleteRider = async (id) => {
    if (window.confirm('¿Borrar?')) {
      await supabase.from('riders').delete().eq('id', id).eq('store_id', config.id);
      fetchRiders();
    }
  };
  const handleAssignRider = async (riderId) => {
    if (!selectedOrderForRider) return;
    await supabase
      .from('orders')
      .update({ rider_id: riderId, status: 'listo' })
      .eq('id', selectedOrderForRider.id)
      .eq('store_id', config.id);
    setShowAssignRiderModal(false);
    fetchOrders();
  };
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    await supabase
      .from('coupons')
      .insert([{ store_id: config.id, code: newCoupon.code.toUpperCase(), discount: newCoupon.discount }]);
    setShowCouponModal(false);
    fetchCoupons();
  };
  const deleteCoupon = async (id) => {
    if (window.confirm('¿Borrar?')) {
      await supabase.from('coupons').update({ active: false }).eq('id', id).eq('store_id', config.id);
      fetchCoupons();
    }
  };
  const handleBulkPriceUpdate = async () => {
    if (!window.confirm('¿Seguro?')) return;
    const updates = menuItems.map((item) => {
      let cPrice = parseFloat(item.price),
        nPrice = cPrice,
        v = parseFloat(priceConfig.value);
      if (priceConfig.type === 'percent')
        nPrice = Math.round(cPrice * (priceConfig.action === 'increase' ? 1 + v / 100 : 1 - v / 100));
      else nPrice = priceConfig.action === 'increase' ? cPrice + v : cPrice - v;
      return { ...item, price: nPrice > 0 ? nPrice : 0 };
    });
    await supabase.from('menu').upsert(updates);
    setShowPriceModal(false);
    fetchMenu();
  };
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!promoTargetItem) return;
    let pName = '',
      pPrice = 0,
      bPrice = parseFloat(promoTargetItem.price);
    if (promoConfig.type === 'nxm') {
      pName = `${promoConfig.buy}x${promoConfig.pay} ${promoTargetItem.name}`;
      pPrice = bPrice * promoConfig.pay;
    } else {
      pName = `${promoTargetItem.name} (${promoConfig.value}% OFF)`;
      pPrice = Math.round(bPrice * (1 - promoConfig.value / 100));
    }
    await supabase.from('menu').insert([
      {
        name: pName,
        store_id: config.id,
        description: `Promoción: ${pName}`,
        price: pPrice,
        category: 'Promociones',
        image: promoTargetItem.image,
        available: true,
        stock: promoTargetItem.stock,
        has_infinite_stock: promoTargetItem.has_infinite_stock,
        extras: promoTargetItem.extras || [],
      },
    ]);
    setShowPromoModal(false);
    fetchMenu();
  };
  const handleSubscribe = async () => {
    if (!config?.id) return alert('Error: No se identificó la tienda.');
    const btn = document.activeElement;
    if (btn) btn.innerText = 'Procesando...';
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: JSON.stringify({
          store_id: config.id,
          price: 40000,
          title: 'Suscripción Plan Profesional',
          domain_url: window.location.origin,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (error) throw new Error(error.message || 'Falló la función');
      if (data?.init_point) window.open(data.init_point, '_blank');
      else alert('Mercado Pago no devolvió el link.');
    } catch {
      alert('Error de conexión.');
    } finally {
      if (btn) btn.innerText = 'Pasarme a PRO';
    }
  };
  const exportCustomers = () => {
    if (customers.length === 0) return alert('No hay datos.');
    const headers = ['Cliente', 'Telefono', 'Pedidos Totales', 'Inversion Total', 'Ultima Compra'];
    const csvContent = [
      headers.join(';'),
      ...customers.map((c) =>
        [
          `"${c.customer_name || 'Sin Nombre'}"`,
          `"${c.customer_phone || ''}"`,
          c.total_orders,
          c.total_spent,
          `"${new Date(c.last_order).toLocaleDateString()}"`,
        ].join(';')
      ),
    ].join('\r\n');
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `clientes_${config.slug}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const saveOrderChanges = async (e) => {
    e.preventDefault();
    await supabase
      .from('orders')
      .update({
        customer_name: editingOrder.customer_name,
        total: parseFloat(editingOrder.total),
        payment_method: editingOrder.payment_method,
        status: editingOrder.status,
        note: editingOrder.note,
      })
      .eq('id', editingOrder.id)
      .eq('store_id', config.id);
    setShowEditOrderModal(false);
    fetchHistory(true);
    fetchOrders();
  };
  const handleDeleteSingleOrder = async (id) => {
    if (window.confirm('¿Borrar?')) {
      await supabase.from('orders').delete().eq('id', id).eq('store_id', config.id);
      fetchHistory(true);
    }
  };
  const handleDeleteAllHistory = async () => {
    if (window.confirm('¿Vaciar todo?')) {
      await supabase
        .from('orders')
        .delete()
        .eq('store_id', config.id)
        .or('status.eq.archivado,status.eq.rechazado,status.eq.entregado');
      fetchHistory(true);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!newMember.email) return alert('Falta el email');
    const btn = document.activeElement;
    const originalText = btn.innerText;
    btn.innerText = 'Enviando...';
    btn.disabled = true;
    try {
      const payload = {
        store_id: config.id,
        email: newMember.email,
        role: newMember.role,
        branch_id:
          newMember.role === 'manager' || newMember.role === 'staff' ? newMember.branch_id : null,
        status: 'pending',
      };
      const { data: dbData, error } = await supabase
        .from('team_invitations')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      const inviteLink = `${window.location.origin}/login?invite=${dbData.id}`;
      const branchName = newMember.branch_id ? getBranchName(newMember.branch_id) : null;
      const { error: fnError } = await supabase.functions.invoke('invite-user', {
        body: {
          email: newMember.email,
          role: newMember.role,
          store_name: config.name,
          branch_name: branchName,
          invite_link: inviteLink,
        },
      });
      if (fnError) {
        logger.error('Error enviando mail:', fnError);
        alert('Invitación guardada, pero falló el envío del correo.');
      } else {
        alert(`Invitación enviada a ${newMember.email}!`);
      }
      setShowTeamModal(false);
      setNewMember({ email: '', role: 'staff', branch_id: '' });
      fetchTeamInvites();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  };
  const handleDeleteInvite = async (id) => {
    if (!window.confirm('¿Eliminar invitación?')) return;
    await supabase.from('team_invitations').delete().eq('id', id);
    fetchTeamInvites();
  };

  if (loadingSession)
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="h-10 w-10 animate-spin text-acid" />
      </div>
    );

  if (!canAccessAdmin)
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink p-6 text-center">
        <div className="w-full max-w-md rounded-[var(--radius-2xl)] border border-signal/30 bg-ink-2 p-10 shadow-[var(--shadow-editorial)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-signal/10 text-signal">
            <Lock className="h-6 w-6" />
          </div>
          <Eyebrow className="mt-6 justify-center">Suscripción</Eyebrow>
          <h2 className="display mt-3 text-4xl text-text">
            Suscripción <em className="display-italic text-signal">vencida</em>
          </h2>
          <p className="mt-3 text-sm text-text-muted">Tu periodo de servicio ha finalizado.</p>
          <Button onClick={handleSubscribe} variant="acid" size="xl" className="mt-8 w-full">
            Pagar ahora <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );

  return (
    <div
      className={`relative flex min-h-screen flex-col bg-ink text-text lg:flex-row ${
        flash ? 'bg-ml/10' : ''
      } transition-colors duration-200`}
    >
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
            <div className="flex items-start gap-4 rounded-[var(--radius-xl)] border border-acid/50 bg-ink-2 p-5 shadow-[var(--shadow-editorial)]">
              <div className="rounded-[var(--radius-sm)] bg-acid/10 p-3 text-acid">
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

      {/* SIDEBAR */}
      <aside className="sticky top-0 z-40 hidden h-screen w-64 flex-col overflow-y-auto border-r border-rule bg-ink-2 p-6 lg:flex">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-ink-text"
            style={{ backgroundColor: accentColor, color: contrastTextColor }}
          >
            <Store className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="display truncate text-lg text-text">{config?.name}</h2>
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">Panel · Food</p>
          </div>
        </div>

        <Rule className="my-6" />

        <div className="mb-6">
          <p className="eyebrow mb-2">Sucursal</p>
          <AdminBranchSelector selectedBranchId={viewBranchId} onSelect={handleBranchChange} />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {visibleTabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-white/5' : 'text-text-muted hover:bg-white/[0.02] hover:text-text'
                }`}
                style={isActive ? { color: accentColor } : {}}
              >
                <t.icon className="h-4 w-4" />
                <span className="capitalize">{t.label}</span>
              </button>
            );
          })}
        </nav>

        <Rule className="my-6" />

        <div className="flex flex-col gap-2">
          <button
            onClick={toggleSound}
            className={`mono flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] py-2 text-[11px] uppercase tracking-[0.22em] ${
              isSoundEnabled ? 'bg-acid/10 text-acid' : 'bg-signal/10 text-signal-soft'
            }`}
          >
            Sonido {isSoundEnabled ? 'on' : 'off'}
          </button>
          <button
            onClick={toggleStore}
            className={`mono flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] py-2 text-[11px] uppercase tracking-[0.22em] ${
              isOpen ? 'bg-acid/10 text-acid' : 'bg-signal/10 text-signal-soft'
            }`}
          >
            Local {isOpen ? 'abierto' : 'cerrado'}
          </button>
          <button
            onClick={handleLogout}
            className="mono flex w-full items-center justify-center gap-2 py-2 text-[11px] uppercase tracking-[0.22em] text-text-subtle hover:text-text"
          >
            <LogOut className="h-3.5 w-3.5" /> Salir
          </button>
        </div>
      </aside>

      {/* MOBILE NAV */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-rule bg-ink-2/95 p-2 backdrop-blur-md lg:hidden">
        {visibleTabs.slice(0, 4).map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex flex-col items-center p-2"
              style={{ color: isActive ? accentColor : 'var(--color-text-subtle)' }}
            >
              <t.icon className="h-5 w-5" />
              <span className="mono mt-1 text-[9px] uppercase tracking-[0.2em]">{t.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center p-2 text-text-subtle"
        >
          <MenuIcon className="h-5 w-5" />
          <span className="mono mt-1 text-[9px] uppercase tracking-[0.2em]">Más</span>
        </button>
      </nav>

      {/* MAIN */}
      <main className="h-screen flex-1 overflow-y-auto bg-ink p-4 pb-24 lg:p-8 lg:pb-8">
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <div className="w-full">
            <AdminBranchSelector selectedBranchId={viewBranchId} onSelect={handleBranchChange} />
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <DashboardTab
            config={config}
            role={role}
            accentColor={accentColor}
            viewBranchId={viewBranchId}
            getBranchName={getBranchName}
            dashboardData={dashboardData}
            globalNotifications={globalNotifications}
            onDismissMessage={dismissMessage}
            storeNotifications={storeNotifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDeleteNotification={deleteNotification}
            onClearAllNotifications={clearAllNotifications}
            onCloseRegister={handleCloseRegister}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab
            filteredOrders={filteredOrders}
            isSoundEnabled={isSoundEnabled}
            onToggleSound={toggleSound}
            onRefreshOrders={fetchOrders}
            onUpdateOrderStatus={updateOrderStatus}
            onRejectOrder={handleRejectOrder}
            onPrintOrder={handlePrintOrder}
            onMarkOrderPaid={handleMarkAsPaid}
            onOpenAssignRider={(order) => {
              setSelectedOrderForRider(order);
              setShowAssignRiderModal(true);
            }}
            getBranchName={getBranchName}
          />
        )}
        {activeTab === 'team' && (
          <TeamTab
            teamInvites={teamInvites}
            onOpenRolesModal={() => setShowRolesModal(true)}
            onOpenInviteModal={() => setShowTeamModal(true)}
            getBranchName={getBranchName}
            onDeleteInvite={handleDeleteInvite}
          />
        )}
        {activeTab === 'menu' && (
          <MenuTab
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            menuItems={menuItems}
            onOpenPriceModal={() => setShowPriceModal(true)}
            onOpenCreateProductModal={() => setShowCreateModal(true)}
            onOpenPromoModal={(item) => {
              setPromoTargetItem(item);
              setShowPromoModal(true);
            }}
            onToggleAvailability={updateProductField}
            onOpenEditProductModal={(item) => {
              setEditingProduct(item);
              setShowEditProductModal(true);
            }}
            onDeleteProduct={deleteProduct}
          />
        )}
        {activeTab === 'crm' && <CRMTab customers={customers} onExportCustomers={exportCustomers} />}
        {activeTab === 'riders' && (
          <RidersTab
            riders={riders}
            branches={branches}
            accentColor={accentColor}
            contrastTextColor={contrastTextColor}
            onCreateRider={() => {
              setNewRider({ name: '', phone: '', access_pin: '', branch_id: '' });
              setShowCreateRiderModal(true);
            }}
            onDeleteRider={deleteRider}
          />
        )}
        {activeTab === 'coupons' && (
          <CouponsTab coupons={coupons} onCreateCoupon={() => setShowCouponModal(true)} onDeleteCoupon={deleteCoupon} />
        )}
        {activeTab === 'reviews' && <ReviewsTab reviews={reviews} accentColor={accentColor} />}
        {activeTab === 'history' && (
          <HistoryTab
            filteredHistory={filteredHistory}
            hasMore={historyHasMore}
            loadingMore={historyLoadingMore}
            onLoadMore={() => fetchHistory(false)}
            getBranchName={getBranchName}
            onEditOrder={(order) => {
              setEditingOrder(order);
              setShowEditOrderModal(true);
            }}
            onDeleteOrder={handleDeleteSingleOrder}
            onDeleteAllHistory={handleDeleteAllHistory}
          />
        )}
        {activeTab === 'billing' && <BillingTab config={config} accentColor={accentColor} onSubscribe={handleSubscribe} />}
        {activeTab === 'config' && (
          <ConfigTab
            viewBranchId={viewBranchId}
            branches={branches}
            branchForm={branchForm}
            setBranchForm={setBranchForm}
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            accentColor={accentColor}
            contrastTextColor={contrastTextColor}
            getBranchName={getBranchName}
            onOpenNewBranchModal={() => {
              setEditingBranch(null);
              setBranchForm({ name: '', address: '', phone: '', lat: '', lng: '' });
              setShowBranchModal(true);
            }}
            onOpenEditBranchModal={(branch) => {
              setEditingBranch(branch);
              setBranchForm(branch);
              setShowBranchModal(true);
            }}
            onSetMainBranch={handleSetMainBranch}
            onDeleteBranch={handleDeleteBranch}
            onStoreImageUpload={handleStoreImageUpload}
            onSaveSettings={saveSettings}
            onGetBranchLocation={getBranchLocation}
            onUpdateBranchDetails={handleUpdateBranchDetails}
          />
        )}
      </main>

      {/* MODALS */}
      {showBranchModal && (
        <BranchModal
          branchForm={branchForm}
          setBranchForm={setBranchForm}
          editingBranch={editingBranch}
          onSave={handleSaveBranch}
          onClose={() => setShowBranchModal(false)}
          onGetLocation={getBranchLocation}
        />
      )}
      {showTeamModal && (
        <TeamModal
          newMember={newMember}
          setNewMember={setNewMember}
          branches={branches}
          onSubmit={handleInviteMember}
          onClose={() => setShowTeamModal(false)}
        />
      )}
      {showRolesModal && <RolesModal onClose={() => setShowRolesModal(false)} />}
      {showEditOrderModal && editingOrder && (
        <EditOrderModal
          editingOrder={editingOrder}
          setEditingOrder={setEditingOrder}
          onSave={saveOrderChanges}
          onClose={() => setShowEditOrderModal(false)}
        />
      )}
      {showAssignRiderModal && selectedOrderForRider && (
        <AssignRiderModal
          order={selectedOrderForRider}
          riders={riders}
          getBranchName={getBranchName}
          onAssign={handleAssignRider}
          onClose={() => setShowAssignRiderModal(false)}
        />
      )}
      {showCreateModal && (
        <CreateProductModal
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          tempExtra={tempExtra}
          setTempExtra={setTempExtra}
          accentColor={accentColor}
          contrastTextColor={contrastTextColor}
          uploadingImage={uploadingImage}
          onImageUpload={handleImageUpload}
          onAddExtra={handleAddExtra}
          onRemoveExtra={handleRemoveExtra}
          onSubmit={handleCreateProduct}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      {showEditProductModal && editingProduct && (
        <EditProductModal
          editingProduct={editingProduct}
          setEditingProduct={setEditingProduct}
          tempExtra={tempExtra}
          setTempExtra={setTempExtra}
          uploadingImage={uploadingImage}
          onImageUpload={(e) => handleImageUpload(e, true)}
          onAddExtra={handleAddExtra}
          onRemoveExtra={handleRemoveExtra}
          onSubmit={handleUpdateProduct}
          onClose={() => setShowEditProductModal(false)}
        />
      )}
      {showPromoModal && promoTargetItem && (
        <PromoModal
          promoTargetItem={promoTargetItem}
          promoConfig={promoConfig}
          setPromoConfig={setPromoConfig}
          onSubmit={handleCreatePromo}
          onClose={() => setShowPromoModal(false)}
        />
      )}
      {showPriceModal && (
        <PriceModal
          priceConfig={priceConfig}
          setPriceConfig={setPriceConfig}
          onApply={handleBulkPriceUpdate}
          onClose={() => setShowPriceModal(false)}
        />
      )}
      {showCouponModal && (
        <CouponModal
          newCoupon={newCoupon}
          setNewCoupon={setNewCoupon}
          accentColor={accentColor}
          contrastTextColor={contrastTextColor}
          onSubmit={handleCreateCoupon}
          onClose={() => setShowCouponModal(false)}
        />
      )}
      {showCreateRiderModal && (
        <CreateRiderModal
          newRider={newRider}
          setNewRider={setNewRider}
          branches={branches}
          accentColor={accentColor}
          contrastTextColor={contrastTextColor}
          onSubmit={handleCreateRider}
          onClose={() => setShowCreateRiderModal(false)}
        />
      )}
    </div>
  );
}
