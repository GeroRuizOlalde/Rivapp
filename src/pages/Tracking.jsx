import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import {
  Check, ShoppingBag, ChevronLeft, Star, X, MessageSquare, Send, ThumbsUp,
  Package, Bike, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { appConfig, getWhatsAppUrl } from '../config/appConfig';
import Button from '../components/shared/ui/Button';
import Eyebrow from '../components/shared/ui/Eyebrow';
import Rule from '../components/shared/ui/Rule';

const StarRating = ({ rating, setRating, color }) => (
  <div className="mb-6 flex justify-center gap-2">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(10);
          setRating(star);
        }}
        className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
      >
        <Star
          size={36}
          fill={star <= rating ? color : 'transparent'}
          color={star <= rating ? color : 'var(--color-text-subtle)'}
          strokeWidth={1.5}
        />
      </button>
    ))}
  </div>
);

export default function Tracking() {
  const { token } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prevStatus = useRef(null);

  const fetchOrder = useCallback(async () => {
    if (!token) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*, riders(name, phone), stores(name, slug, logo_url, phone, color_accent)')
      .eq('tracking_token', token)
      .single();

    if (!error && data) {
      setOrder(data);
      prevStatus.current = data.status;
    }
    setLoading(false);
  }, [token]);

  const confirmOrderPayment = useCallback(
    async (paymentId) => {
      if (!order?.id) return;

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'confirmado',
          payment_id: paymentId,
          payment_status: 'paid',
        })
        .eq('id', order.id);

      if (!error) {
        setShowSuccessModal(true);
        setOrder((prev) => (prev ? { ...prev, status: 'confirmado' } : prev));
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    },
    [order]
  );

  useEffect(() => {
    if (!token) return;

    const initialFetchTimeout = window.setTimeout(() => {
      void fetchOrder();
    }, 0);

    const channel = supabase
      .channel(`tracking-order-${token}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `tracking_token=eq.${token}`,
        },
        (payload) => {
          void fetchOrder();
          if (payload.new.status !== prevStatus.current && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      )
      .subscribe();

    return () => {
      window.clearTimeout(initialFetchTimeout);
      supabase.removeChannel(channel);
    };
  }, [fetchOrder, token]);

  useEffect(() => {
    if (!order || order.status !== 'pendiente') return;

    const query = new URLSearchParams(window.location.search);
    const status = query.get('status');
    const paymentId = query.get('payment_id');

    let paymentConfirmationTimeout;
    if ((status === 'approved' || status === 'success') && paymentId) {
      paymentConfirmationTimeout = window.setTimeout(() => {
        void confirmOrderPayment(paymentId);
      }, 0);
    }

    return () => {
      if (paymentConfirmationTimeout) {
        window.clearTimeout(paymentConfirmationTimeout);
      }
    };
  }, [confirmOrderPayment, order]);

  const handleSubmitRating = async () => {
    if (rating === 0) return alert('Elegí al menos una estrella');
    setIsSubmitting(true);
    const { error } = await supabase.from('orders').update({ rating, review }).eq('tracking_token', token);
    if (!error) {
      setOrder((prev) => (prev ? { ...prev, rating, review } : prev));
      setShowRatingModal(false);
    }
    setIsSubmitting(false);
  };

  const storeData = order?.stores || {};
  const brandColor = storeData.color_accent || '#D0FF00';
  const storeSlug = storeData.slug ? `/${storeData.slug}` : '/';

  const contactSupport = () => {
    if (!order) return;
    const msg = `Hola, consulto por mi pedido #${order.id}`;
    const whatsappUrl = getWhatsAppUrl(storeData.phone || appConfig.supportWhatsApp, msg);
    if (whatsappUrl) window.open(whatsappUrl, '_blank');
  };

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        key: index,
        x: ((index * 37) % 300) - 150,
        duration: 2 + (index % 5) * 0.2,
        delay: (index % 6) * 0.15,
        color: [brandColor, '#009EE3', '#FF3B1F', '#F5F1E8'][index % 4],
      })),
    [brandColor]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="h-10 w-10 animate-spin text-acid" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-text">
        <p className="display text-7xl text-text-subtle">?</p>
        <Eyebrow className="mt-6">Error</Eyebrow>
        <h2 className="display mt-3 text-4xl md:text-5xl">
          Pedido <em className="display-italic text-acid">no encontrado</em>
        </h2>
        <p className="mt-4 max-w-sm text-sm text-text-muted">El enlace puede ser antiguo o incorrecto.</p>
        <Button to="/" variant="acid" size="lg" className="mt-8">
          Ir al inicio
        </Button>
      </div>
    );
  }

  const steps = [
    { key: 'pendiente', label: 'Enviado', icon: <Send className="h-4 w-4" /> },
    { key: 'confirmado', label: 'Cocina', icon: <ThumbsUp className="h-4 w-4" /> },
    { key: 'listo', label: 'Listo', icon: <Package className="h-4 w-4" /> },
    { key: 'entregado', label: 'Llegó', icon: <Check className="h-4 w-4" /> },
  ];

  let currentStatus = order.status;
  if (currentStatus === 'preparacion') currentStatus = 'confirmado';
  if (currentStatus === 'terminado') currentStatus = 'listo';
  if (currentStatus === 'pendiente' && showSuccessModal) currentStatus = 'confirmado';

  const currentStepIndex = steps.findIndex((step) => step.key === currentStatus);
  const formattedDate = new Date(order.created_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex min-h-screen justify-center bg-ink text-text">
      <div className="relative flex min-h-screen w-full max-w-[500px] flex-col border-x border-rule bg-ink-2 shadow-[var(--shadow-editorial)]">
        {/* Topbar */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-rule bg-ink-2/90 px-4 py-4 backdrop-blur-md">
          <Link
            to={storeSlug}
            className="rounded-full border border-rule p-2 text-text-muted transition-colors hover:border-text hover:text-text"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="flex flex-col items-center">
            <p className="mono text-[9px] uppercase tracking-[0.24em] text-text-subtle">Pedido</p>
            <p className="mono mt-0.5 text-sm font-semibold text-text">#{order.id}</p>
          </div>
          <button
            onClick={contactSupport}
            className="rounded-full border border-rule p-2 text-text-muted transition-colors hover:border-acid hover:text-acid"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-5">
          {/* Logo + nombre */}
          <div className="mb-8 mt-4 text-center">
            <div className="relative mx-auto mb-5 h-20 w-20 overflow-hidden rounded-[var(--radius-lg)] border border-rule-strong bg-ink-3 shadow-[var(--shadow-lift)]">
              <img
                src={storeData.logo_url || 'https://placehold.co/100'}
                alt={storeData.name}
                className="h-full w-full object-cover"
              />
              {(order.status === 'confirmado' ||
                order.status === 'listo' ||
                order.status === 'entregado' ||
                showSuccessModal) && (
                <div className="absolute -bottom-2 -right-2 rounded-full border-2 border-ink-2 bg-acid p-1.5 text-ink">
                  <Check className="h-3 w-3" strokeWidth={4} />
                </div>
              )}
            </div>
            <Eyebrow className="justify-center">En curso</Eyebrow>
            <h1 className="display mt-3 text-3xl text-text md:text-4xl">
              {storeData.name || 'Tu pedido'}
            </h1>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
              {formattedDate}
            </p>
          </div>

          {/* Progreso */}
          <section className="mb-6 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-3 p-6">
            {order.status === 'rechazado' ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-signal/15 text-signal">
                  <X className="h-6 w-6" />
                </div>
                <Eyebrow tone="muted" className="text-signal/80">
                  Cancelado
                </Eyebrow>
                <p className="display text-2xl text-text">Pedido rechazado</p>
                <p className="px-4 text-sm text-text-muted">
                  "{order.rejection_reason || 'Sin motivo especificado'}"
                </p>
              </div>
            ) : (
              <div className="relative pb-2 pt-2">
                <div className="absolute inset-x-4 top-[28px] h-0.5 rounded-full bg-rule" />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 0rem)` }}
                  transition={{ duration: 1 }}
                  className="absolute left-4 top-[28px] h-0.5 rounded-full"
                  style={{ backgroundColor: brandColor }}
                />
                <div className="relative z-10 flex justify-between">
                  {steps.map((step, index) => {
                    const isActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-3">
                        <motion.div
                          initial={false}
                          animate={{ scale: isCurrent ? 1.12 : 1 }}
                          className="flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-[var(--shadow-lift)]"
                          style={{
                            backgroundColor: isActive ? brandColor : 'var(--color-ink-3)',
                            borderColor: isActive ? brandColor : 'var(--color-rule-strong)',
                            color: isActive ? 'black' : 'var(--color-text-subtle)',
                          }}
                        >
                          {step.icon}
                        </motion.div>
                        <span
                          className={`mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                            isActive ? 'text-text' : 'text-text-subtle'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Rider */}
          {order.rider_id && order.riders && (
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-6 flex items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-ml/30 bg-ml/10 p-5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ml text-white shadow-[var(--shadow-lift)]">
                  <Bike className="h-5 w-5" />
                </div>
                <div>
                  <p className="mono text-[10px] uppercase tracking-[0.22em] text-ml-soft">Repartidor</p>
                  <p className="display mt-1 text-xl text-text">{order.riders.name}</p>
                </div>
              </div>
              {order.riders.phone && (
                <a
                  href={`https://api.whatsapp.com/send?phone=${order.riders.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-[var(--radius-md)] bg-paper p-3 text-ink-text transition-colors hover:brightness-95"
                >
                  <MessageSquare className="h-4 w-4" />
                </a>
              )}
            </motion.section>
          )}

          {/* Detalle */}
          <section className="mb-6 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-3 p-6">
            <div className="flex items-center justify-between">
              <Eyebrow>
                <ShoppingBag className="h-3 w-3" /> Detalle
              </Eyebrow>
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                {order.items?.length || 0} items
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div
                      className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-xs font-semibold text-ink"
                      style={{ backgroundColor: brandColor }}
                    >
                      {item.quantity}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text">{item.name}</p>
                      {item.variantName && (
                        <p className="mono mt-0.5 text-[10px] uppercase tracking-[0.18em] text-text-muted">
                          {item.variantName}
                        </p>
                      )}
                      {item.extrasNames && (
                        <p className="mono mt-0.5 text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                          + {item.extrasNames}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="num text-sm font-semibold text-text">
                    ${(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <Rule className="mt-6" />

            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs text-text-muted">
                <span>Subtotal</span>
                <span className="num">
                  ${(order.total - (order.delivery_cost || 0)).toLocaleString()}
                </span>
              </div>
              {order.delivery_cost > 0 && (
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Envío</span>
                  <span className="num">${order.delivery_cost.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between pt-3">
                <span className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">Total</span>
                <span className="display num text-3xl" style={{ color: brandColor }}>
                  ${order.total.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <span className="mono rounded-sm border border-rule px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-text-muted">
                  {order.payment_method}
                </span>
                <span className="mono rounded-sm border border-rule px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-text-muted">
                  {order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro'}
                </span>
              </div>
            </div>
          </section>

          {/* Rating */}
          {order.status === 'entregado' && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8 mt-2">
              {!order.rating ? (
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] py-4 font-semibold text-ink shadow-[var(--shadow-lift)] transition-transform active:scale-95"
                  style={{ backgroundColor: brandColor }}
                >
                  <Star className="h-4 w-4" fill="black" /> Calificar pedido
                </button>
              ) : (
                <div className="rounded-[var(--radius-md)] border border-acid/30 bg-acid/10 p-4 text-center">
                  <p className="mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-acid">
                    <Check className="h-3.5 w-3.5" /> Gracias por tu opinión
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Modal éxito pago */}
        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-6 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="relative w-full max-w-sm overflow-hidden rounded-[var(--radius-2xl)] border border-rule-strong bg-ink-2 p-8 text-center shadow-[var(--shadow-editorial)]"
              >
                <div className="pointer-events-none absolute inset-0">
                  {confettiPieces.map((piece) => (
                    <motion.div
                      key={piece.key}
                      initial={{ y: 0, x: piece.x, opacity: 1 }}
                      animate={{ y: 500, rotate: 360, opacity: 0 }}
                      transition={{ duration: piece.duration, repeat: Infinity, delay: piece.delay }}
                      className="absolute left-1/2 top-0 h-2 w-2 rounded-full"
                      style={{ backgroundColor: piece.color }}
                    />
                  ))}
                </div>

                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-acid text-ink shadow-[0_0_40px_rgba(208,255,0,0.35)]"
                  >
                    <Check className="h-12 w-12" strokeWidth={4} />
                  </motion.div>

                  <Eyebrow className="justify-center">Confirmado</Eyebrow>
                  <h2 className="display mt-3 text-4xl text-text">
                    Pago <em className="display-italic text-acid">recibido</em>
                  </h2>
                  <p className="mt-3 text-sm text-text-muted">
                    Tu pedido ya está confirmado y en camino a la cocina.
                  </p>

                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] py-4 font-semibold text-ink shadow-[var(--shadow-lift)] transition-transform hover:scale-[1.01]"
                    style={{ backgroundColor: brandColor }}
                  >
                    Ver estado
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal rating */}
        <AnimatePresence>
          {showRatingModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-ink/90 backdrop-blur-sm"
                onClick={() => setShowRatingModal(false)}
              />
              <motion.div
                initial={{ scale: 0.92, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: 50, opacity: 0 }}
                className="relative z-10 w-full max-w-sm rounded-[var(--radius-2xl)] border border-rule-strong bg-ink-2 p-6 shadow-[var(--shadow-editorial)]"
              >
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="absolute right-4 top-4 rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="mb-6 mt-2 text-center">
                  <Eyebrow className="justify-center">Tu opinión</Eyebrow>
                  <h3 className="display mt-3 text-3xl text-text">
                    ¿Qué tal <em className="display-italic text-acid">estuvo</em>?
                  </h3>
                  <p className="mt-2 text-xs text-text-muted">Ayudanos a mejorar</p>
                </div>

                <StarRating rating={rating} setRating={setRating} color={brandColor} />

                <textarea
                  placeholder="Escribí un comentario…"
                  className="h-28 w-full resize-none rounded-[var(--radius-md)] border border-rule bg-ink-3 p-4 text-sm text-text placeholder:text-text-subtle focus:border-text focus:outline-none"
                  value={review}
                  onChange={(event) => setReview(event.target.value)}
                />

                <button
                  onClick={handleSubmitRating}
                  disabled={isSubmitting}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] py-4 font-semibold text-ink transition-transform active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: brandColor }}
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enviar reseña'}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
