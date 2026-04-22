import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/client';
import { useStore } from '../context/useStore';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';

import { useCartStore } from '../store/useCartStore';
import { useMenuData } from '../hooks/useMenuData';
import { useStoreStatus } from '../hooks/useStoreStatus';
import {
  Search, Loader2, Lock, X, Banknote, CreditCard, MapPin, Copy, Check, Navigation,
  Ruler, Clock, AlertTriangle, ShoppingBag, Plus, Minus, ChevronRight, Phone, User,
  ExternalLink, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import Button from '../components/shared/ui/Button';
import Eyebrow from '../components/shared/ui/Eyebrow';
import Rule from '../components/shared/ui/Rule';

let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const PRECIO_BASE = 500;
const PRECIO_POR_KM = 300;
const DEFAULT_COORDS = { lat: -31.546787, lng: -68.56415 };

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const LocationRequestModal = ({ onEnable, onSkip, color }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-6 backdrop-blur-md anim-fade">
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative w-full max-w-sm overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-8 text-center shadow-[var(--shadow-editorial)]"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rule-strong bg-ink-3">
        <MapPin className="h-6 w-6" style={{ color }} />
      </div>
      <Eyebrow className="mt-6 justify-center">Permiso</Eyebrow>
      <h3 className="display mt-3 text-3xl text-text">
        ¿Dónde <em className="display-italic">estás</em>?
      </h3>
      <p className="mt-4 text-sm leading-6 text-text-muted text-pretty">
        Usamos tu ubicación para calcular el <span className="text-text">costo de envío exacto</span> y la
        demora real.
      </p>

      <div className="mt-8 grid gap-3">
        <button
          onClick={onEnable}
          className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] active:scale-95"
          style={{ backgroundColor: color }}
        >
          <Navigation className="h-4 w-4" /> Activar ubicación
        </button>
        <button
          onClick={onSkip}
          className="mono rounded-[var(--radius-md)] py-3 text-[11px] uppercase tracking-[0.22em] text-text-muted transition-colors hover:text-text"
        >
          Ingresar dirección a mano
        </button>
      </div>
    </motion.div>
  </div>
);

const ToggleButton = ({ active, text, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex-1 rounded-[var(--radius-sm)] py-2.5 text-sm font-semibold transition-all ${
      active ? 'text-ink shadow-[0_10px_30px_-10px_rgba(208,255,0,0.45)]' : 'bg-ink-3 text-text-muted'
    }`}
    style={active ? { backgroundColor: color } : {}}
  >
    {text}
  </button>
);

const CategoryPill = ({ label, active, onClick, color }) => (
  <button
    onClick={onClick}
    className={`mono whitespace-nowrap rounded-full px-5 py-2 text-[11px] uppercase tracking-[0.18em] transition-all ${
      active
        ? 'text-ink shadow-[0_8px_24px_-8px_rgba(208,255,0,0.5)]'
        : 'border border-rule-strong bg-ink-2 text-text-muted hover:border-text-muted hover:text-text'
    }`}
    style={active ? { backgroundColor: color } : {}}
  >
    {label}
  </button>
);

const PaymentOption = ({ id, icon: Icon, label, hint, selected, onSelect, color, customColor }) => {
  const isSelected = selected === id;
  const activeColor = customColor || color;
  return (
    <button
      onClick={() => onSelect(id)}
      className={`group flex flex-1 flex-col items-start gap-3 rounded-[var(--radius-lg)] border p-5 text-left transition-all ${
        isSelected ? 'bg-ink-2' : 'border-rule-strong bg-ink-2 hover:border-text-muted'
      }`}
      style={isSelected ? { borderColor: activeColor, backgroundColor: `${activeColor}10` } : {}}
    >
      <div className="flex w-full items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isSelected ? 'text-ink' : 'border border-rule-strong text-text-muted'
          }`}
          style={isSelected ? { backgroundColor: activeColor, color: customColor === '#009EE3' ? 'white' : 'black' } : {}}
        >
          <Icon className="h-4 w-4" />
        </div>
        {isSelected && (
          <span className="mono text-[10px] uppercase tracking-[0.22em]" style={{ color: activeColor }}>
            Elegido
          </span>
        )}
      </div>
      <div>
        <p className="display text-xl text-text">{label}</p>
        {hint && (
          <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">{hint}</p>
        )}
      </div>
    </button>
  );
};

const LocationMarker = ({ position, setPosition, onLocationSelect }) => {
  const map = useMapEvents({
    click(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      onLocationSelect(newPos);
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 16);
  }, [position, map]);
  return position === null ? null : <Marker position={[position.lat, position.lng]}></Marker>;
};

