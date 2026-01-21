import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Zap, CheckCircle, ArrowRight, Calendar, 
  MapPin, MessageCircle, BarChart3, LayoutDashboard, 
  DollarSign, Percent, ShieldCheck, Utensils, 
  Scissors, CreditCard, Menu, X, HelpCircle
} from 'lucide-react';

import { 
  AreaChart, Area, CartesianGrid, ResponsiveContainer 
} from 'recharts';

// --- UTILITIES ---

// 1. SLUGIFY ROBUSTO (Maneja tildes y caracteres latinos)
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")                 // Descompone caracteres (ej: ó -> o + ´)
    .replace(/[\u0300-\u036f]/g, "")  // Elimina los diacríticos
    .trim()
    .replace(/\s+/g, '-')             // Espacios a guiones
    .replace(/[^\w\-]+/g, '')         // Solo letras, números y guiones
    .replace(/\-\-+/g, '-');          // Elimina guiones dobles
};

// 2. TRACKING SSR SAFE & CONSISTENTE
const trackEvent = (eventName, params = {}) => {
  // Prevención de errores en Server Side Rendering (Next.js)
  if (typeof window === "undefined") return;
  
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }
};

// --- CONFIGURACIÓN DE ESTILOS ---
const cardVariants = {
  yellow: {
    iconBg: "bg-[#d0ff00]/10",
    iconText: "text-[#d0ff00]",
    border: "border-[#d0ff00]",
    checkColor: "#d0ff00",
    blurColor: "bg-[#d0ff00]/20"
  },
  blue: {
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-500",
    border: "border-blue-500",
    checkColor: "#3b82f6",
    blurColor: "bg-blue-500/20"
  }
};

// --- COMPONENTES AUXILIARES ---

