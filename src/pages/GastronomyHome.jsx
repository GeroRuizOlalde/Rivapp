import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/client';
import { useStore } from '../context/useStore';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger'; 

import { useCartStore } from "../store/useCartStore";
import { useMenuData } from "../hooks/useMenuData";
import { useStoreStatus } from "../hooks/useStoreStatus";
import { 
  Search, Loader2, Lock, X, Banknote, CreditCard, MapPin, 
  Copy, Check, Navigation, Ruler, Clock, AlertTriangle, 
  ShoppingBag, Plus, Minus, ChevronRight, Phone, User, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// --- CONFIGURACIÓN LEAFLET ---
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// --- CONSTANTES ---
const PRECIO_BASE = 500;   
const PRECIO_POR_KM = 300; 
const DEFAULT_COORDS = { lat: -31.546787, lng: -68.564150 };

// --- HELPERS ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180); 
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))); 
};

// --- COMPONENTES UI ---

const LocationRequestModal = ({ onEnable, onSkip, color }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-[#1a1a1a] w-full max-w-sm p-6 rounded-3xl border border-white/10 text-center shadow-2xl relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <MapPin size={32} style={{ color: color || '#fff' }} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">¿Dónde te encuentras?</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Necesitamos tu ubicación para calcular el <strong>costo de envío exacto</strong> y mostrarte el tiempo de demora real.
            </p>
            <div className="space-y-3">
                <button onClick={onEnable} className="w-full py-3.5 rounded-xl font-bold text-black shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2" style={{ backgroundColor: color || '#d0ff00' }}>
                    <Navigation size={18} /> Activar Ubicación
                </button>
                <button onClick={onSkip} className="w-full py-3 rounded-xl font-bold text-gray-500 hover:text-white transition-colors text-sm">
                    Ingresaré mi dirección manualmente
                </button>
            </div>
        </motion.div>
    </div>
);

const ToggleButton = ({ active, text, onClick, color }) => ( 
    <button onClick={onClick} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${active?"text-black shadow-lg scale-[1.02]":"bg-[#1a1a1a] text-gray-400 border border-white/5"}`} style={active ? {backgroundColor: color || '#d0ff00'} : {}}>{text}</button> 
);

const CategoryPill = ({ label, active, onClick, color }) => ( 
    <button onClick={onClick} className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all ${active?"text-black shadow-lg scale-105":"bg-[#1a1a1a] text-gray-400 border border-white/5 hover:bg-white/5"}`} style={active ? {backgroundColor: color || '#d0ff00'} : {}}>{label}</button> 
);