const LocationPicker = ({ onLocationSelect, storeLocation, initialPosition }) => {
  const [position, setPosition] = useState(initialPosition || null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const center = initialPosition || storeLocation || DEFAULT_COORDS;

  const getUserLocation = () => {
    setLoadingGPS(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(newPos);
          onLocationSelect(newPos);
          setLoadingGPS(false);
        },
        (err) => {
          logger.error('GPS Error:', err);
          setLoadingGPS(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLoadingGPS(false);
    }
  };

  useEffect(() => {
    if (!initialPosition) return;
    const t = window.setTimeout(() => {
      setPosition(initialPosition);
      onLocationSelect(initialPosition);
    }, 0);
    return () => window.clearTimeout(t);
  }, [initialPosition, onLocationSelect]);

  return (
    <div className="space-y-2">
      <div className="relative z-0 h-[200px] w-full overflow-hidden rounded-[var(--radius-md)] border border-rule-strong bg-ink-3">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={[
              storeLocation?.lat || DEFAULT_COORDS.lat,
              storeLocation?.lng || DEFAULT_COORDS.lng,
            ]}
            icon={L.icon({
              iconUrl: 'https://cdn-icons-png.flaticon.com/512/1008/1008001.png',
              iconSize: [40, 40],
            })}
          />
          <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
        </MapContainer>
        <button
          onClick={(e) => {
            e.preventDefault();
            getUserLocation();
          }}
          className="absolute bottom-3 right-3 z-[1000] rounded-full bg-paper p-3 text-ink-text shadow-xl transition-transform active:scale-90"
        >
          {loadingGPS ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
        </button>
      </div>
      <p className="mono flex items-center justify-center gap-1 text-[10px] uppercase tracking-[0.2em] text-text-subtle">
        <MapPin className="h-3 w-3" /> Tocá el mapa para ajustar tu entrega
      </p>
    </div>
  );
};

const ProductCard = ({ item, isOpen, onAdd, color }) => {
  const { cart } = useCartStore();
  const quantity = cart.filter((p) => p.id === item.id).reduce((acc, curr) => acc + curr.quantity, 0);
  const isOut = !item.has_infinite_stock && item.stock <= 0;
  const imageSrc =
    item.image && item.image.length > 5 ? item.image : 'https://placehold.co/400x400/222/white?text=Sin+Foto';

  const unavailable = !isOpen || isOut;

  return (
    <article
      className={`group flex gap-4 rounded-[var(--radius-lg)] border border-rule-strong bg-ink-2 p-3 transition-all hover:border-text-muted ${
        unavailable ? 'opacity-50 grayscale' : ''
      }`}
    >
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-ink-3">
        <img src={imageSrc} alt={item.name} className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-1 flex-col justify-between py-1">
        <div>
          <h3 className="display text-lg leading-tight text-text">{item.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-text-muted">{item.description}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="num text-lg font-semibold" style={{ color }}>
            {item.has_variants && 'Desde '}$
            {item.has_variants && item.variants?.length > 0
              ? parseFloat(item.variants[0].price).toLocaleString()
              : parseFloat(item.price).toLocaleString()}
          </span>

          {isOpen && !isOut ? (
            <button
              onClick={() => onAdd(item)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-paper text-ink-text transition-transform hover:scale-110"
            >
              <Plus className="h-4 w-4" strokeWidth={3} />
              {quantity > 0 && (
                <span
                  className="num absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink-2 text-[10px] font-semibold text-ink"
                  style={{ backgroundColor: color }}
                >
                  {quantity}
                </span>
              )}
            </button>
          ) : (
            <span className="mono rounded-sm border border-signal/40 bg-signal/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-signal">
              {isOut ? 'Agotado' : 'Cerrado'}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

const CartSummaryButton = ({ count, total, isStoreOpen, onOpen, color }) => {
  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <button
        onClick={onOpen}
        disabled={!isStoreOpen}
        className={`pointer-events-auto flex h-14 w-full max-w-md items-center justify-between rounded-[var(--radius-md)] px-5 text-sm font-semibold shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] transition-all active:scale-[0.98] ${
          isStoreOpen ? 'text-ink' : 'bg-ink-3 text-text-muted'
        }`}
        style={isStoreOpen ? { backgroundColor: color } : {}}
      >
        {isStoreOpen ? (
          <>
            <div className="flex items-center gap-3">
              <span className="num flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-sm font-semibold text-ink">
                {count}
              </span>
              <span className="display text-lg">Ver pedido</span>
            </div>
            <span className="num text-lg">${total.toLocaleString()}</span>
          </>
        ) : (
          <div className="flex w-full items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="mono text-xs uppercase tracking-[0.22em]">Cerrado</span>
          </div>
        )}
      </button>
    </div>
  );
};

const VariantsModal = ({ item, onClose, onConfirm, color }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm anim-fade">
    <div className="w-full max-w-sm overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 shadow-[var(--shadow-editorial)]">
      <div className="border-b border-rule p-6">
        <Eyebrow>Opciones</Eyebrow>
        <h3 className="display mt-2 text-2xl text-text">{item.name}</h3>
      </div>
      <div className="space-y-3 p-6">
        {item.variants?.map((v, i) => (
          <button
            key={i}
            onClick={() => onConfirm(item, v)}
            className="group flex w-full items-center justify-between rounded-[var(--radius-md)] border border-rule-strong bg-ink-3 p-4 text-left transition-all hover:border-text-muted"
          >
            <span className="display text-lg text-text">{v.name}</span>
            <span className="num text-lg font-semibold" style={{ color }}>
              ${parseFloat(v.price).toLocaleString()}
            </span>
          </button>
        ))}
      </div>
      <div className="p-6 pt-0">
        <Button onClick={onClose} variant="outline" size="lg" className="w-full">
          Cancelar
        </Button>
      </div>
    </div>
  </div>
);

const ExtrasModal = ({ item, onClose, onConfirm, color }) => {
  const [selectedExtras, setSelectedExtras] = useState([]);
  const basePrice = parseFloat(item.finalPrice || item.price) || 0;

  const toggleExtra = (extra) => {
    if (selectedExtras.find((e) => e.name === extra.name)) {
      setSelectedExtras(selectedExtras.filter((e) => e.name !== extra.name));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const totalPrice =
    basePrice + selectedExtras.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm anim-fade">
      <div className="w-full max-w-sm overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 shadow-[var(--shadow-editorial)]">
        <div className="border-b border-rule p-6">
          <Eyebrow>Personalizar</Eyebrow>
          <h3 className="display mt-2 text-2xl text-text">
            {item.name} {item.variantName && <span className="text-text-muted">({item.variantName})</span>}
          </h3>
        </div>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto p-6">
          <Rule label="Adicionales" />
          <div className="mt-4 space-y-2">
            {item.extras?.map((extra, i) => {
              const isSelected = selectedExtras.find((e) => e.name === extra.name);
              return (
                <button
                  key={i}
                  onClick={() => toggleExtra(extra)}
                  className={`flex w-full items-center justify-between rounded-[var(--radius-md)] border p-3 text-sm transition-all ${
                    isSelected
                      ? 'border-paper bg-paper text-ink-text'
                      : 'border-rule-strong bg-ink-3 text-text-muted hover:border-text-muted'
                  }`}
                >
                  <span>{extra.name}</span>
                  <span className="num font-semibold">+${parseFloat(extra.price).toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-rule bg-ink-2 p-6">
          <button
            onClick={() => onConfirm(item, selectedExtras)}
            className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] py-4 font-semibold text-ink transition-transform active:scale-95"
            style={{ backgroundColor: color }}
          >
            Agregar · <span className="num">${totalPrice.toLocaleString()}</span>
          </button>
          <Button onClick={onClose} variant="ghost" size="md">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

const CartModal = ({ isOpen, onClose, defaultOrderType, onSuccess, config, preloadedLocation }) => {
  const { cart, clearCart, removeItem, updateQuantity } = useCartStore();
  const { selectedBranch } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [deliveryMode, setDeliveryMode] = useState(defaultOrderType || 'delivery');
  const [exactLocation, setExactLocation] = useState(preloadedLocation || null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('mercadopago');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const storeLoc = useMemo(
    () =>
      selectedBranch?.lat && selectedBranch?.lng
        ? { lat: selectedBranch.lat, lng: selectedBranch.lng }
        : config?.lat
        ? { lat: config.lat, lng: config.lng }
        : DEFAULT_COORDS,
    [config?.lat, config?.lng, selectedBranch?.lat, selectedBranch?.lng]
  );

  const brandColor = config?.color_accent || '#d0ff00';

  useEffect(() => {
    if (defaultOrderType) setDeliveryMode(defaultOrderType);
  }, [defaultOrderType, isOpen]);

  useEffect(() => {
    if (exactLocation && storeLoc) {
      const dist = calculateDistance(storeLoc.lat, storeLoc.lng, exactLocation.lat, exactLocation.lng);
      setDistanceKm(dist.toFixed(1));
      const cost = Math.ceil(PRECIO_BASE + dist * PRECIO_POR_KM);
      setDeliveryCost(cost);
    }
  }, [exactLocation, storeLoc]);

  const handleLocationSelect = (pos) => setExactLocation(pos);

  const subtotal = cart.reduce((acc, item) => acc + parseFloat(item.finalPrice) * item.quantity, 0);
  const finalDeliveryCost = deliveryMode === 'delivery' ? deliveryCost : 0;
  const total = subtotal - subtotal * (discount / 100) + finalDeliveryCost;

  const copyAlias = () => {
    navigator.clipboard.writeText(config?.cbu_alias || 'ALIAS');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyCoupon = async () => {
    if (!couponCode) return;
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('store_id', config.id)
      .single();
    if (data) {
      setDiscount(data.discount);
      setCouponMessage(`-${data.discount}% aplicado`);
    } else {
      setDiscount(0);
      setCouponMessage('Cupón inválido');
    }
  };

  const handleCheckout = async () => {
    if (!customerName.trim()) return alert('Por favor escribí tu nombre.');
    if (!customerPhone.trim()) return alert('Por favor escribí tu teléfono.');
    if (deliveryMode === 'delivery' && !exactLocation)
      return alert('Marcá tu ubicación en el mapa.');

    setIsSending(true);

    const googleMapsLink = exactLocation
      ? `http://googleusercontent.com/maps.google.com/?q=${exactLocation.lat},${exactLocation.lng}`
      : '';

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            store_id: config.id,
            branch_id: selectedBranch ? selectedBranch.id : null,
            customer_name: customerName,
            customer_phone: customerPhone,
            items: cart,
            total,
            status: 'pendiente',
            note,
            payment_method: paymentMethod,
            delivery_type: deliveryMode,
            delivery_zone: deliveryMode === 'delivery' ? `A ${distanceKm}km` : 'Retiro en Local',
            delivery_cost: finalDeliveryCost,
            location_link: googleMapsLink,
            lat: exactLocation?.lat,
            lng: exactLocation?.lng,
            paid: false,
          },
        ])
        .select();

      if (error) throw error;
      const newOrder = data[0];

      for (const item of cart) {
        const { error: stockError } = await supabase.rpc('decrement_stock', {
          p_product_id: item.id,
          p_quantity: item.quantity,
        });
        if (stockError) logger.error('Error de stock:', stockError);
      }

      if (newOrder) {
        localStorage.setItem('activeOrderId', newOrder.id);
        onSuccess(newOrder);
      }

      if (paymentMethod === 'mercadopago') {
        const { data: mpData, error: mpError } = await supabase.functions.invoke('create-order-preference', {
          body: JSON.stringify({
            store_id: config.id,
            items: cart,
            order_id: newOrder.id,
            domain_url: window.location.origin,
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        if (mpError) {
          logger.error('Error MP:', mpError);
          alert('Error conectando con MP. Enviando como pedido normal.');
        } else if (mpData?.init_point) {
          window.location.href = mpData.init_point;
          return;
        }
      }

      const adminPhone = (selectedBranch?.phone || config?.phone || '549264000000').replace(/\D/g, '');
      const trackingToken = newOrder.tracking_token || newOrder.id;
      const trackingLink = `${window.location.origin}/tracking/${trackingToken}`;

      let msg = `👋 *¡HOLA! QUIERO HACER UN PEDIDO* 🍽️\n`;
      if (selectedBranch) msg += `📍 *Sucursal:* ${selectedBranch.name}\n`;
      msg += `🆔 *ID:* #${newOrder.id}\n\n`;
      msg += `👤 *Cliente:* ${customerName}\n`;
      msg += `📞 *Tel:* ${customerPhone}\n\n`;
      msg += `🧾 *DETALLE DEL PEDIDO:*\n`;
      cart.forEach((i) => {
        msg += `▪️ *${i.quantity}x* ${i.name}`;
        if (i.variantName) msg += ` _(${i.variantName})_`;
        if (i.extrasNames) msg += `\n   └ ➕ ${i.extrasNames}`;
        msg += `\n`;
      });
      msg += `\n💰 *TOTAL FINAL:* $${total.toLocaleString('es-AR')}\n`;
      msg += `💳 *Forma de Pago:* ${paymentMethod === 'mercadopago' ? '✅ Mercado Pago' : '💵 Efectivo'}\n\n`;
      msg += `📦 *MÉTODO DE ENTREGA:*\n`;
      if (deliveryMode === 'delivery') {
        msg += `🛵 *Envío a Domicilio*\n`;
        msg += `📍 *Ubicación:* ${googleMapsLink}\n`;
      } else {
        msg += `🛍️ *Retiro en Local (Takeaway)*\n`;
      }
      if (note) msg += `\n📝 *NOTA:* _${note}_\n`;
      msg += `\n🔗 *Seguimiento:* ${trackingLink}\n`;
      msg += `\n🚀 _Pedido generado desde la Web_`;

      clearCart();
      onClose();

      const whatsappUrl = `https://api.whatsapp.com/send?phone=${adminPhone}&text=${encodeURIComponent(msg)}`;
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      alert('Error al procesar el pedido: ' + err.message);
      logger.error(err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/90 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-50 flex h-[92vh] w-full max-w-[500px] flex-col rounded-t-[var(--radius-xl)] border border-rule-strong bg-ink-2 shadow-[var(--shadow-editorial)] sm:h-[88vh] sm:rounded-[var(--radius-xl)]"
      >
        <header className="flex items-center justify-between rounded-t-[var(--radius-xl)] border-b border-rule bg-ink-3 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${brandColor}20`, color: brandColor }}>
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <Eyebrow>Tu pedido</Eyebrow>
              <h2 className="display text-xl text-text">
                <em className="display-italic">{cart.length}</em> {cart.length === 1 ? 'item' : 'items'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-5">
          {/* Items */}
          <section className="space-y-2">
            {cart.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">
                    {item.name}
                    {item.variantName && <span className="text-text-muted"> · {item.variantName}</span>}
                  </p>
                  {item.extrasNames && (
                    <p className="mono mt-0.5 truncate text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                      + {item.extrasNames}
                    </p>
                  )}
                  <p className="num mt-1 text-xs text-text-muted">
                    ${parseFloat(item.finalPrice).toLocaleString()} c/u
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-rule bg-ink-2 p-1">
                  <button
                    onClick={() => {
                      if (item.quantity > 1) updateQuantity(item.uniqueId, -1);
                      else removeItem(item.uniqueId);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-[6px] text-text hover:bg-white/5"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="num w-5 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.uniqueId, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-paper text-ink-text hover:brightness-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="num min-w-[60px] text-right text-sm font-semibold text-text">
                  ${(parseFloat(item.finalPrice) * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </section>

          {/* Datos */}
          <section>
            <Rule label="Tus datos" />
            <div className="mt-5 grid gap-3 rounded-[var(--radius-md)] border border-rule-strong bg-ink-3 p-4">
              <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-rule bg-ink p-3 focus-within:border-text">
                <User className="h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Tu nombre *"
                  className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-rule bg-ink p-3 focus-within:border-text">
                <Phone className="h-4 w-4 text-text-muted" />
                <input
                  type="tel"
                  placeholder="Teléfono *"
                  className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Entrega */}
          <section>
            <Rule label="Entrega" />
            <div className="mt-5 flex gap-2 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-1">
              <ToggleButton
                text="Delivery"
                active={deliveryMode === 'delivery'}
                onClick={() => setDeliveryMode('delivery')}
                color={brandColor}
              />
              <ToggleButton
                text="Retiro"
                active={deliveryMode === 'retiro'}
                onClick={() => setDeliveryMode('retiro')}
                color={brandColor}
              />
            </div>
            {deliveryMode === 'delivery' && (
              <div className="mt-4 space-y-2 anim-fade">
                <div className="flex items-center justify-between">
                  <span className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                    Ubicación de entrega
                  </span>
                  {distanceKm > 0 && (
                    <span className="mono inline-flex items-center gap-1 rounded-full border border-ml/30 bg-ml/10 px-2 py-0.5 text-[10px] text-ml-soft">
                      <Ruler className="h-3 w-3" /> {distanceKm} km
                    </span>
                  )}
                </div>
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  storeLocation={storeLoc}
                  initialPosition={exactLocation}
                />
              </div>
            )}
          </section>

          {/* Pago */}
          <section>
            <Rule label="Forma de pago" />
            <div className="mt-5 flex gap-3">
              <PaymentOption
                id="mercadopago"
                icon={CreditCard}
                label="Mercado Pago"
                hint="Pago online"
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                color={brandColor}
                customColor="#009EE3"
              />
              <PaymentOption
                id="efectivo"
                icon={Banknote}
                label="Efectivo"
                hint="En el lugar"
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                color={brandColor}
              />
            </div>
            <AnimatePresence>
              {paymentMethod === 'mercadopago' && config?.cbu_alias && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 flex items-center justify-between rounded-[var(--radius-md)] border border-ml/30 bg-ml/10 p-4">
                    <div className="min-w-0">
                      <p className="mono text-[10px] uppercase tracking-[0.22em] text-ml-soft">
                        Alias de respaldo
                      </p>
                      <p className="mono mt-1 select-all truncate font-semibold text-text">
                        {config.cbu_alias}
                      </p>
                    </div>
                    <button
                      onClick={copyAlias}
                      className={`rounded-[8px] p-2 transition-colors ${
                        copied ? 'bg-acid text-ink' : 'bg-ml text-white hover:brightness-110'
                      }`}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Cupón + nota */}
          <section className="space-y-3">
            <div className="flex gap-2">
              <input
                className="mono flex-1 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm uppercase tracking-[0.15em] text-text placeholder:text-text-subtle focus:border-text focus:outline-none"
                placeholder="¿Tenés cupón?"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
              <Button onClick={applyCoupon} variant="outline" size="sm">
                Aplicar
              </Button>
            </div>
            {couponMessage && (
              <p
                className={`mono text-center text-[11px] uppercase tracking-[0.22em] ${
                  discount > 0 ? 'text-acid' : 'text-signal'
                }`}
              >
                {couponMessage}
              </p>
            )}
            <textarea
              className="h-16 w-full resize-none rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text placeholder:text-text-subtle focus:border-text focus:outline-none"
              placeholder="Nota (ej: sin cebolla)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </section>
        </div>

        <footer className="rounded-b-[var(--radius-xl)] border-t border-rule bg-ink-3 p-5 pb-8 sm:pb-5">
          <div className="mb-1 flex justify-between text-sm text-text-muted">
            <span>Subtotal</span>
            <span className="num">${subtotal.toLocaleString()}</span>
          </div>
          {deliveryMode === 'delivery' && (
            <div className="mb-1 flex justify-between text-sm text-text-muted">
              <span>Envío ({distanceKm} km)</span>
              <span className="num">
                {exactLocation ? `+${deliveryCost.toLocaleString()}` : 'Calculando…'}
              </span>
            </div>
          )}
          {discount > 0 && (
            <div className="mb-1 flex justify-between text-sm text-acid">
              <span>Descuento</span>
              <span className="num">-${(subtotal * (discount / 100)).toLocaleString()}</span>
            </div>
          )}

          <Rule className="my-4" />

          <div className="mb-4 flex items-baseline justify-between">
            <span className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">Total</span>
            <span className="display num text-3xl text-text">${total.toLocaleString()}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isSending}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] py-4 font-semibold shadow-[var(--shadow-lift)] transition-all active:scale-95 hover:brightness-110"
            style={{
              backgroundColor: paymentMethod === 'mercadopago' ? '#009EE3' : brandColor,
              color: paymentMethod === 'mercadopago' ? 'white' : 'black',
            }}
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : paymentMethod === 'mercadopago' ? (
              <>Pagar con Mercado Pago <ArrowRight className="h-4 w-4" /></>
            ) : (
              <>Enviar pedido por WhatsApp <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </footer>
      </motion.div>
    </div>
  );
};

const StatusTracker = ({ order, onClose, brandColor }) => {
  const navigate = useNavigate();
  const { cart } = useCartStore();
  const positionClass = cart.length > 0 ? 'bottom-24' : 'bottom-4';

  if (!order) return null;

  if (order.status === 'rechazado') {
    return (
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className={`fixed ${positionClass} inset-x-4 z-40 mx-auto max-w-md rounded-[var(--radius-md)] border border-signal/50 bg-signal/10 p-4 shadow-[var(--shadow-lift)] backdrop-blur-md`}
      >
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full p-1 text-signal-soft hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center justify-between">
          <span className="mono text-[10px] uppercase tracking-[0.22em] text-signal-soft">
            Pedido #{order.id}
          </span>
          <span className="mono inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-signal">
            <AlertTriangle className="h-3 w-3" /> Cancelado
          </span>
        </div>
        <p className="display mt-2 text-xl text-text">Pedido rechazado</p>
        <p className="mt-1 text-sm text-signal-soft">"{order.rejection_reason || 'Sin motivo'}"</p>
      </motion.div>
    );
  }

  const steps = {
    pendiente: { label: 'Recibido', width: '25%' },
    preparacion: { label: 'En preparación', width: '55%' },
    terminado: { label: 'En camino / listo', width: '90%' },
    entregado: { label: 'Entregado', width: '100%' },
  };

  let labelText = steps[order.status]?.label;
  if (order.status === 'terminado' && order.rider_id) labelText = 'En camino';
  const currentStep = steps[order.status] || { label: 'Procesando…', width: '10%' };

  return (
    <motion.div
      onClick={() => {
        const trackingIdentifier = order.tracking_token || order.id;
        navigate(`/tracking/${trackingIdentifier}`);
      }}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={`fixed ${positionClass} inset-x-4 z-40 mx-auto max-w-md cursor-pointer rounded-[var(--radius-md)] border border-rule-strong bg-ink-2 p-4 shadow-[var(--shadow-lift)] transition-colors hover:border-acid`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-2 top-2 rounded-full p-1 text-text-muted hover:text-text"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
          Pedido #{order.id}
        </span>
        <span className="mono inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-text-muted">
          <Clock className="h-3 w-3" /> Seguimiento en vivo
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-rule">
        <div
          className="h-full transition-all duration-1000"
          style={{ width: currentStep.width, backgroundColor: brandColor }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="display text-xl text-text">{labelText}</p>
        <span className="mono inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: brandColor }}>
          Ver detalles <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </motion.div>
  );
};

export default function GastronomyHome() {
  const { store: config, loading: loadingConfig, selectedBranch } = useStore();
  const safeConfig = config || { store_name: 'Cargando…', color_accent: '#D0FF00', logo_url: '', banner_url: '' };

  const { menuItems, categories, loading } = useMenuData(config?.id, selectedBranch?.id);
  const { isOpen, loading: statusLoading } = useStoreStatus();
  const { clearCart } = useCartStore();

  const brandColor = safeConfig.color_accent || '#D0FF00';

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const status = query.get('status');

    if (status === 'success' || status === 'pending') {
      window.history.replaceState({}, document.title, window.location.pathname);
      alert(
        status === 'success'
          ? '¡Pago recibido! Estamos preparando tu pedido.'
          : 'Pago en proceso. Te avisaremos cuando se confirme.'
      );
      clearCart();
    }
  }, [clearCart]);

  const isStoreOpen = useMemo(() => {
    if (!isOpen) return false;
    if (config?.auto_schedule && config.schedule_start && config.schedule_end) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = config.schedule_start.split(':').map(Number);
      const [endH, endM] = config.schedule_end.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      if (startMinutes < endMinutes)
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
    return true;
  }, [isOpen, config]);

  const [activeCategory, setActiveCategory] = useState('Todos');
  const orderType = 'delivery';
  const [searchTerm, setSearchTerm] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);
  const [variantItem, setVariantItem] = useState(null);
  const [extrasItem, setExtrasItem] = useState(null);
  const { addItem, cart } = useCartStore();
  const [activeOrder, setActiveOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [userInitialLocation, setUserInitialLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    const hasInteracted = sessionStorage.getItem('locationInteracted');
    if (!userInitialLocation && !hasInteracted) {
      const timer = setTimeout(() => setShowLocationModal(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [userInitialLocation]);

  const handleEnableLocation = () => {
    setShowLocationModal(false);
    sessionStorage.setItem('locationInteracted', 'true');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserInitialLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => logger.debug('GPS Denied'),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const handleSkipLocation = () => {
    setShowLocationModal(false);
    sessionStorage.setItem('locationInteracted', 'true');
  };

  useEffect(() => {
    const checkActiveOrder = async () => {
      const orderId = localStorage.getItem('activeOrderId');
      if (orderId) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('store_id', config.id)
          .single();
        if (data && data.status !== 'archivado') setActiveOrder(data);
        else {
          localStorage.removeItem('activeOrderId');
          setActiveOrder(null);
        }
      }
    };
    checkActiveOrder();
    const interval = setInterval(checkActiveOrder, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCloseTracker = () => {
    setActiveOrder(null);
    localStorage.removeItem('activeOrderId');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddItem = (item) => {
    if (item.has_variants) {
      setVariantItem(item);
    } else if (item.extras && Array.isArray(item.extras) && item.extras.length > 0) {
      setExtrasItem({ ...item, finalPrice: item.price });
    } else {
      addItem(
        { ...item, finalPrice: item.price, uniqueId: `${item.id}:base:no-extras` },
        selectedBranch?.id
      );
      showToast(`${item.name} agregado`);
    }
  };

  const confirmVariant = (item, variant) => {
    setVariantItem(null);
    const itemWithVariant = { ...item, finalPrice: variant.price, variantName: variant.name };
    if (item.extras && Array.isArray(item.extras) && item.extras.length > 0) {
      setExtrasItem(itemWithVariant);
    } else {
      addItem(
        { ...itemWithVariant, uniqueId: `${item.id}:${variant.name}:no-extras` },
        selectedBranch?.id
      );
      showToast(`${item.name} agregado`);
    }
  };

  const confirmExtras = (item, selectedExtras) => {
    setExtrasItem(null);
    const extrasPrice = selectedExtras.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
    const extrasNames = selectedExtras.map((e) => e.name).join(', ');
    const base = parseFloat(item.finalPrice || item.price) || 0;

    addItem(
      {
        ...item,
        uniqueId: `${item.id}:${item.variantName || 'base'}:${extrasNames || 'no-extras'}`,
        finalPrice: base + extrasPrice,
        extrasNames,
        extrasPrice,
      },
      selectedBranch?.id
    );
    showToast(`${item.name} agregado`);
  };

  const filteredItems = useMemo(() => {
    let items = activeCategory === 'Todos' ? menuItems : menuItems.filter((i) => i.category === activeCategory);
    if (searchTerm) items = items.filter((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return items;
  }, [activeCategory, menuItems, searchTerm]);

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + parseFloat(item.finalPrice) * item.quantity, 0);

  if (loading || statusLoading || loadingConfig)
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="h-10 w-10 animate-spin text-acid" />
      </div>
    );

  return (
    <div className="flex min-h-screen justify-center bg-ink">
      <div className="relative min-h-screen w-full max-w-[500px] border-x border-rule bg-ink-2 pb-32 shadow-[var(--shadow-editorial)]">
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center"
            >
              <div className="flex items-center gap-2 rounded-full bg-acid px-5 py-2.5 text-sm font-semibold text-ink shadow-[var(--shadow-lift)]">
                <Check className="h-4 w-4" /> {toastMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full">
          {/* Header con banner */}
          <header className="relative mb-4 h-56 overflow-hidden">
            <img
              src={
                safeConfig.banner_url ||
                'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=1200'
              }
              alt={safeConfig.store_name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-transparent to-ink-2" />

            <div
              className={`mono absolute right-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur-md ${
                isStoreOpen ? 'border border-acid/40 bg-acid/15 text-acid' : 'border border-signal/40 bg-signal/15 text-signal'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isStoreOpen ? 'bg-acid' : 'bg-signal'}`} />
              {isStoreOpen ? 'Abierto' : 'Cerrado'}
            </div>

            <div className="absolute -bottom-10 inset-x-0 flex justify-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-[5px] border-ink-2 bg-ink-3 shadow-[var(--shadow-lift)]">
                <img
                  src={safeConfig.logo_url || 'https://placehold.co/100x100?text=LOGO'}
                  alt={safeConfig.store_name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </header>

          <div className="mb-6 mt-12 px-4 text-center">
            <Eyebrow className="justify-center">Menú digital</Eyebrow>
            <h1 className="display mt-3 text-3xl text-text md:text-4xl">{safeConfig.store_name}</h1>
            <p className="mt-2 text-sm text-text-muted">El mejor sabor, al alcance de un tap.</p>
          </div>

          {/* Search */}
          <div className="mb-5 px-4">
            <div className="relative">
              <Search className="pointer-events-none absolute inset-y-0 left-4 my-auto h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="¿Qué se te antoja hoy?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-[var(--radius-md)] border border-rule-strong bg-ink-3 py-3.5 pl-11 pr-4 text-sm text-text placeholder:text-text-subtle focus:border-text focus:outline-none"
              />
            </div>
          </div>

          {/* Categorías */}
          <div className="no-scrollbar sticky top-0 z-30 mb-6 flex gap-2 overflow-x-auto border-b border-rule bg-ink-2/95 px-4 py-4 backdrop-blur-md">
            <CategoryPill
              label="Todos"
              active={activeCategory === 'Todos'}
              onClick={() => setActiveCategory('Todos')}
              color={brandColor}
            />
            {categories.map((cat) => (
              <CategoryPill
                key={cat}
                label={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                color={brandColor}
              />
            ))}
          </div>

          {/* Productos */}
          <div className="flex flex-col gap-3 px-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  isOpen={isStoreOpen}
                  onAdd={handleAddItem}
                  color={brandColor}
                />
              ))
            ) : (
              <div className="flex flex-col items-center py-20 text-center">
                <ShoppingBag className="mb-4 h-12 w-12 text-text-subtle opacity-60" />
                <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">
                  No encontramos productos
                </p>
              </div>
            )}
          </div>

          <footer className="mb-8 mt-16 text-center opacity-50">
            <p className="mono text-[10px] uppercase tracking-[0.24em] text-text-subtle">Powered by</p>
            <p className="display mt-1 text-sm text-text">Riva Estudio</p>
          </footer>
        </div>

        <CartSummaryButton
          count={cartItemCount}
          total={cartTotal}
          isStoreOpen={isStoreOpen}
          onOpen={() => isStoreOpen && setShowCartModal(true)}
          color={brandColor}
        />

        <StatusTracker order={activeOrder} onClose={handleCloseTracker} brandColor={brandColor} />

        <AnimatePresence>
          {showLocationModal && (
            <LocationRequestModal onEnable={handleEnableLocation} onSkip={handleSkipLocation} color={brandColor} />
          )}

          {showCartModal && (
            <CartModal
              isOpen={showCartModal}
              onClose={() => setShowCartModal(false)}
              defaultOrderType={orderType}
              onSuccess={(o) => setActiveOrder(o)}
              config={safeConfig}
              preloadedLocation={userInitialLocation}
            />
          )}

          {variantItem && (
            <VariantsModal
              item={variantItem}
              onClose={() => setVariantItem(null)}
              onConfirm={confirmVariant}
              color={brandColor}
            />
          )}

          {extrasItem && (
            <ExtrasModal
              item={extrasItem}
              onClose={() => setExtrasItem(null)}
              onConfirm={confirmExtras}
              color={brandColor}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
