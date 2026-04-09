import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { 
  Check, ShoppingBag, ChevronLeft, Star, X, MessageSquare, 
  Send, ThumbsUp, Package, Bike, AlertTriangle, Loader2, CheckCircle, PartyPopper
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { appConfig, getWhatsAppUrl } from '../config/appConfig';

// Componente de Estrellas
const StarRating = ({ rating, setRating, color }) => ( 
  <div className="flex gap-2 justify-center mb-6">
    {[1, 2, 3, 4, 5].map((star) => ( 
      <button 
        key={star} 
        onClick={() => {
            if(navigator.vibrate) navigator.vibrate(10);
            setRating(star);
        }} 
        className="transition-transform hover:scale-110 active:scale-95 focus:outline-none p-1"
      >
        <Star size={36} fill={star <= rating ? color : "transparent"} color={star <= rating ? color : "#4b5563"} strokeWidth={1.5} />
      </button> 
    ))}
  </div> 
);

export default function Tracking() {
  const { token } = useParams();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // 🟢 Nuevo estado para éxito
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Referencia para detectar si el estado cambió y vibrar
  const prevStatus = useRef(null);

  const storeData = order?.stores || {};
  const brandColor = storeData.color_accent || '#d0ff00';
  const storeSlug = storeData.slug ? `/${storeData.slug}` : '/'; 

  useEffect(() => {
    if(token) {
        fetchOrder();
        
        // 🟢 SUSCRIPCIÓN REALTIME
        const channel = supabase.channel(`tracking-order-${token}`)
          .on(
            'postgres_changes', 
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'orders', 
                filter: `tracking_token=eq.${token}` 
            }, 
            (payload) => {
                // 1. Recargar datos
                fetchOrder();

                // 2. Vibrar si el estado cambió
                if (payload.new.status !== prevStatus.current) {
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                }
            }
          ) 
          .subscribe();
          
        return () => { supabase.removeChannel(channel); };
    }
  }, [token]);

  // 🟢 DETECTAR RETORNO DE MERCADO PAGO
  useEffect(() => {
      if (order && order.status === 'pendiente') {
          const query = new URLSearchParams(window.location.search);
          
          // Mercado Pago devuelve estos parámetros exactos:
          const status = query.get('status'); // O 'collection_status'
          const paymentId = query.get('payment_id'); // El ID del comprobante real
          const merchantOrder = query.get('merchant_order_id');

          // 🛡️ SEGURIDAD: Solo confirmamos si dice "approved" Y ADEMÁS trae un ID de pago.
          // Si el usuario escribe "?status=success" manualmente, fallará porque le falta el payment_id.
          if ((status === 'approved' || status === 'success') && paymentId) {
              confirmOrderPayment(paymentId);
          }
      }
  }, [order]);

  const confirmOrderPayment = async (paymentId) => {
      // Guardamos también el ID de pago en la base de datos para tener constancia
      const { error } = await supabase
          .from('orders')
          .update({ 
              status: 'confirmado', 
              payment_id: paymentId, // Asegúrate de tener esta columna o guardarlo en 'metadata'
              payment_status: 'paid' // Si tienes esta columna
          })
          .eq('id', order.id);

      if (!error) {
          setShowSuccessModal(true);
          setOrder(prev => ({ ...prev, status: 'confirmado' }));
          // Limpiamos la URL para que no se pueda re-usar el link
          window.history.replaceState({}, document.title, window.location.pathname);
      }
  };

  const fetchOrder = async () => {
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
  };

  const handleSubmitRating = async () => {
    if (rating === 0) return alert("Selecciona estrellas");
    setIsSubmitting(true);
    
    const { error } = await supabase
        .from('orders')
        .update({ rating, review })
        .eq('tracking_token', token);

    if (!error) {
        setOrder({ ...order, rating, review }); 
        setShowRatingModal(false); 
    }
    setIsSubmitting(false);
  };

  const contactSupport = () => {
      const msg = `Hola, consulto por mi pedido #${order.id}`;
      const whatsappUrl = getWhatsAppUrl(storeData.phone || appConfig.supportWhatsApp, msg);
      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }
  };

  if (loading) return ( 
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#d0ff00]" size={48}/>
    </div> 
  );

  if (!order) return ( 
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">😕</h1>
        <h2 className="text-xl font-bold mb-2">Pedido no encontrado</h2>
        <p className="text-gray-500 mb-6 text-sm">El enlace podría ser antiguo o incorrecto.</p>
        <Link to="/" className="text-black px-8 py-3 rounded-full font-bold shadow-lg" style={{ backgroundColor: brandColor }}>Ir al Inicio</Link>
    </div> 
  );

  const steps = [
    { key: 'pendiente', label: 'Enviado', icon: <Send size={16} /> },
    { key: 'confirmado', label: 'Cocina', icon: <ThumbsUp size={16} /> },
    { key: 'listo', label: 'Listo', icon: <Package size={16} /> },
    { key: 'entregado', label: 'Llegó', icon: <Check size={16} /> }
  ];
  
  let currentStatus = order.status;
  // Mapeo de estados para la barra de progreso
  if(currentStatus === 'preparacion') currentStatus = 'confirmado'; 
  if(currentStatus === 'terminado') currentStatus = 'listo';
  // Si sigue pendiente pero ya pagó, visualmente lo mostramos en confirmado
  if(currentStatus === 'pendiente' && showSuccessModal) currentStatus = 'confirmado';
  
  const currentStepIndex = steps.findIndex(s => s.key === currentStatus);
  const formattedDate = new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex justify-center font-sans text-white">
      <div className="w-full max-w-[500px] bg-[#0f0f0f] min-h-screen relative shadow-2xl flex flex-col border-x border-white/5">
        
        {/* HEADER */}
        <div className="sticky top-0 z-40 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center justify-between">
            <Link to={storeSlug} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full">
              <ChevronLeft size={20} />
            </Link>
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pedido</span>
               <span className="font-mono text-sm font-bold text-white">#{order.id}</span>
            </div>
            <button onClick={contactSupport} className="p-2 -mr-2 text-gray-400 hover:text-white bg-white/5 rounded-full">
               <MessageSquare size={20}/>
            </button>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          
          {/* LOGO LOCAL */}
          <div className="text-center mb-8 mt-4">
              <div className="w-20 h-20 bg-[#1a1a1a] rounded-2xl p-1 shadow-2xl mx-auto mb-4 overflow-hidden border border-white/10 relative">
                  <img src={storeData.logo_url || "https://placehold.co/100"} className="w-full h-full object-cover rounded-xl"/>
                  {/* Badge de Confirmado si aplica */}
                  {(order.status === 'confirmado' || order.status === 'listo' || order.status === 'entregado' || showSuccessModal) && (
                      <div className="absolute -bottom-2 -right-2 bg-green-500 text-black p-1.5 rounded-full border-2 border-[#1a1a1a]">
                          <Check size={14} strokeWidth={4} />
                      </div>
                  )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">{storeData.name || "Tu Pedido"}</h1>
              <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>

          {/* LÍNEA DE TIEMPO */}
          <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-white/5 shadow-lg mb-6 relative overflow-hidden">
            {order.status === 'rechazado' ? (
               <div className="text-red-500 font-bold flex flex-col items-center gap-3 py-4">
                 <div className="bg-red-500/10 p-4 rounded-full"><X size={32} /></div>
                 <p className="text-lg">PEDIDO CANCELADO</p>
                 <p className="text-sm text-gray-400 font-normal px-4 text-center">"{order.rejection_reason || 'Sin motivo especificado'}"</p>
               </div>
            ) : (
              <div className="relative pt-2 pb-2">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2 rounded-full z-0 mx-4"></div>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }} 
                  className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full z-0 mx-4 transition-all duration-1000"
                  style={{ backgroundColor: brandColor }}
                />
                <div className="relative z-10 flex justify-between">
                  {steps.map((step, i) => {
                    const isActive = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-2">
                        <motion.div 
                          initial={false}
                          animate={{ 
                            scale: isCurrent ? 1.2 : 1, 
                            backgroundColor: isActive ? brandColor : '#1a1a1a',
                            borderColor: isActive ? brandColor : '#333'
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 shadow-xl z-10`}
                          style={{ borderColor: isActive ? brandColor : '#4b5563', color: isActive ? 'black' : '#666' }}
                        >
                          <div style={{ color: isActive ? 'black' : '#666' }}>{step.icon}</div>
                        </motion.div>
                        <span className={`text-[10px] font-bold uppercase transition-colors ${isActive ? 'text-white' : 'text-gray-600'}`}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIDER INFO */}
          {order.rider_id && order.riders && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 rounded-3xl p-5 border border-blue-500/20 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="bg-blue-600 p-3 rounded-full text-white shadow-lg">
                          <Bike size={20} />
                      </div>
                      <div>
                          <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Repartidor</p>
                          <p className="text-white font-bold text-lg leading-none">{order.riders.name}</p>
                      </div>
                  </div>
                  {order.riders.phone && (
                      <a href={`https://api.whatsapp.com/send?phone=${order.riders.phone}`} target="_blank" rel="noopener noreferrer" className="bg-white text-blue-900 p-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-md">
                          <MessageSquare size={20}/>
                      </a>
                  )}
              </motion.div>
          )}

          {/* DETALLE COMPRA */}
          <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-white/5 shadow-lg mb-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ShoppingBag size={14}/> Detalle
              </h3>
              <div className="space-y-4 mb-6">
                  {order.items?.map((item, index) => ( 
                      <div key={index} className="flex justify-between items-start">
                          <div className="flex gap-3">
                              <div className="font-bold text-black w-6 h-6 flex items-center justify-center rounded-md text-xs" style={{backgroundColor: brandColor}}>{item.quantity}</div>
                              <div>
                                  <p className="text-white text-sm font-medium leading-tight">{item.name}</p>
                                  {item.variantName && <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>}
                                  {item.extrasNames && <p className="text-[10px] text-gray-500 mt-0.5">+ {item.extrasNames}</p>}
                              </div>
                          </div>
                          <span className="text-white text-sm font-bold">${(item.price * item.quantity).toLocaleString()}</span>
                      </div> 
                  ))}
              </div>
              
              <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                      <span>Subtotal</span>
                      <span>${(order.total - (order.delivery_cost || 0)).toLocaleString()}</span>
                  </div>
                  {order.delivery_cost > 0 && (
                      <div className="flex justify-between text-xs text-gray-400">
                          <span>Envío</span>
                          <span>${order.delivery_cost.toLocaleString()}</span>
                      </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-white pt-2 items-end">
                      <span>Total</span>
                      <span style={{ color: brandColor }}>${order.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-end gap-2 mt-1">
                      <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded uppercase font-bold">{order.payment_method}</span>
                      <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded uppercase font-bold">{order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro'}</span>
                  </div>
              </div>
          </div>
          
          {/* BOTÓN CALIFICAR */}
          {(order.status === 'entregado') && (
              <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} className="mt-2 mb-8">
                  {!order.rating ? (
                      <button onClick={() => setShowRatingModal(true)} className="w-full py-4 rounded-2xl font-bold text-black shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: brandColor }}>
                          <Star size={20} fill="black" /> Calificar Pedido
                      </button>
                  ) : (
                      <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl text-center">
                          <p className="text-green-500 font-bold flex items-center justify-center gap-2"><Check size={18}/> ¡Gracias por tu opinión!</p>
                      </div>
                  )}
              </motion.div>
          )}

        </div>

        {/* 🟢 MODAL DE PAGO EXITOSO (CONFETI VIRTUAL) */}
        <AnimatePresence>
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="bg-[#1a1a1a] w-full max-w-sm rounded-[2.5rem] p-8 text-center border border-white/10 shadow-2xl relative overflow-hidden"
                    >
                        {/* Efecto Confetti CSS */}
                        <div className="absolute inset-0 pointer-events-none">
                             {[...Array(20)].map((_, i) => (
                                <motion.div
                                   key={i}
                                   initial={{ y: 0, x: Math.random() * 300 - 150, opacity: 1 }}
                                   animate={{ y: 500, rotate: 360, opacity: 0 }}
                                   transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: Math.random() }}
                                   className="absolute top-0 left-1/2 w-2 h-2 rounded-full"
                                   style={{ backgroundColor: [brandColor, '#3b82f6', '#ef4444', '#10b981'][Math.floor(Math.random()*4)] }}
                                />
                             ))}
                        </div>

                        <div className="relative z-10">
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6 text-black shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                            >
                                <Check size={48} strokeWidth={4} />
                            </motion.div>
                            
                            <h2 className="text-2xl font-bold text-white mb-2">¡Pago Recibido!</h2>
                            <p className="text-gray-400 mb-8">Tu pedido ya está confirmado y en camino a la cocina.</p>
                            
                            <button 
                                onClick={() => setShowSuccessModal(false)} 
                                className="w-full py-4 rounded-2xl font-bold text-black shadow-lg hover:scale-105 transition-transform"
                                style={{ backgroundColor: brandColor }}
                            >
                                Ver Estado
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* MODAL CALIFICACIÓN */}
        <AnimatePresence>
            {showRatingModal && ( 
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowRatingModal(false)}/>
                    <motion.div initial={{ scale: 0.9, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 50, opacity: 0 }} className="bg-[#1a1a1a] w-full max-w-sm rounded-[2rem] border border-white/10 p-6 relative z-10 shadow-2xl">
                        <button onClick={() => setShowRatingModal(false)} className="absolute top-4 right-4 bg-white/5 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        <div className="text-center mb-6 mt-2">
                            <h3 className="text-xl font-bold text-white mb-1">¿Qué tal estuvo?</h3>
                            <p className="text-xs text-gray-400">Ayúdanos a mejorar</p>
                        </div>
                        <StarRating rating={rating} setRating={setRating} color={brandColor} />
                        <div className="relative mb-6">
                            <textarea 
                                placeholder="Escribe un comentario..." 
                                className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 h-28 resize-none" 
                                value={review} 
                                onChange={(e) => setReview(e.target.value)}
                            />
                        </div>
                        <button onClick={handleSubmitRating} disabled={isSubmitting} className="w-full py-4 rounded-xl font-bold text-black shadow-lg transition-all active:scale-95 disabled:opacity-50" style={{ backgroundColor: brandColor }}>
                            {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : "Enviar Reseña"}
                        </button>
                    </motion.div>
                </div> 
            )}
        </AnimatePresence>

      </div>
    </div>
  );
}