const PaymentOption = ({ id, icon: Icon, label, selected, onSelect, color, customColor }) => {
    const isSelected = selected === id;
    const activeBorderColor = customColor || color;
    const activeIconColor = customColor || color;
    const activeBgClass = isSelected ? 'bg-[#1a1a1a] border-2 text-white' : 'bg-[#1a1a1a] border-white/5 text-gray-500';

    return (
        <button 
            onClick={() => onSelect(id)} 
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${activeBgClass}`} 
            style={isSelected ? {borderColor: activeBorderColor} : {}}
        >
            <Icon size={24} style={isSelected ? {color: activeIconColor} : {}} />
            <span className="text-xs font-bold">{label}</span>
        </button> 
    );
};

const LocationMarker = ({ position, setPosition, onLocationSelect }) => {
  const map = useMapEvents({ click(e) { const newPos = { lat: e.latlng.lat, lng: e.latlng.lng }; setPosition(newPos); onLocationSelect(newPos); map.flyTo(e.latlng, map.getZoom()); } });
  useEffect(() => { if (position) map.flyTo([position.lat, position.lng], 16); }, [position, map]);
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
              setPosition(newPos); onLocationSelect(newPos); setLoadingGPS(false); 
            }, 
            (err) => { logger.error("GPS Error:", err); setLoadingGPS(false); }, 
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          ); 
      } else { setLoadingGPS(false); } 
  };

  useEffect(() => {
    if (!initialPosition) return;

    const syncInitialPositionTimeout = window.setTimeout(() => {
      setPosition(initialPosition);
      onLocationSelect(initialPosition);
    }, 0);

    return () => {
      window.clearTimeout(syncInitialPositionTimeout);
    };
  }, [initialPosition, onLocationSelect]);

  return ( 
    <div className="space-y-2">
        <div className="relative border border-white/10 rounded-xl overflow-hidden h-[200px] w-full z-0 bg-[#222]">
            <MapContainer center={[center.lat, center.lng]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[storeLocation?.lat || DEFAULT_COORDS.lat, storeLocation?.lng || DEFAULT_COORDS.lng]} icon={L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/1008/1008001.png', iconSize: [40, 40] })} />
                <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
            </MapContainer>
            <button onClick={(e) => { e.preventDefault(); getUserLocation(); }} className="absolute bottom-3 right-3 bg-white text-black p-3 rounded-full shadow-xl z-[1000] active:scale-90 transition-transform">
                {loadingGPS ? <Loader2 className="animate-spin" size={20}/> : <Navigation size={20}/>}
            </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1"><MapPin size={10}/> Toca el mapa para ajustar tu entrega exacta.</p>
    </div> 
  );
};

const ProductCard = ({ item, isOpen, onAdd, color }) => {
  const { cart } = useCartStore();
  const quantity = cart.filter(p => p.id === item.id).reduce((acc, curr) => acc + curr.quantity, 0);
  const isOut = !item.has_infinite_stock && item.stock <= 0;
  const imageSrc = item.image && item.image.length > 5 ? item.image : "https://placehold.co/400x400/222/white?text=Sin+Foto";
  const brandColor = color || '#d0ff00';

  return ( 
    <div className={`bg-[#1a1a1a] p-3 rounded-2xl border border-white/5 flex gap-4 transition-all hover:border-white/10 ${!isOpen || isOut ? 'opacity-50 grayscale' : ''}`}>
        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-800">
            <img src={imageSrc} className="w-full h-full object-cover" alt={item.name} />
        </div>
        <div className="flex-1 flex flex-col justify-between py-1">
            <div>
                <h3 className="font-bold text-white text-base leading-tight mb-1">{item.name}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
            </div>
            <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-lg" style={{color: brandColor}}>
                    {item.has_variants ? "Desde" : ""} ${item.has_variants && item.variants?.length > 0 ? parseFloat(item.variants[0].price).toLocaleString() : parseFloat(item.price).toLocaleString()}
                </span>
                {isOpen && !isOut ? ( 
                    <button onClick={() => onAdd(item)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-black hover:scale-110 transition-transform relative"> 
                        <Plus size={18} strokeWidth={3}/>
                        {quantity > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold border-2 border-[#1a1a1a]">{quantity}</span>} 
                    </button> 
                ) : ( 
                    <span className="text-red-500 text-[10px] font-bold border border-red-500/30 px-2 py-1 rounded uppercase">{isOut ? "AGOTADO" : "CERRADO"}</span> 
                )}
            </div>
        </div>
    </div> 
  );
};

const CartSummaryButton = ({ count, total, isStoreOpen, onOpen, color }) => {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none">
      <button
        onClick={onOpen}
        disabled={!isStoreOpen}
        className={`pointer-events-auto w-full max-w-md h-14 rounded-xl font-bold text-lg shadow-xl flex items-center justify-between px-6 transition-all active:scale-95 ${
          isStoreOpen ? 'text-black' : 'bg-gray-600 text-gray-300'
        }`}
        style={isStoreOpen ? { backgroundColor: color || '#d0ff00' } : {}}
      >
        {isStoreOpen ? (
          <>
            <div className="flex items-center gap-3">
              <span className="bg-black/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black">{count}</span>
              <span>Ver Pedido</span>
            </div>
            <span>${total.toLocaleString()}</span>
          </>
        ) : (
          <div className="flex items-center justify-center w-full gap-2">
            <Lock size={20} />
            <span>Cerrado</span>
          </div>
        )}
      </button>
    </div>
  );
};

// --- MODALES (VARIANTS, EXTRAS) ---
const VariantsModal = ({ item, onClose, onConfirm, color }) => ( 
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in zoom-in-95">
        <div className="bg-[#1a1a1a] w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10">
                <h3 className="font-bold text-white text-xl">Elige una opción</h3>
                <p className="text-sm text-gray-400">Para: {item.name}</p>
            </div>
            <div className="p-5 space-y-3">
                {item.variants?.map((v, i) => (
                    <button key={i} onClick={() => onConfirm(item, v)} className="w-full flex justify-between items-center p-4 rounded-xl border border-white/5 bg-black/30 hover:bg-white/5 transition-all text-left group">
                        <span className="text-white font-bold group-hover:text-white transition-colors">{v.name}</span>
                        <span className="font-bold" style={{color: color}}>${parseFloat(v.price).toLocaleString()}</span>
                    </button>
                ))}
            </div>
            <div className="p-5 pt-0">
                <button onClick={onClose} className="w-full bg-white/5 py-4 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all">Cancelar</button>
            </div>
        </div>
    </div> 
);

const ExtrasModal = ({ item, onClose, onConfirm, color }) => { 
    const [selectedExtras, setSelectedExtras] = useState([]); 
    const basePrice = parseFloat(item.finalPrice || item.price) || 0; 
    
    const toggleExtra = (extra) => { 
        if (selectedExtras.find(e => e.name === extra.name)) { setSelectedExtras(selectedExtras.filter(e => e.name !== extra.name)); } 
        else { setSelectedExtras([...selectedExtras, extra]); } 
    }; 
    const totalPrice = basePrice + selectedExtras.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0); 
    
    return ( 
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in zoom-in-95">
            <div className="bg-[#1a1a1a] w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-white/10">
                    <h3 className="font-bold text-white text-xl">Personalizar</h3>
                    <p className="text-sm text-gray-400">{item.name} {item.variantName && `(${item.variantName})`}</p>
                </div>
                <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Adicionales</p>
                    {item.extras?.map((extra, i) => { 
                        const isSelected = selectedExtras.find(e => e.name === extra.name); 
                        return (
                            <button key={i} onClick={() => toggleExtra(extra)} className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all ${isSelected ? 'bg-white text-black border-white' : 'bg-black/30 border-white/5 text-gray-400'}`}>
                                <span>{extra.name}</span>
                                <span className="font-bold">+${parseFloat(extra.price).toLocaleString()}</span>
                            </button>
                        )
                    })}
                </div>
                <div className="p-5 border-t border-white/10 bg-[#1a1a1a] flex flex-col gap-3">
                    <button onClick={() => onConfirm(item, selectedExtras)} className="w-full py-4 rounded-xl font-bold text-black shadow-lg transition-transform active:scale-95" style={{backgroundColor: color}}>
                        Agregar Total: ${totalPrice.toLocaleString()}
                    </button>
                    <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-gray-500 hover:text-white">Cancelar</button>
                </div>
            </div>
        </div> 
    ); 
};

// --- CHECKOUT / CARRITO ---
const CartModal = ({ isOpen, onClose, defaultOrderType, onSuccess, config, preloadedLocation }) => {
  const { cart, clearCart, removeItem, updateQuantity } = useCartStore();
  
  // 🟢 1. TRAEMOS LA SUCURSAL SELECCIONADA AQUÍ TAMBIÉN
  const { selectedBranch } = useStore(); 

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [deliveryMode, setDeliveryMode] = useState(defaultOrderType || "delivery");
  const [exactLocation, setExactLocation] = useState(preloadedLocation || null); 
  const [distanceKm, setDistanceKm] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("mercadopago"); 
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0); 
  const [couponMessage, setCouponMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  // Usamos la lat/lng de la SUCURSAL si existe, sino la del STORE, sino Default
  const storeLoc = useMemo(() => (
      selectedBranch?.lat && selectedBranch?.lng
        ? { lat: selectedBranch.lat, lng: selectedBranch.lng }
        : (config?.lat ? { lat: config.lat, lng: config.lng } : DEFAULT_COORDS)
  ), [config?.lat, config?.lng, selectedBranch?.lat, selectedBranch?.lng]);

  const brandColor = config?.color_accent || '#d0ff00';

  useEffect(() => { if (defaultOrderType) setDeliveryMode(defaultOrderType); }, [defaultOrderType, isOpen]);

  useEffect(() => {
      if(exactLocation && storeLoc) {
          const dist = calculateDistance(storeLoc.lat, storeLoc.lng, exactLocation.lat, exactLocation.lng);
          setDistanceKm(dist.toFixed(1)); 
          // Precio base + Precio por KM (ajustable por tienda en el futuro)
          const cost = Math.ceil(PRECIO_BASE + (dist * PRECIO_POR_KM));
          setDeliveryCost(cost);
      }
  }, [exactLocation, storeLoc]);

  const handleLocationSelect = (pos) => { setExactLocation(pos); };

  const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.finalPrice) * item.quantity), 0);
  const finalDeliveryCost = deliveryMode === 'delivery' ? deliveryCost : 0;
  const total = (subtotal - (subtotal * (discount / 100))) + finalDeliveryCost;

  const copyAlias = () => { navigator.clipboard.writeText(config?.cbu_alias || "ALIAS"); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  
  const applyCoupon = async () => { 
      if (!couponCode) return; 
      const { data } = await supabase.from('coupons').select('*').eq('code', couponCode.toUpperCase()).eq('store_id', config.id).single(); 
      if (data) { setDiscount(data.discount); setCouponMessage(`¡-${data.discount}% aplicado! 🎉`); } 
      else { setDiscount(0); setCouponMessage("Cupón inválido ❌"); } 
  };

  const handleCheckout = async () => {
    if (!customerName.trim()) return alert("⚠️ Por favor escribe tu nombre.");
    if (!customerPhone.trim()) return alert("⚠️ Por favor escribe tu teléfono para contactarte.");
    if (deliveryMode === 'delivery' && !exactLocation) return alert("📍 Por favor marca tu ubicación en el mapa.");

    setIsSending(true); 
    
    const googleMapsLink = exactLocation 
        ? `http://googleusercontent.com/maps.google.com/?q=${exactLocation.lat},${exactLocation.lng}` 
        : '';
    
    try {
      // 1. Insertar pedido con branch_id
      const { data, error } = await supabase.from('orders').insert([{ 
          store_id: config.id,
          branch_id: selectedBranch ? selectedBranch.id : null, // 🟢 IMPORTANTE: ID de Sucursal
          customer_name: customerName, 
          customer_phone: customerPhone, 
          items: cart, 
          total: total, 
          status: 'pendiente', 
          note: note, 
          payment_method: paymentMethod, 
          delivery_type: deliveryMode, 
          delivery_zone: deliveryMode === 'delivery' ? `A ${distanceKm}km` : 'Retiro en Local', 
          delivery_cost: finalDeliveryCost, 
          location_link: googleMapsLink, 
          lat: exactLocation?.lat, 
          lng: exactLocation?.lng,
          paid: false
      }]).select();

      if(error) throw error;
      const newOrder = data[0];

      // 2. Stock (Decrementamos usando la RPC segura)
      for (const item of cart) {
          const { error: stockError } = await supabase.rpc('decrement_stock', { 
              p_product_id: item.id, 
              p_quantity: item.quantity 
          });
          if (stockError) logger.error("Error de stock:", stockError);
      }

      if (newOrder) { 
          localStorage.setItem('activeOrderId', newOrder.id); 
          onSuccess(newOrder); 
      }

      // 3. Mercado Pago
      if (paymentMethod === 'mercadopago') {
            const { data: mpData, error: mpError } = await supabase.functions.invoke('create-order-preference', {
                body: JSON.stringify({
                    store_id: config.id,
                    items: cart,
                    order_id: newOrder.id,
                    domain_url: window.location.origin
                }),
                headers: { "Content-Type": "application/json" }
            });

            if (mpError) {
                logger.error("Error MP:", mpError);
                alert("Error conectando con MP. Enviando como pedido normal.");
            } else if (mpData?.init_point) {
                window.location.href = mpData.init_point;
                return;
            }
      }

      // 🟢 4. WHATSAPP (Usamos el teléfono de la sucursal si existe, sino el de la tienda)
      const adminPhone = (selectedBranch?.phone || config?.phone || "549264000000").replace(/\D/g, '');
      
      const trackingToken = newOrder.tracking_token || newOrder.id;
      const trackingLink = `${window.location.origin}/tracking/${trackingToken}`;

      let msg = `👋 *¡HOLA! QUIERO HACER UN PEDIDO* 🍽️\n`;
      if (selectedBranch) msg += `📍 *Sucursal:* ${selectedBranch.name}\n`;
      msg += `🆔 *ID:* #${newOrder.id}\n\n`;

      msg += `👤 *Cliente:* ${customerName}\n`;
      msg += `📞 *Tel:* ${customerPhone}\n\n`;

      msg += `🧾 *DETALLE DEL PEDIDO:*\n`;
      cart.forEach(i => {
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

      if (note) {
          msg += `\n📝 *NOTA:* _${note}_\n`;
      }

      msg += `\n🔗 *Seguimiento:* ${trackingLink}\n`;
      msg += `\n🚀 _Pedido generado desde la Web_`;

      clearCart(); 
      onClose(); 

      const whatsappUrl = `https://api.whatsapp.com/send?phone=${adminPhone}&text=${encodeURIComponent(msg)}`;
      window.open(whatsappUrl, '_blank'); 

    } catch (err) { 
        alert("Error al procesar el pedido: " + err.message); 
        logger.error(err);
    } finally {
        setIsSending(false);
    }
  };

  if(!isOpen) return null;

  return ( 
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
        
        <motion.div 
            initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} 
            className="bg-[#121212] w-full max-w-[500px] h-[90vh] sm:h-[85vh] sm:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl relative flex flex-col z-50"
        >
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a] rounded-t-3xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><ShoppingBag size={20} style={{color: brandColor}}/> Tu Pedido</h2>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X className="text-gray-400" size={20}/></button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                <div className="space-y-3">
                    {cart.map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                            <div className="flex-1">
                                <div className="font-bold text-sm text-white">
                                    {item.name} {item.variantName && <span className="text-gray-400 text-xs">({item.variantName})</span>}
                                </div>
                                {item.extrasNames && <div className="text-xs text-gray-500">+ {item.extrasNames}</div>}
                                <div className="text-xs text-gray-400 mt-1">${parseFloat(item.finalPrice).toLocaleString()} c/u</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-1 border border-white/5">
                                    <button onClick={() => { if(item.quantity > 1) updateQuantity(item.uniqueId, -1); else removeItem(item.uniqueId); }} className="w-7 h-7 flex items-center justify-center bg-white/5 rounded hover:bg-white/10 text-white"><Minus size={14}/></button>
                                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.uniqueId, 1)} className="w-7 h-7 flex items-center justify-center bg-white text-black rounded hover:bg-gray-200"><Plus size={14}/></button>
                                </div>
                                <span className="font-bold text-white min-w-[60px] text-right">${(parseFloat(item.finalPrice) * item.quantity).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-white/5 my-4"></div>

                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tus Datos (Obligatorio)</h3>
                    <div className="bg-[#1a1a1a] p-4 rounded-xl space-y-3 border border-white/5">
                        <div className="flex items-center gap-3 bg-[#0f0f0f] p-3 rounded-lg border border-white/10 focus-within:border-white/30 transition-colors">
                            <User size={18} className="text-gray-500"/>
                            <input type="text" placeholder="Tu Nombre *" className="w-full bg-transparent text-white outline-none text-sm" value={customerName} onChange={e=>setCustomerName(e.target.value)}/>
                        </div>
                        <div className="flex items-center gap-3 bg-[#0f0f0f] p-3 rounded-lg border border-white/10 focus-within:border-white/30 transition-colors">
                            <Phone size={18} className="text-gray-500"/>
                            <input type="tel" placeholder="Teléfono *" className="w-full bg-transparent text-white outline-none text-sm" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)}/>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Entrega</h3>
                    <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-xl border border-white/5">
                        <ToggleButton text="Delivery" active={deliveryMode==='delivery'} onClick={()=>setDeliveryMode('delivery')} color={brandColor} />
                        <ToggleButton text="Retiro" active={deliveryMode==='retiro'} onClick={()=>setDeliveryMode('retiro')} color={brandColor} />
                    </div>
                    {deliveryMode === 'delivery' && (
                        <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <p className="text-xs font-bold text-gray-400">Ubicación de entrega:</p>
                                {distanceKm > 0 && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded flex gap-1 items-center"><Ruler size={12}/> {distanceKm} km</span>}
                            </div>
                            <LocationPicker onLocationSelect={handleLocationSelect} storeLocation={storeLoc} initialPosition={exactLocation} />
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pago</h3>
                    <div className="flex gap-3">
                        <PaymentOption id="mercadopago" icon={CreditCard} label="Mercado Pago" selected={paymentMethod} onSelect={setPaymentMethod} color={brandColor} customColor="#009EE3"/>
                        <PaymentOption id="efectivo" icon={Banknote} label="Efectivo" selected={paymentMethod} onSelect={setPaymentMethod} color={brandColor}/>
                    </div>
                    <AnimatePresence>
                        {paymentMethod === 'mercadopago' && (
                            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="overflow-hidden">
                                <div className="p-1">
                                    <p className="text-xs text-gray-500 mb-2 mt-2">Este es nuestro alias, por si no funciona el link:</p>
                                    <div className="bg-[#6b21a8]/20 border border-[#6b21a8] p-4 rounded-xl flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-[#d8b4fe] uppercase font-bold">Alias / CBU:</p>
                                            <p className="font-bold text-white text-lg mt-1 select-all">{config?.cbu_alias || "Consultar"}</p>
                                        </div>
                                        <button onClick={copyAlias} className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-[#6b21a8] text-white hover:bg-[#7e22ce]'}`}>{copied ? <Check size={20}/> : <Copy size={20}/>}</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input className="flex-1 bg-[#1a1a1a] p-3 rounded-xl text-white border border-white/10 outline-none text-sm focus:border-white/30" placeholder="¿Tienes Cupón?" value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())}/>
                        <button onClick={applyCoupon} className="bg-white/10 px-4 rounded-xl font-bold text-xs hover:bg-white/20">Aplicar</button>
                    </div>
                    {couponMessage && <p className={`text-xs text-center ${discount>0?'text-green-500':'text-red-500'}`}>{couponMessage}</p>}
                    <textarea className="w-full bg-[#1a1a1a] p-3 rounded-xl text-white border border-white/10 h-16 resize-none outline-none text-sm focus:border-white/30" placeholder="Nota para cocina (ej: Sin cebolla)..." value={note} onChange={e=>setNote(e.target.value)}/>
                </div>

            </div>

            <div className="p-5 border-t border-white/10 bg-[#1a1a1a] pb-8 sm:pb-5 rounded-b-3xl">
                <div className="flex justify-between mb-1 text-sm text-gray-400"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
                {deliveryMode === 'delivery' && ( <div className="flex justify-between mb-1 text-sm text-gray-400"><span>Envío ({distanceKm} km)</span><span>{exactLocation ? `+${deliveryCost.toLocaleString()}` : 'Calculando...'}</span></div> )}
                {discount > 0 && <div className="flex justify-between mb-1 text-sm text-green-500"><span>Descuento</span><span>-${(subtotal*(discount/100)).toLocaleString()}</span></div>}
                
                <div className="flex justify-between mb-4 items-center">
                    <span className="text-white font-bold text-lg">Total</span>
                    <span className="text-2xl font-black text-white">${total.toLocaleString()}</span>
                </div>
                
                <button onClick={handleCheckout} disabled={isSending} className="w-full py-4 rounded-xl font-bold text-white shadow-lg flex justify-center gap-2 transition-all active:scale-95 hover:brightness-110" style={{backgroundColor: paymentMethod === 'mercadopago' ? '#009EE3' : brandColor, color: paymentMethod === 'mercadopago' ? 'white' : 'black'}}>
                    {isSending ? <Loader2 className="animate-spin"/> : paymentMethod === 'mercadopago' ? 'Pagar con Mercado Pago' : <span className="flex items-center gap-2">Enviar Pedido por WhatsApp <ChevronRight size={18}/></span>}
                </button>
            </div>
        </motion.div>
    </div> 
  );
};

// 🟢 STATUS TRACKER
const StatusTracker = ({ order, onClose }) => {
  const navigate = useNavigate();
  const { cart } = useCartStore(); // Leemos el estado del carrito
  
  const positionClass = cart.length > 0 ? "bottom-24" : "bottom-4";

  if (!order) return null;
  if (order.status === 'rechazado') {
    return ( <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className={`fixed ${positionClass} left-4 right-4 bg-red-900/90 backdrop-blur-md p-4 rounded-xl border border-red-500/50 shadow-2xl z-40 max-w-md mx-auto transition-all duration-300`}><button onClick={onClose} className="absolute top-2 right-2 p-1 bg-black/20 rounded-full text-white/70 hover:text-white transition-colors"><X size={16}/></button><div className="flex justify-between items-center mb-2"><span className="font-bold text-white text-sm">Pedido #{order.id}</span><span className="text-xs text-red-200 flex items-center gap-1"><AlertTriangle size={12}/> Cancelado</span></div><p className="font-bold text-white text-lg">⛔ Pedido Rechazado</p><p className="text-sm text-red-100 mt-1">"{order.rejection_reason || 'Sin motivo'}"</p></motion.div> );
  }
  const steps = { 'pendiente': { label: 'Recibido 📨', color: 'bg-blue-500', width: '25%' }, 'preparacion': { label: 'Cocinando 🍳', color: 'bg-orange-500', width: '50%' }, 'terminado': { label: 'En Camino / Listo 🛵', color: 'bg-green-500', width: '90%' }, 'entregado': { label: 'Entregado ✅', color: 'bg-green-600', width: '100%' } };
  let labelText = steps[order.status]?.label; if(order.status === 'terminado' && order.rider_id) labelText = '¡En Camino! 🛵';
  const currentStep = steps[order.status] || { label: 'Procesando...', color: 'bg-gray-500', width: '10%' };
  
  return ( 
    <motion.div 
        onClick={() => {
            const trackingIdentifier = order.tracking_token || order.id;
            navigate(`/tracking/${trackingIdentifier}`);
        }}
        initial={{ y: 100 }} animate={{ y: 0 }} 
        className={`fixed ${positionClass} left-4 right-4 bg-[#1a1a1a] p-4 rounded-xl border border-white/10 shadow-2xl z-40 max-w-md mx-auto cursor-pointer hover:border-[#d0ff00] transition-all duration-300`}
    >
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-2 right-2 p-1 bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X size={16}/></button>
        <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-white text-sm">Pedido #{order.id}</span>
            <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12}/> Seguimiento en Vivo</span>
        </div>
        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
            <div className={`h-full ${currentStep.color} transition-all duration-1000 ease-out`} style={{ width: currentStep.width }}></div>
        </div>
        <div className="flex justify-between items-center">
            <p className="font-bold text-white text-lg animate-pulse">{labelText}</p>
            <span className="text-[10px] text-[#d0ff00] font-bold flex items-center gap-1">Ver detalles <ExternalLink size={10}/></span>
        </div>
    </motion.div> 
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function GastronomyHome() {
  
  // 🟢 1. OBTENEMOS selectedBranch DEL CONTEXTO
  const { store: config, loading: loadingConfig, selectedBranch } = useStore();
  const safeConfig = config || { store_name: "Cargando...", color_accent: "#ff6b00", logo_url: "", banner_url: "" };

  // Ahora useMenuData recibe la branch para (en un futuro) filtrar stock por sucursal
  const { menuItems, categories, loading } = useMenuData(config?.id, selectedBranch?.id);
  
  const { isOpen, loading: statusLoading } = useStoreStatus();
  const { clearCart } = useCartStore();
  
  // 🟢 EFECTO PARA DETECTAR RETORNO DE MERCADO PAGO
  useEffect(() => {
      const query = new URLSearchParams(window.location.search);
      const status = query.get('status');
      
      if (status === 'success' || status === 'pending') {
          window.history.replaceState({}, document.title, window.location.pathname);
          alert(status === 'success' 
            ? "¡Pago recibido! 🚀 Estamos preparando tu pedido." 
            : "Pago en proceso. Te avisaremos cuando se confirme.");
          clearCart();
      }
  }, [clearCart]);

  const isStoreOpen = useMemo(() => {
    if (!isOpen) return false;
    if (config?.auto_schedule && config.schedule_start && config.schedule_end) {
      const now = new Date(); const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = config.schedule_start.split(':').map(Number); const [endH, endM] = config.schedule_end.split(':').map(Number);
      const startMinutes = startH * 60 + startM; const endMinutes = endH * 60 + endM;
      if (startMinutes < endMinutes) { return currentMinutes >= startMinutes && currentMinutes < endMinutes; } 
      else { return currentMinutes >= startMinutes || currentMinutes < endMinutes; }
    }
    return true; 
  }, [isOpen, config]);

  const [activeCategory, setActiveCategory] = useState("Todos");
  const orderType = "delivery";
  const [searchTerm, setSearchTerm] = useState("");
  const [showCartModal, setShowCartModal] = useState(false);
  const [variantItem, setVariantItem] = useState(null);
  const [extrasItem, setExtrasItem] = useState(null);
  const { addItem, cart } = useCartStore();
  const [activeOrder, setActiveOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState(null); 
  
  // ESTADO PARA UBICACIÓN INICIAL
  const [userInitialLocation, setUserInitialLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // 🟢 1. EFECTO CORREGIDO: Chequea si ya interactuó antes de mostrar
  useEffect(() => {
      const hasInteracted = sessionStorage.getItem('locationInteracted');
      if (!userInitialLocation && !hasInteracted) {
          const timer = setTimeout(() => setShowLocationModal(true), 1500); 
          return () => clearTimeout(timer);
      }
  }, [userInitialLocation]);

  // 🟢 2. AL ACTIVAR: Guardamos que ya interactuó
  const handleEnableLocation = () => {
      setShowLocationModal(false);
      sessionStorage.setItem('locationInteracted', 'true'); 

      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (pos) => {
                  const coords = { 
                      lat: pos.coords.latitude, 
                      lng: pos.coords.longitude 
                  };
                  setUserInitialLocation(coords);
              },
              () => logger.debug("GPS Denied"),
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
      }
  };

  // 🟢 3. AL OMITIR: También guardamos que ya interactuó
  const handleSkipLocation = () => {
      setShowLocationModal(false);
      sessionStorage.setItem('locationInteracted', 'true');
  };

  useEffect(() => { 
      const checkActiveOrder = async () => { 
          const orderId = localStorage.getItem('activeOrderId'); 
          if (orderId) { 
              const { data } = await supabase.from('orders').select('*').eq('id', orderId).single(); 
              if (data && data.status !== 'archivado') { 
                  setActiveOrder(data); 
              } else { 
                  localStorage.removeItem('activeOrderId'); 
                  setActiveOrder(null); 
              } 
          } 
      }; 
      checkActiveOrder(); 
      const interval = setInterval(checkActiveOrder, 5000); 
      return () => clearInterval(interval); 
  }, []);

  const handleCloseTracker = () => { setActiveOrder(null); localStorage.removeItem('activeOrderId'); };
  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };
  
  const handleAddItem = (item) => { 
      if (item.has_variants) { 
          setVariantItem(item); 
      } else if (item.extras && Array.isArray(item.extras) && item.extras.length > 0) { 
          setExtrasItem({ ...item, finalPrice: item.price }); 
      } else { 
          // 🟢 2. PASAMOS selectedBranch?.id AL AGREGAR
          addItem({ ...item, finalPrice: item.price, uniqueId: `${item.id}:base:no-extras` }, selectedBranch?.id); 
          showToast(`¡${item.name} agregado! 🛒`); 
      } 
  };

  const confirmVariant = (item, variant) => { 
      setVariantItem(null); 
      const itemWithVariant = { ...item, finalPrice: variant.price, variantName: variant.name }; 
      if (item.extras && Array.isArray(item.extras) && item.extras.length > 0) { 
          setExtrasItem(itemWithVariant); 
      } else { 
          // 🟢 3. PASAMOS selectedBranch?.id
          addItem({ ...itemWithVariant, uniqueId: `${item.id}:${variant.name}:no-extras` }, selectedBranch?.id); 
          showToast(`¡${item.name} agregado! 🛒`); 
      } 
  };

  const confirmExtras = (item, selectedExtras) => { 
      setExtrasItem(null); 
      const extrasPrice = selectedExtras.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0); 
      const extrasNames = selectedExtras.map(e => e.name).join(', '); 
      const base = parseFloat(item.finalPrice || item.price) || 0;

      // 🟢 4. PASAMOS selectedBranch?.id
      addItem({ 
          ...item, 
          uniqueId: `${item.id}:${item.variantName || 'base'}:${extrasNames || 'no-extras'}`, 
          finalPrice: base + extrasPrice, 
          extrasNames, 
          extrasPrice 
      }, selectedBranch?.id); 
      showToast(`¡${item.name} agregado! 🛒`); 
  };

  const filteredItems = useMemo(() => { 
      let items = activeCategory === "Todos" ? menuItems : menuItems.filter(i => i.category === activeCategory); 
      if (searchTerm) items = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())); 
      return items; 
  }, [activeCategory, menuItems, searchTerm]);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (parseFloat(item.finalPrice) * item.quantity), 0);

  if (loading || statusLoading || loadingConfig) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" size={48}/></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex justify-center selection:bg-[#d0ff00] selection:text-black">
        <div className="w-full max-w-[500px] bg-[#0f0f0f] min-h-screen relative shadow-2xl border-x border-white/5 pb-32">
            
            <AnimatePresence>
                {toastMessage && ( <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none"><div className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2"><Check size={18}/> {toastMessage}</div></motion.div> )}
            </AnimatePresence>

            <div className="w-full">
                <header className="h-56 overflow-hidden relative mb-4">
                    <img src={safeConfig.banner_url || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=1200"} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f0f0f]"></div>
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md ${isStoreOpen ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                        {isStoreOpen ? '🟢 ABIERTO' : `🔴 CERRADO`}
                    </div>
                    <div className="absolute -bottom-10 left-0 right-0 flex flex-col items-center">
                        <div className="w-24 h-24 bg-[#1a1a1a] rounded-full p-1 overflow-hidden shrink-0 shadow-2xl">
                            <img src={safeConfig.logo_url || "https://placehold.co/100x100?text=LOGO"} className="w-full h-full object-contain rounded-full"/>
                        </div>
                    </div>
                </header>
                
                <div className="text-center mt-12 mb-6 px-4">
                    <h1 className="text-2xl font-bold text-white mb-1">{safeConfig.store_name}</h1>
                    <p className="text-gray-500 text-sm">¡El mejor sabor de la ciudad!</p>
                </div>

                <div className="px-4 mb-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search size={18} className="text-gray-500" /></div>
                        <input type="text" placeholder="¿Qué se te antoja hoy?" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-11 pr-4 py-3.5 border border-white/10 rounded-2xl bg-[#1a1a1a] text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all" />
                    </div>
                </div>

                <div className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur-md py-4 px-4 border-b border-white/5 mb-6 flex gap-2 overflow-x-auto no-scrollbar">
                    <CategoryPill label="Todos" active={activeCategory==="Todos"} onClick={()=>setActiveCategory("Todos")} color={safeConfig.color_accent} />
                    {categories.map(cat => <CategoryPill key={cat} label={cat} active={activeCategory===cat} onClick={()=>setActiveCategory(cat)} color={safeConfig.color_accent}/>)}
                </div>
                
                <div className="flex flex-col gap-4 px-4">
                    {filteredItems.length > 0 ? ( filteredItems.map(item => <ProductCard key={item.id} item={item} isOpen={isStoreOpen} onAdd={handleAddItem} color={safeConfig.color_accent} />) ) : ( <div className="text-center py-20 text-gray-500 flex flex-col items-center"><ShoppingBag size={48} className="mb-4 opacity-50"/><p>No encontramos productos.</p></div> )}
                </div>

                <footer className="mt-12 mb-8 text-center opacity-40">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Powered by</p>
                    <span className="text-xs font-bold text-white">RIVA ESTUDIO</span>
                </footer>
            </div>

            <CartSummaryButton
                count={cartItemCount}
                total={cartTotal}
                isStoreOpen={isStoreOpen}
                onOpen={() => isStoreOpen && setShowCartModal(true)}
                color={safeConfig.color_accent}
            />
            <StatusTracker order={activeOrder} onClose={handleCloseTracker} />
            
            <AnimatePresence>
                {showLocationModal && (
                    <LocationRequestModal 
                        onEnable={handleEnableLocation} 
                        onSkip={handleSkipLocation} 
                        color={safeConfig.color_accent}
                    />
                )}

                {showCartModal && (
                    <CartModal 
                        isOpen={showCartModal} 
                        onClose={()=>setShowCartModal(false)} 
                        defaultOrderType={orderType} 
                        onSuccess={(o)=>setActiveOrder(o)} 
                        config={safeConfig} 
                        preloadedLocation={userInitialLocation} 
                    />
                )}
                
                {variantItem && (
                    <VariantsModal item={variantItem} onClose={()=>setVariantItem(null)} onConfirm={confirmVariant} color={safeConfig.color_accent} />
                )}
                
                {extrasItem && (
                    <ExtrasModal item={extrasItem} onClose={()=>setExtrasItem(null)} onConfirm={confirmExtras} color={safeConfig.color_accent} />
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}