const WhatsAppButton = () => {
  const message = encodeURIComponent("Hola, vi la web de Rivapp y tengo una consulta.");
  
  return (
    <motion.a 
      href={`https://wa.me/5492646620024?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('click_whatsapp', { location: 'floating_button' })}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3 md:p-4 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.4)] flex items-center gap-2 font-bold cursor-pointer hover:bg-[#20bd5a] transition-colors focus:outline-none focus:ring-4 focus:ring-green-500/50"
      aria-label="Consultar por WhatsApp"
    >
      <MessageCircle size={24} className="md:w-7 md:h-7" />
      <span className="hidden md:block pr-1">Consultar</span>
    </motion.a>
  );
};

const TrustSection = () => (
  <section className="py-16 md:py-20 bg-[#0a0a0a] border-y border-white/5 relative z-10">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
          Tecnología Global, <span className="text-[#d0ff00]">Corazón Local.</span>
        </h2>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
          Sabemos lo difícil que es emprender en Argentina. Por eso creamos una herramienta que está de tu lado.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: MapPin, title: "Hecho en San Juan", text: "Desarrollado en Rivadavia por Riva Estudio. Hablás con gente real, vecinos tuyos." },
          { icon: ShieldCheck, title: "Dinero Seguro", text: "Tus ventas van directo a tu Mercado Pago. No tocamos tu dinero ni cobramos comisiones." },
          { icon: MessageCircle, title: "Soporte Directo", text: "Configuración asistida en 24hs. Soporte prioritario por WhatsApp para que nunca frenes." }
        ].map((item, i) => (
          <div key={i} className="bg-[#111] p-6 rounded-3xl border border-white/5 hover:border-[#d0ff00]/30 transition-colors group">
            <div className="w-12 h-12 bg-[#d0ff00]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <item.icon className="text-[#d0ff00]" size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
            <p className="text-gray-500 text-sm">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FAQSection = () => (
  <section className="py-24 bg-[#050505] relative z-10 border-t border-white/5">
    <div className="max-w-4xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Preguntas Frecuentes</h2>
        <p className="text-gray-400">Respondemos tus dudas antes de empezar.</p>
      </div>

      <div className="grid gap-6">
        {[
          { 
            q: "¿Realmente no cobran comisión por venta?", 
            a: "Exacto. A diferencia de las apps de delivery masivas, nosotros cobramos una suscripción fija mensual. Vendas $10.000 o $10.000.000, pagás lo mismo. El 100% de la venta es tuya." 
          },
          { 
            q: "¿Cómo recibo el dinero de mis ventas?", 
            a: "Usamos Mercado Pago. El dinero entra directamente a tu cuenta de Mercado Pago al instante. Nosotros no intermediamos ni tocamos tu dinero." 
          },
          { 
            q: "¿Cuánto tardan en entregarme el sistema?", 
            a: "En 24/48hs hábiles tenés tu sistema configurado y listo para vender. Nosotros te ayudamos con la carga inicial del menú o servicios." 
          },
          { 
            q: "¿Sirve si no tengo delivery?", 
            a: "¡Sí! Muchos clientes usan Rivapp solo para reservas de mesas, turnos (barberías/canchas) o para que la gente pida y retire por el local (Takeaway)." 
          },
          { 
            q: "¿Puedo usar mi propio dominio?", 
            a: "Sí. En el plan Corporativo conectamos tu dominio (ej: tupizzeria.com) para que la marca sea totalmente tuya." 
          }
        ].map((item, i) => (
          <div key={i} className="bg-[#111] p-8 rounded-3xl border border-white/5 hover:border-[#d0ff00]/20 transition-colors">
            <h3 className="text-lg font-bold text-white mb-3 flex items-start gap-3">
              <HelpCircle className="text-[#d0ff00] shrink-0 mt-1" size={20} />
              {item.q}
            </h3>
            <p className="text-gray-400 leading-relaxed pl-8 border-l-2 border-[#d0ff00]/20 ml-2">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const SolutionCard = ({ title, icon: Icon, description, features, link, colorVariant = "yellow", delay }) => {
  const styles = cardVariants[colorVariant]; 

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true, margin: "-50px" }}
      className="group relative"
    >
      <div className={`absolute inset-0 ${styles.blurColor} blur-[40px] md:blur-[80px] rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-700 motion-reduce:hidden`}></div>
      
      <div className="relative bg-[#111] border border-white/10 rounded-[2rem] p-8 h-full flex flex-col hover:border-white/20 transition-all hover:-translate-y-1 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${styles.iconBg} ${styles.iconText}`}>
            <Icon size={32} />
          </div>
          <Link 
            to={link}
            // ID Normalizado con el nuevo slugify
            onClick={() => trackEvent('select_content', { content_type: 'demo', item_id: slugify(title) })} 
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors flex items-center gap-2 ${styles.border} ${styles.iconText} hover:bg-white/5`}
          >
            Ver Demo <ArrowRight size={12}/>
          </Link>
        </div>
        
        <h3 className="text-3xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 mb-8 leading-relaxed">{description}</p>
        
        <ul className="space-y-3 mt-auto">
          {features.map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-300">
              <CheckCircle size={16} color={styles.checkColor} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

const PriceCard = ({ title, price, features, recommended, subtitle }) => {
  const safeId = slugify(title);
  
  const handlePriceClick = () => {
    // 3. ESTRATEGIA HÍBRIDA DE EVENTOS GA4
    
    // Si es Enterprise, es un Lead, no un Checkout
    if (price === "A Medida") {
      trackEvent('generate_lead', {
        item_name: title,
        currency: 'ARS', // Default context
        tier_type: 'enterprise'
      });
      return;
    }

    // Si es plan standard, es E-commerce Checkout
    trackEvent('begin_checkout', { 
      currency: 'ARS',
      value: price, 
      items: [{
        item_id: `plan_${safeId}`,
        item_name: title,
        price: price,
        quantity: 1,
        item_category: 'SaaS Subscription'
      }]
    });
  };

  const waMessage = encodeURIComponent(`Hola, estoy interesado en el plan ${title} de Rivapp`);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className={`p-[2px] rounded-[2.5rem] relative transition-transform hover:-translate-y-2 ${recommended ? 'bg-gradient-to-b from-[#d0ff00] via-[#009EE3] to-[#d0ff00] shadow-[0_0_30px_-10px_rgba(0,158,227,0.4)]' : 'bg-white/10 border border-white/5'}`}
    >
      <div className="bg-[#0a0a0a] p-8 md:p-10 rounded-[2.4rem] h-full flex flex-col relative overflow-hidden">
        {recommended && (
          <div className="absolute top-5 right-5 bg-[#d0ff00] text-black text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
            Más Elegido
          </div>
        )}
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-500 text-sm mb-6">{subtitle}</p>
        
        <div className="mb-2 flex items-baseline gap-1">
          <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
            {typeof price === 'number' ? `$${price.toLocaleString('es-AR')}` : price}
          </span>
          {price !== "A Medida" && <span className="text-gray-500 font-medium">/mes</span>}
        </div>

        {price !== "A Medida" && (
          <p className="text-xs text-gray-500 font-medium mb-8">
            ARS Finales · Sin Comisiones · Alta en 24hs
          </p>
        )}
        {price === "A Medida" && <div className="mb-8"></div>}

        <ul className="space-y-4 mb-10 flex-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-[#d0ff00]/20 rounded-full shrink-0">
                <CheckCircle size={14} className="text-[#d0ff00]" strokeWidth={3} />
              </div>
              <span className="text-[14px] md:text-[15px] font-medium text-gray-300">{f}</span>
            </li>
          ))}
        </ul>
        <a 
          href={`https://wa.me/5492646620024?text=${waMessage}`} 
          target="_blank"
          rel="noopener noreferrer"
          onClick={handlePriceClick}
          className={`w-full py-4 rounded-2xl font-bold text-center text-lg transition-all active:scale-95 flex items-center justify-center gap-3 focus:ring-4 focus:ring-[#d0ff00]/50 outline-none ${recommended ? 'bg-[#d0ff00] text-black hover:bg-[#e1ff55]' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          Empezar Ahora <ArrowRight size={20}/>
        </a>
      </div>
    </motion.div>
  );
};

// ... Chart Data & Illustration (Mantenemos igual) ...
const chartData = [
  { name: 'Lun', value: 40000 },
  { name: 'Mar', value: 65000 },
  { name: 'Mie', value: 45000 },
  { name: 'Jue', value: 80000 },
  { name: 'Vie', value: 55000 },
  { name: 'Sab', value: 90000 },
  { name: 'Dom', value: 70000 },
];

const DashboardIllustration = () => (
    <div className="relative aspect-[16/10] bg-[#0a0a0a] rounded-3xl overflow-hidden border-[3px] border-[#1a1a1a] shadow-2xl shadow-purple-900/20 select-none">
        <div className="h-8 bg-[#141414] border-b border-white/5 flex items-center px-4 gap-2">
            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/50"></div><div className="w-3 h-3 rounded-full bg-yellow-500/50"></div><div className="w-3 h-3 rounded-full bg-green-500/50"></div></div>
            <div className="bg-[#1f1f1f] h-5 w-2/3 rounded-md mx-auto flex items-center px-4 text-[8px] text-gray-600 font-mono">rivapp.com.ar/panel</div>
        </div>
        <div className="flex h-full">
             <div className="w-48 bg-[#111111] border-r border-white/5 p-4 flex flex-col gap-3 hidden md:flex">
                <div className="flex items-center gap-2 mb-2"><Rocket className="text-[#d0ff00]" size={20}/><span className="font-bold text-white">Admin</span></div>
                <div className="bg-[#d0ff00]/20 text-[#d0ff00] p-2 rounded-lg flex items-center gap-2 text-sm font-bold"><BarChart3 size={16}/> Panel</div>
                <div className="text-gray-500 p-2 flex items-center gap-2 text-sm"><LayoutDashboard size={16}/> Actividad</div>
             </div>
             <div className="flex-1 p-6 bg-[#0a0a0a]">
                <div className="flex justify-between items-center mb-8">
                    <div><h2 className="text-2xl font-bold text-white mb-1">Tu Negocio</h2><p className="text-sm text-gray-500">Dinero directo a tu cuenta.</p></div>
                    <div className="bg-[#009EE3] text-white px-3 py-1.5 rounded-lg font-bold text-xs flex gap-2 items-center shadow-[0_0_15px_#009ee360]"><CreditCard size={14}/> Mercado Pago</div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#141414] p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><DollarSign size={10}/>Ingresos</p>
                        <p className="text-xl lg:text-3xl font-black text-white">$128k</p>
                    </div>
                    <div className="bg-[#141414] p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><CheckCircle size={10}/>Pagados</p>
                        <p className="text-xl lg:text-3xl font-black text-white">28</p>
                    </div>
                    <div className="bg-[#141414] p-4 rounded-2xl border border-white/5 hidden lg:block relative overflow-hidden">
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Comisión</p>
                        <p className="text-xl lg:text-3xl font-black text-white">0%</p>
                    </div>
                </div>
                <div className="bg-[#141414] h-48 lg:h-64 rounded-2xl border border-white/5 p-4 flex flex-col relative overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#009EE3" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#009EE3" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false}/>
                            <Area type="monotone" dataKey="value" stroke="#009EE3" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
             </div>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function Landing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef(null); // Ref para restaurar foco
  const firstMenuLinkRef = useRef(null); // Ref para el focus trap inicial

  // EFECTO: Gestión de Foco y Scroll Lock
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      // Mover foco adentro del menú
      setTimeout(() => firstMenuLinkRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      // 4. RESTAURAR FOCO AL CERRAR (A11y)
      // Solo si el menú se cerró y no fue por un link externo
      if (document.activeElement !== document.body) {
        menuButtonRef.current?.focus();
      }
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // EFECTO: Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d0ff00] selection:text-black overflow-x-hidden scroll-smooth scroll-pt-24">
      
      {/* 🟣 FONDO ANIMADO */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden motion-reduce:hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-600/10 blur-[60px] md:blur-[150px] rounded-full mix-blend-screen animate-pulse-slow will-change-transform"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[#d0ff00]/5 blur-[60px] md:blur-[150px] rounded-full mix-blend-screen will-change-transform"></div>
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 supports-[backdrop-filter]:bg-[#050505]/80 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#d0ff00] rounded-lg p-1">
            <div className="bg-[#d0ff00] p-2 rounded-xl group-hover:shadow-[0_0_15px_#d0ff0060] transition-shadow">
                <Rocket className="text-black fill-black" size={22} />
            </div>
            <span className="font-black text-2xl tracking-tight text-white">Rivapp</span>
          </Link>

          {/* Menú Desktop */}
          <div className="hidden md:flex gap-1 items-center">
            <a 
                href="https://rivaestudio.com.ar" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => trackEvent('click_external', { dest: 'rivaestudio' })}
                className="text-sm font-bold text-gray-300 hover:text-white px-4 py-2 transition-colors"
            >
                Nosotros
            </a>
            <Link to="/login" className="text-sm font-bold text-gray-300 hover:text-white px-5 py-2.5 transition-colors">Ingresar</Link>
            <a href="#soluciones" className="bg-[#d0ff00] text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#e1ff55] hover:shadow-[0_0_20px_rgba(208,255,0,0.4)] transition-all focus:ring-4 focus:ring-[#d0ff00]/50 outline-none">
              Ver Demos
            </a>
          </div>

          {/* 🟢 ZONA MOBILE (Botón Ingresar + Hamburguesa) */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Botón Ingresar solo visible en móvil */}
            <Link 
              to="/login"
              className="text-sm font-bold text-white bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
            >
              Ingresar
            </Link>

            {/* Botón Mobile Hamburger */}
            <button 
                ref={menuButtonRef} // Referencia para focus restore
                className="p-2 text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#d0ff00] rounded-lg"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
            >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Menú Desplegable Mobile + Overlay */}
        <AnimatePresence>
            {isMobileMenuOpen && (
                <>
                  {/* 5. OVERLAY (Click afuera para cerrar) */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                  />

                  <motion.div 
                      id="mobile-menu"
                      role="dialog"
                      aria-modal="true"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'calc(100dvh - 80px)' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="md:hidden bg-[#0a0a0a] border-b border-white/10 overflow-hidden absolute w-full top-20 left-0 z-50 shadow-2xl"
                  >
                      <div className="flex flex-col p-6 gap-6 h-full bg-[#0a0a0a] overflow-y-auto">
                          <Link 
                            to="/login" 
                            ref={firstMenuLinkRef} // Target del Focus inicial
                            className="text-xl font-bold text-white py-2 border-b border-white/5 outline-none focus:text-[#d0ff00]" 
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Ingresar al Panel
                          </Link>
                          
                          <a 
                            href="https://rivaestudio.com.ar" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xl font-bold text-gray-400 py-2 border-b border-white/5 outline-none focus:text-white" 
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Sobre Riva Estudio
                          </a>
                          
                          <a 
                            href="#soluciones" 
                            className="bg-[#d0ff00] text-black py-4 rounded-xl text-center font-bold text-xl mt-4 outline-none focus:ring-4 focus:ring-white/50" 
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                              Ver Demos
                          </a>
                      </div>
                  </motion.div>
                </>
            )}
        </AnimatePresence>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#009EE3]/10 border border-[#009EE3]/20 mb-8">
                        <span className="w-2 h-2 rounded-full bg-[#009EE3] animate-pulse"></span>
                        <span className="text-[10px] md:text-xs font-extrabold text-[#009EE3] uppercase tracking-widest flex items-center gap-2">
                           <CreditCard size={14}/> Cobros con Mercado Pago
                        </span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
                      Tu negocio online,<br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d0ff00] to-white">
                        Sin comisiones.
                      </span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-xl font-medium leading-relaxed">
                      El sistema definitivo para gestionar <strong>Restaurantes</strong> y <strong>Servicios</strong>. 
                      Recibe pagos online directo a tu cuenta de Mercado Pago y gestiona todo en un solo panel.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-12">
                      <Link to="/demo" onClick={() => trackEvent('select_content', { content_type: 'demo', item_id: 'gastro' })} className="bg-[#d0ff00] text-black px-6 py-4 rounded-2xl font-bold text-lg hover:bg-[#e1ff55] hover:shadow-[0_0_20px_rgba(208,255,0,0.3)] transition-all flex items-center justify-center gap-3">
                        <Utensils size={20} className="fill-black/20"/> Demo Gastronomía
                      </Link>
                      <Link to="/demo-turnos" onClick={() => trackEvent('select_content', { content_type: 'demo', item_id: 'turnos' })} className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold text-lg hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-3">
                        <Calendar size={20} className="fill-white/20"/> Demo Turnos
                      </Link>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 text-sm font-bold text-gray-400">
                        <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-[#d0ff00]"/> Dinero directo a tu cuenta</span>
                        <span className="flex items-center gap-2"><Zap size={18} className="text-[#d0ff00]"/> 0% Comisión por venta</span>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 30, scale: 0.9 }} 
                    animate={{ opacity: 1, x: 0, scale: 1 }} 
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 hidden lg:block perspective-1000"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#d0ff00]/20 via-[#009EE3]/10 to-transparent blur-[80px] rounded-full -z-10 transform rotate-12 scale-110 motion-reduce:hidden"></div>
                    <div className="transform rotate-y-[-5deg] rotate-x-[2deg] hover:rotate-0 transition-transform duration-500">
                        <DashboardIllustration />
                    </div>
                </motion.div>
            </div>
        </div>
      </section>

      <TrustSection />

      {/* 🟢 SECCIÓN: ELIGE TU SOLUCIÓN */}
      <section id="soluciones" className="py-24 px-6 relative z-10 bg-[#0a0a0a]/50 border-y border-white/5 scroll-mt-24">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-black mb-6">¿Cuál es tu negocio?</h2>
                <p className="text-xl text-gray-400">Herramientas profesionales para potenciar tu marca.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <SolutionCard 
                    title="Gastronomía"
                    icon={Utensils}
                    colorVariant="yellow"
                    link="/demo"
                    description="Recibe pedidos por WhatsApp o cobra online con Mercado Pago. Gestiona stock, riders y comandas."
                    features={[
                        'Menú Digital con Código QR',
                        'Cobros Online con Mercado Pago',
                        'Pedidos por WhatsApp Automatizados',
                        'Gestión de Riders y Envíos por KM',
                        'Cupones de Descuento'
                    ]}
                    delay={0.1}
                />

                <SolutionCard 
                    title="Turnos & Servicios"
                    icon={Scissors}
                    colorVariant="blue"
                    link="/demo-turnos"
                    description="Agenda web 24/7. Permite que tus clientes reserven y paguen la seña o el total del servicio al instante."
                    features={[
                        'Agenda Web Autogestionable',
                        'Pagos de Señas con Mercado Pago',
                        'Recordatorios Automáticos',
                        'Gestión de Staff y Cupos',
                        'Historial Clínico/Cliente'
                    ]}
                    delay={0.2}
                />
            </div>
        </div>
      </section>

      {/* BANNER "NO COMISIONES" */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="max-w-5xl mx-auto bg-[#0a0a0a] rounded-[3rem] p-12 md:p-24 text-center border border-white/10 relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Percent size={48} className="text-red-500" strokeWidth={3}/>
                </div>
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                    Tu esfuerzo es <span className="text-white underline decoration-[#d0ff00]">100% tuyo</span>.
                </h2>
                <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
                    A diferencia de otras apps, nosotros no cobramos porcentajes por tus ventas. 
                    <span className="text-white font-bold block mt-4 text-2xl md:text-3xl">Cobras por Mercado Pago y el dinero entra directo a tu cuenta.</span>
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/demo" className="bg-white text-black px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all">
                        Ver Demo Resto
                    </Link>
                    <Link to="/demo-turnos" className="bg-[#1a1a1a] border border-white/20 text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-white/10 transition-all">
                        Ver Demo Turnos
                    </Link>
                </div>
            </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-32 px-6 relative z-10 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Planes para cada etapa</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Sin costos ocultos. Elige el plan que se adapte a tu crecimiento.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            <PriceCard 
              title="Emprendedor" 
              subtitle="Lo esencial para digitalizarte."
              price={30000} 
              features={[
                  'Menú Digital / Agenda Web', 
                  'Pedidos WhatsApp Ilimitados', 
                  'Gestión de Stock y Servicios', 
                  'QR Personalizado',
                  'Soporte por Email'
                ]} 
            />
            
            <PriceCard 
              title="Profesional" 
              subtitle="Potencia máxima para tu marca."
              price={40000} 
              recommended={true}
              features={[
                  'Todo lo de Emprendedor', 
                  'Integración Mercado Pago (0% Com.)',
                  'Gestión de Staff y Riders', 
                  'Envíos calculados por KM',
                  'Cupones y Fidelización',
                  'Métricas de Venta Avanzadas',
                  'Soporte Prioritario WhatsApp'
                ]} 
            />
            
            <PriceCard 
              title="Corporativo" 
              subtitle="Para grandes estructuras."
              price="A Medida" 
              features={[
                  'Múltiples Sucursales', 
                  'Panel Maestro Centralizado', 
                  'Integraciones con ERP/Sistemas', 
                  'Dominio Propio (ej: tunegocio.com)',
                  'Desarrollo de Funciones Extra',
                  'Gerente de Cuenta Dedicado'
                ]} 
            />
          </div>
        </div>
      </section>

      <FAQSection />

      {/* FOOTER */}
      <footer className="py-20 border-t border-white/5 bg-[#020202] relative z-10">
        <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16">
                <div className="flex flex-col items-center md:items-start gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#d0ff00] p-2 rounded-xl">
                            <Rocket size={24} className="text-black fill-black"/>
                        </div>
                        <span className="font-black text-3xl text-white tracking-tighter">Rivapp</span>
                    </div>
                    <p className="text-gray-400 text-sm max-w-xs text-center md:text-left">Potenciando el comercio local con tecnología de punta.</p>
                </div>
                <div className="flex gap-12 font-medium text-gray-400">
                    <div className="flex flex-col gap-4">
                        <h4 className="text-white font-bold mb-2">Producto</h4>
                        <Link to="/demo" className="hover:text-[#d0ff00] transition-colors">Demo Gastronomía</Link>
                        <Link to="/demo-turnos" className="hover:text-blue-400 transition-colors">Demo Turnos</Link>
                        <a href="#pricing" className="hover:text-[#d0ff00] transition-colors">Precios</a>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 className="text-white font-bold mb-2">Compañía</h4>
                        <a href="https://rivaestudio.com.ar" target="_blank" rel="noopener noreferrer" className="hover:text-[#d0ff00] transition-colors">Nosotros</a>
                        <a href="https://wa.me/5492646620024" target="_blank" className="hover:text-[#d0ff00] transition-colors">Contacto</a>
                    </div>
                </div>
            </div>
            <div className="pt-8 border-t border-white/5 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600 font-medium">
                <p>© {new Date().getFullYear()} Riva Estudio. Todos los derechos reservados.</p>
                <p className="flex items-center gap-2">San Juan, Argentina.</p>
            </div>
        </div>
      </footer>

      <WhatsAppButton />
    </div>
  );
}