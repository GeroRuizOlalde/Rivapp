import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useStore } from '../context/useStore';
import { 
  Bike, MapPin, Phone, CheckCircle, Navigation, Map, LogOut, MessageCircle, Volume2, VolumeX, DollarSign, Wallet
} from 'lucide-react';

const MOTO_SOUND = "/sounds/moto.mp3"; 

export default function Rider() {
  const { store } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [riderInfo, setRiderInfo] = useState(null); 
  const [pin, setPin] = useState("");
  const [deliveries, setDeliveries] = useState([]);
  
  // --- SONIDO ---
  const audioRef = useRef(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);
  const prevDeliveriesCount = useRef(0);

  useEffect(() => {
    audioRef.current = new Audio(MOTO_SOUND);
  }, []);

  // --- Login con PIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!store) return;

    const { data } = await supabase
        .from('riders')
        .select('*')
        .eq('access_pin', pin)
        .eq('store_id', store.id)
        .eq('active', true)
        .single();
    
    if (data) {
      setIsAuthenticated(true);
      setRiderInfo(data);
      fetchDeliveries(data.id); 
    } else {
      alert("PIN incorrecto o usuario inactivo.");
    }
  };

  const handleLogout = () => { setIsAuthenticated(false); setRiderInfo(null); setDeliveries([]); setPin(""); };

  // 🔔 BUSCAR PEDIDOS
  const fetchDeliveries = useCallback(async (currentRiderId) => {
    if (!store || !currentRiderId) return;
    
    const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .or('status.eq.listo,status.eq.terminado') 
        .eq('rider_id', currentRiderId) 
        .order('created_at', { ascending: true });

    if (data) {
      setDeliveries(data);
      if (prevDeliveriesCount.current !== null && data.length > prevDeliveriesCount.current) {
        if (soundEnabledRef.current && audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio bloqueado:", e));
        }
        if ("vibrate" in navigator) navigator.vibrate([500, 200, 500]);
      }
      prevDeliveriesCount.current = data.length;
    }
  }, [store]);

  useEffect(() => {
    if (isAuthenticated && riderInfo) {
        fetchDeliveries(riderInfo.id); 
        const interval = setInterval(() => fetchDeliveries(riderInfo.id), 5000);
        return () => clearInterval(interval);
    }
  }, [fetchDeliveries, isAuthenticated, riderInfo]);

  const toggleSound = () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    soundEnabledRef.current = newState;
    if (newState && audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        alert("🔊 Sonido Activado");
      });
    }
  };

  const openMap = (order) => {
    // 🟢 MEJORA: Link universal que abre la App de Mapas (Google Maps / Waze / Apple Maps)
    if (order.lat && order.lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${order.lat},${order.lng}`, '_blank');
    } else {
      const query = encodeURIComponent(`San Juan, Argentina ${order.delivery_zone || ''}`); 
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const notifyCustomer = (order) => {
    const message = `Hola ${order.customer_name}, soy ${riderInfo.name} de ${store.name} 🛵. Ya estoy en camino con tu pedido. ¡Nos vemos en unos minutos!`;
    window.open(`https://wa.me/${order.customer_phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const markAsDelivered = async (id) => {
    if (!window.confirm("¿Confirmas la entrega?")) return;
    const { error } = await supabase.from('orders').update({ status: 'entregado' }).eq('id', id);
    if (!error && riderInfo) fetchDeliveries(riderInfo.id); 
  };

  // ---------------- LOGIN SCREEN ----------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
            <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse border-4 border-blue-600/50">
                <Bike className="text-blue-500" size={48} />
            </div>
            <h2 className="text-white font-bold text-3xl mb-2 text-center">Acceso Riders</h2>
            <p className="text-gray-400 text-center mb-8">{store?.name}</p>
            
            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block text-center">Ingresa tu PIN</label>
                    <input 
                        type="tel" // Teclado numérico grande en móviles
                        maxLength={4}
                        placeholder="••••" 
                        className="w-full bg-[#1a1a1a] border-2 border-white/20 rounded-2xl p-6 text-white text-center text-4xl tracking-[1rem] outline-none focus:border-blue-500 transition-all font-mono shadow-inner" 
                        value={pin} 
                        onChange={e => setPin(e.target.value)} 
                    />
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-900/30 text-lg transition-transform active:scale-95">
                    INICIAR TURNO
                </button>
            </form>
        </div>
      </div>
    );
  }

  // ---------------- MAIN SCREEN ----------------
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans pb-24">
      
      {/* HEADER COMPACTO */}
      <header className="sticky top-0 bg-[#0f0f0f]/95 backdrop-blur-md z-20 border-b border-white/10 px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-full"><Bike size={20} className="text-white"/></div>
            <div>
                <h1 className="font-bold text-sm leading-none text-gray-200">{riderInfo.name}</h1>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{store?.name}</p>
            </div>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleSound} className={`p-3 rounded-xl transition-all ${isSoundEnabled ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-500'}`}>
            {isSoundEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}
          </button>
          <button onClick={handleLogout} className="p-3 bg-red-500/10 rounded-xl text-red-500"><LogOut size={20}/></button>
        </div>
      </header>

      {/* LISTA DE PEDIDOS */}
      <div className="p-4 space-y-4">
        {deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <div className="bg-white/5 p-6 rounded-full mb-4 animate-pulse"><MapPin size={40}/></div>
            <p className="text-lg font-bold text-gray-300">Todo entregado</p>
            <p className="text-sm">Esperando nuevos viajes...</p>
          </div>
        ) : (
          deliveries.map(order => {
            const isCash = order.payment_method === 'efectivo';
            return (
                <div key={order.id} className="bg-[#1a1a1a] rounded-3xl overflow-hidden shadow-lg border border-white/5 animate-in slide-in-from-bottom-4 duration-500">
                
                {/* CABECERA ROJA/VERDE SEGÚN PAGO */}
                <div className={`px-5 py-3 flex justify-between items-center ${isCash ? 'bg-red-900/40 text-red-200' : 'bg-green-900/40 text-green-200'}`}>
                    <div className="flex items-center gap-2">
                        {isCash ? <DollarSign size={18}/> : <CheckCircle size={18}/>}
                        <span className="font-bold text-sm uppercase tracking-wider">{isCash ? 'COBRAR AL CLIENTE' : 'YA PAGADO'}</span>
                    </div>
                    <span className="font-mono font-bold text-lg">${order.total.toLocaleString()}</span>
                </div>

                <div className="p-5 pt-4">
                    {/* CLIENTE Y DIRECCIÓN */}
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-white mb-1">{order.customer_name}</h2>
                        <div className="flex items-start gap-2 text-gray-300 bg-black/40 p-3 rounded-xl border border-white/5">
                            <MapPin size={18} className="text-blue-500 mt-0.5 shrink-0"/>
                            <p className="text-sm font-medium leading-snug">{order.delivery_zone}</p>
                        </div>
                    </div>

                    {/* ITEMS */}
                    <div className="mb-6 pl-2 border-l-2 border-white/10 space-y-1">
                        {order.items?.map((i, idx) => (
                            <p key={idx} className="text-sm text-gray-400">
                                <span className="text-white font-bold">{i.quantity}x</span> {i.name}
                            </p>
                        ))}
                        {order.note && <p className="text-xs text-yellow-500 italic mt-2 bg-yellow-500/10 p-2 rounded">📝 "{order.note}"</p>}
                    </div>

                    {/* BOTONES DE ACCIÓN (GRID) */}
                    <div className="grid grid-cols-4 gap-3">
                        {/* Botón Mapa (El más importante, ocupa mitad) */}
                        <button onClick={() => openMap(order)} className="col-span-2 bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                            <Navigation size={20}/> IR AL MAPA
                        </button>
                        
                        {/* Botones Secundarios */}
                        <button onClick={() => notifyCustomer(order)} className="col-span-1 bg-[#25D366] text-black py-3 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                            <MessageCircle size={24}/>
                        </button>
                        <a href={`tel:${order.customer_phone}`} className="col-span-1 bg-gray-700 text-white py-3 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                            <Phone size={24}/>
                        </a>
                    </div>

                    {/* SLIDER DE ENTREGA (Simulado con botón grande) */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <button onClick={() => markAsDelivered(order.id)} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                            <CheckCircle size={20}/> CONFIRMAR ENTREGA
                        </button>
                    </div>
                </div>
                </div>
            );
          })
        )}
      </div>
    </div>
  );
}
