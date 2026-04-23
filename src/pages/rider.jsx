import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useStore } from '../context/useStore';
import { logger } from '../utils/logger';
import {
  Bike, MapPin, Phone, CheckCircle2, Navigation, LogOut, MessageCircle, Volume2, VolumeX,
  DollarSign, Lock,
} from 'lucide-react';
import Button from '../components/shared/ui/Button';
import Eyebrow from '../components/shared/ui/Eyebrow';
import Rule from '../components/shared/ui/Rule';

const MOTO_SOUND = '/sounds/moto.mp3';

export default function Rider() {
  const { store } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [riderInfo, setRiderInfo] = useState(null);
  const [pin, setPin] = useState('');
  const [deliveries, setDeliveries] = useState([]);

  const audioRef = useRef(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);
  const prevDeliveriesCount = useRef(0);

  useEffect(() => {
    audioRef.current = new Audio(MOTO_SOUND);
  }, []);

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
      alert('PIN incorrecto o usuario inactivo.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRiderInfo(null);
    setDeliveries([]);
    setPin('');
  };

  const fetchDeliveries = useCallback(
    async (currentRiderId) => {
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
            audioRef.current.play().catch((e) => logger.debug('Audio bloqueado:', e));
          }
          if ('vibrate' in navigator) navigator.vibrate([500, 200, 500]);
        }
        prevDeliveriesCount.current = data.length;
      }
    },
    [store]
  );

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
        alert('Sonido activado');
      });
    }
  };

  const openMap = (order) => {
    if (order.lat && order.lng) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${order.lat},${order.lng}`,
        '_blank'
      );
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
    if (!window.confirm('¿Confirmás la entrega?')) return;
    const { error } = await supabase.from('orders').update({ status: 'entregado' }).eq('id', id).eq('store_id', store.id);
    if (!error && riderInfo) fetchDeliveries(riderInfo.id);
  };

  // ---------------- LOGIN ----------------
  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink p-6 text-text">
        <div className="pointer-events-none absolute inset-0 z-0 grain" aria-hidden />
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div className="absolute left-[-10%] top-[-20%] h-[60vw] w-[60vw] rounded-full bg-ml/[0.07] blur-[140px]" />
        </div>

        <div className="relative z-10 w-full max-w-sm anim-rise">
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-ml/50 bg-ml/10 text-ml-soft">
              <Bike className="h-9 w-9" />
            </div>
            <Eyebrow>Acceso riders</Eyebrow>
            <h2 className="display mt-3 text-4xl md:text-5xl">
              <em className="display-italic text-acid">{store?.name || 'Rivapp'}</em>
            </h2>
            <p className="mt-2 text-sm text-text-muted">Ingresá tu PIN para iniciar turno.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
            <div>
              <p className="eyebrow mb-4 text-center">PIN de acceso</p>
              <input
                type="tel"
                maxLength={4}
                placeholder="••••"
                className="mono num w-full rounded-[var(--radius-md)] border-2 border-rule-strong bg-ink-3 p-5 text-center text-4xl tracking-[0.7em] text-text placeholder:text-text-subtle focus:border-ml focus:outline-none"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="mono flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-ml py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-white shadow-[var(--shadow-lift)] transition-transform active:scale-[0.98]"
            >
              <Lock className="h-4 w-4" /> Iniciar turno
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------- MAIN ----------------
  return (
    <div className="relative min-h-screen bg-ink pb-24 text-text">
      <div className="pointer-events-none fixed inset-0 z-0 grain" aria-hidden />

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-rule bg-ink-2/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ml text-white">
            <Bike className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="display text-base leading-none text-text">{riderInfo.name}</p>
            <p className="mono mt-1 text-[9px] uppercase tracking-[0.22em] text-text-subtle">{store?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleSound}
            className={`rounded-[var(--radius-sm)] p-2.5 transition-colors ${
              isSoundEnabled ? 'bg-acid/10 text-acid' : 'bg-white/5 text-text-muted'
            }`}
          >
            {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-[var(--radius-sm)] border border-signal/30 bg-signal/10 p-2.5 text-signal hover:bg-signal hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative z-10 space-y-4 p-4">
        {deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-rule-strong bg-ink-2 text-text-muted">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <Eyebrow className="justify-center">En pausa</Eyebrow>
              <p className="display mt-3 text-3xl text-text">
                Todo <em className="display-italic text-acid">entregado</em>
              </p>
              <p className="mt-2 text-sm text-text-muted">Esperando nuevos viajes…</p>
            </div>
          </div>
        ) : (
          deliveries.map((order) => {
            const isCash = order.payment_method === 'efectivo';
            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 shadow-[var(--shadow-lift)]"
              >
                {/* Banda superior · estado pago */}
                <div
                  className={`flex items-center justify-between px-5 py-3 ${
                    isCash ? 'bg-signal/15 text-signal-soft' : 'bg-acid/15 text-acid'
                  }`}
                >
                  <div className="mono inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]">
                    {isCash ? <DollarSign className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {isCash ? 'Cobrar al cliente' : 'Pagado'}
                  </div>
                  <span className="num text-lg font-semibold">${order.total.toLocaleString()}</span>
                </div>

                <div className="p-5">
                  <div className="mb-5">
                    <Eyebrow>Cliente</Eyebrow>
                    <h2 className="display mt-2 text-3xl text-text">{order.customer_name}</h2>
                  </div>

                  <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-4">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ml-soft" />
                    <p className="text-sm leading-snug text-text">{order.delivery_zone}</p>
                  </div>

                  <Rule label="Pedido" />

                  <div className="mt-4 space-y-1 border-l-2 border-rule pl-3">
                    {order.items?.map((i, idx) => (
                      <p key={idx} className="text-sm text-text-muted">
                        <span className="num font-semibold text-text">{i.quantity}x</span> {i.name}
                      </p>
                    ))}
                    {order.note && (
                      <p className="mt-2 rounded-[var(--radius-sm)] border border-acid/30 bg-acid/10 p-2 text-xs italic text-acid">
                        Nota: "{order.note}"
                      </p>
                    )}
                  </div>

                  {/* Acciones rápidas */}
                  <div className="mt-6 grid grid-cols-4 gap-2">
                    <button
                      onClick={() => openMap(order)}
                      className="mono col-span-2 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-paper py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-text shadow-[var(--shadow-lift)] transition-transform active:scale-[0.98]"
                    >
                      <Navigation className="h-4 w-4" /> Ir al mapa
                    </button>
                    <button
                      onClick={() => notifyCustomer(order)}
                      className="col-span-1 flex items-center justify-center rounded-[var(--radius-md)] bg-acid py-4 text-ink shadow-[var(--shadow-lift)] transition-transform active:scale-[0.98]"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </button>
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="col-span-1 flex items-center justify-center rounded-[var(--radius-md)] border border-rule-strong bg-ink-3 py-4 text-text transition-transform active:scale-[0.98]"
                      aria-label="Llamar"
                    >
                      <Phone className="h-5 w-5" />
                    </a>
                  </div>

                  <div className="mt-4 border-t border-rule pt-4">
                    <button
                      onClick={() => markAsDelivered(order.id)}
                      className="mono flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-ml py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-[var(--shadow-lift)] transition-transform active:scale-[0.98]"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Confirmar entrega
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
