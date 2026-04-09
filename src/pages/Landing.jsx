import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Calendar, CheckCircle, CreditCard, HelpCircle,
  LayoutDashboard, MapPin, MessageCircle, Package, Percent,
  Rocket, Scissors, ShieldCheck, Utensils, Menu, X
} from 'lucide-react';

// --- CONFIG ---
const DEFAULT_TRIAL_DAYS = 14;
const WA_PHONE = '5492646620024';

const trustItems = [
  { icon: MapPin, title: 'Hecho para negocio local', text: 'Rivapp esta pensado para la realidad diaria de un negocio local en Argentina, no para una empresa abstracta.' },
  { icon: ShieldCheck, title: 'Dinero directo a tu cuenta', text: 'Tus cobros se resuelven directo con tus medios de pago. La plataforma no vive de sacarte porcentaje.' },
  { icon: MessageCircle, title: 'Experiencia publica seria', text: 'Tu cliente ve una pagina prolija, rapida y mucho mas clara que un simple formulario o un chat.' },
];

const demos = [
  {
    title: 'Gastronomia',
    subtitle: 'Pedidos, delivery y retiro',
    href: '/demo',
    signupHref: '/register',
    icon: Utensils,
    tone: 'yellow',
    description: 'Para locales que venden por pedido, carrito, delivery o retiro. Menu digital, checkout y seguimiento real.',
    features: ['Menu digital listo para compartir', 'Pedidos con retiro o delivery', 'Checkout publico pensado para celular', 'Panel operativo para el negocio'],
  },
  {
    title: 'Turnos & Servicios',
    subtitle: 'Reservas, agenda y staff',
    href: '/demo-turnos',
    signupHref: '/register',
    icon: Scissors,
    tone: 'blue',
    description: 'Para negocios que trabajan por agenda o reserva: belleza, salud, deportes y servicios con profesionales.',
    features: ['Reserva publica mobile-first', 'Servicios, staff y horarios', 'Confirmacion clara para el cliente', 'Dashboard interno para operar mejor'],
  },
];

const faqs = [
  { q: 'Realmente Rivapp no cobra comision por venta?', a: 'Exacto. Rivapp trabaja con un abono fijo mensual. El objetivo es que el 100% de cada pedido o reserva sea del negocio.' },
  { q: 'Sirve tanto para pedidos como para turnos?', a: 'Si. Rivapp tiene dos recorridos claros: uno para negocios que venden por pedido y otro para negocios que trabajan con agenda.' },
  { q: 'Puedo ver demos reales antes de contratar?', a: 'Si. Tienes una demo publica de pedidos, una demo publica de turnos y tambien dashboards demo para mostrar el sistema interno.' },
  { q: 'Hay prueba gratis real?', a: `Si. Puedes activar Rivapp con ${DEFAULT_TRIAL_DAYS} dias de prueba para validar el flujo antes de tomar una decision.` },
];

const plans = [
  {
    title: 'Emprendedor',
    subtitle: 'Lo esencial para digitalizar la operacion.',
    price: 30000,
    features: ['Menu Digital / Agenda Web', 'Pedidos WhatsApp Ilimitados', 'Gestion de Stock y Servicios', 'QR Personalizado', 'Soporte por Email'],
  },
  {
    title: 'Profesional',
    subtitle: 'La configuracion recomendada para crecer.',
    price: 40000,
    recommended: true,
    features: ['Todo lo de Emprendedor', 'Integracion Mercado Pago (0% Com.)', 'Gestion de Staff y Riders', 'Envios calculados por KM', 'Cupones y Fidelizacion', 'Metricas de Venta Avanzadas', 'Soporte Prioritario WhatsApp'],
  },
  {
    title: 'Corporativo',
    subtitle: 'Para marcas, cadenas o necesidades especiales.',
    price: 'A Medida',
    features: ['Multiples Sucursales', 'Panel Maestro Centralizado', 'Integraciones con ERP/Sistemas', 'Dominio Propio (ej: tunegocio.com)', 'Desarrollo de Funciones Extra', 'Gerente de Cuenta Dedicado'],
  },
];

// --- COMPONENTS ---

function MobileMenu({ isOpen, onClose }) {
  const firstLinkRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstLinkRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute w-full top-20 left-0 z-50 bg-[#0a0a0a] border-b border-white/10 shadow-2xl">
        <div className="flex flex-col p-6 gap-4">
          <a href="#soluciones" ref={firstLinkRef} className="text-lg font-bold text-white py-3 border-b border-white/5" onClick={onClose}>Soluciones</a>
          <a href="#planes" className="text-lg font-bold text-white py-3 border-b border-white/5" onClick={onClose}>Planes</a>
          <a href="#faq" className="text-lg font-bold text-white py-3 border-b border-white/5" onClick={onClose}>FAQ</a>
          <Link to="/login" className="text-lg font-bold text-white py-3 border-b border-white/5" onClick={onClose}>Ingresar</Link>
          <Link to="/register" className="bg-[#d0ff00] text-black py-4 rounded-xl text-center font-bold text-lg mt-2" onClick={onClose}>Prueba gratis</Link>
        </div>
      </div>
    </>
  );
}

function HeroDashboardPreview() {
  return (
    <div className="relative mx-auto hidden w-full max-w-[640px] lg:block">
      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-[#d0ff00]/18 via-[#009EE3]/12 to-transparent blur-[80px]" />
      <div className="relative overflow-hidden rounded-[2rem] border-[3px] border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl shadow-black/50">
        <div className="flex h-8 items-center gap-2 bg-[#141414] px-4">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/50" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
            <div className="h-3 w-3 rounded-full bg-green-500/50" />
          </div>
          <div className="mx-auto flex h-5 w-2/3 items-center rounded-md bg-[#1f1f1f] px-4 text-[8px] font-mono text-gray-600">rivapp.com.ar/admin</div>
        </div>

        <div className="flex min-h-[420px]">
          <div className="hidden w-48 bg-[#111111] p-4 md:flex md:flex-col md:gap-3">
            <div className="mb-2 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-[#d0ff00]" />
              <span className="font-bold text-white">Admin</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-[#d0ff00]/18 p-2 text-sm font-bold text-[#d0ff00]">
              <LayoutDashboard className="h-4 w-4" /> Panel
            </div>
            <div className="flex items-center gap-2 p-2 text-sm text-gray-500">
              <Package className="h-4 w-4" /> Actividad
            </div>
          </div>

          <div className="flex-1 bg-[#0a0a0a] p-6">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Tu Negocio</h2>
                <p className="text-sm text-gray-500">Dinero directo a tu cuenta.</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[#009EE3] px-3 py-1.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(0,158,227,0.35)]">
                <CreditCard className="h-3.5 w-3.5" /> Mercado Pago
              </div>
            </div>

            <div className="mb-8 grid grid-cols-3 gap-4">
              {[['Ingresos', '$128k'], ['Pagados', '28'], ['Comision', '0%']].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#141414] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
                  <p className="mt-1 text-2xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-[#141414] p-4">
              <div className="grid grid-cols-7 items-end gap-3">
                {[40, 68, 48, 82, 58, 92, 70].map((height, i) => (
                  <div key={i} className="flex h-40 items-end">
                    <div className="w-full rounded-full bg-gradient-to-t from-[#009EE3] to-[#d0ff00]" style={{ height: `${height}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoCard({ title, subtitle, href, signupHref, icon: Icon, tone, description, features }) {
  const tones = {
    yellow: { accent: 'text-[#d0ff00]', surface: 'bg-[#d0ff00]/10', border: 'border-[#d0ff00]/35', glow: 'bg-[#d0ff00]/10' },
    blue: { accent: 'text-[#60c8ff]', surface: 'bg-[#009EE3]/12', border: 'border-[#009EE3]/35', glow: 'bg-[#009EE3]/12' },
  };
  const t = tones[tone];

  return (
    <div className="group relative">
      <div className={`absolute inset-0 rounded-[2rem] ${t.glow} blur-[64px] opacity-0 transition duration-500 group-hover:opacity-70`} />
      <div className="relative flex h-full flex-col rounded-[2rem] bg-[#111] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.3)] transition hover:-translate-y-1">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${t.surface} ${t.accent}`}>
            <Icon className="h-7 w-7" />
          </div>
          <Link to={href} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] ${t.border} ${t.accent} transition hover:bg-white/5`}>
            Ver demo <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <p className={`text-xs font-bold uppercase tracking-[0.24em] ${t.accent}`}>{subtitle}</p>
        <h3 className="mt-3 text-3xl font-black text-white">{title}</h3>
        <p className="mt-4 text-sm leading-7 text-gray-400">{description}</p>

        <ul className="mt-8 space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-sm font-medium text-gray-300">
              <CheckCircle className={`h-4 w-4 ${t.accent}`} /> {f}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex gap-3">
          <Link to={signupHref} className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:scale-[1.02]">Empezar gratis</Link>
          <Link to={href} className="inline-flex items-center justify-center rounded-2xl bg-white/[0.08] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.12]">Abrir demo</Link>
        </div>
      </div>
    </div>
  );
}

function PriceCard({ title, subtitle, price, features, recommended }) {
  const waMessage = encodeURIComponent(`Hola, estoy interesado en el plan ${title} de Rivapp`);
  const priceLabel = typeof price === 'number' ? `$${price.toLocaleString('es-AR')}` : price;

  return (
    <div className={`rounded-[2.5rem] p-[2px] ${recommended ? 'bg-gradient-to-b from-[#d0ff00] via-[#009EE3] to-[#d0ff00] shadow-[0_0_30px_-10px_rgba(0,158,227,0.4)]' : 'bg-white/10'}`}>
      <div className="relative flex h-full flex-col overflow-hidden rounded-[2.4rem] bg-[#0a0a0a] p-8">
        {recommended && <div className="absolute right-5 top-5 rounded-full bg-[#d0ff00] px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-black">Mas elegido</div>}
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>

        <div className="mt-7 flex items-end gap-2">
          <span className="text-5xl font-black tracking-tight text-white">{priceLabel}</span>
          {price !== 'A Medida' && <span className="pb-1 text-gray-500">/mes</span>}
        </div>
        <p className="mt-2 text-xs font-medium text-gray-500">{price !== 'A Medida' ? 'ARS finales / mes' : 'segun alcance'}</p>

        <ul className="mt-8 flex-1 space-y-4">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-[#d0ff00]/20 p-1 text-[#d0ff00]"><CheckCircle className="h-3.5 w-3.5" /></div>
              <span className="text-sm font-medium text-gray-300">{f}</span>
            </li>
          ))}
        </ul>

        <a
          href={`https://wa.me/${WA_PHONE}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-10 inline-flex items-center justify-center gap-3 rounded-2xl py-4 text-lg font-bold transition ${recommended ? 'bg-[#d0ff00] text-black hover:bg-[#e1ff55]' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          Empezar ahora <ArrowRight className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}

// --- MAIN ---
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] text-white selection:bg-[#d0ff00] selection:text-black">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-16%] h-[58vw] w-[58vw] rounded-full bg-[#d0ff00]/5 blur-[140px]" />
        <div className="absolute bottom-[-22%] right-[-8%] h-[48vw] w-[48vw] rounded-full bg-[#009EE3]/10 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 h-20 bg-[#050505]/88 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-xl bg-[#d0ff00] p-2 text-black"><Rocket className="h-5 w-5 fill-black/15" /></div>
            <span className="text-xl font-black tracking-tight">Rivapp</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-400 md:flex">
            <a href="#soluciones" className="transition hover:text-white">Soluciones</a>
            <a href="#planes" className="transition hover:text-white">Planes</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm font-bold text-gray-300 transition hover:text-white sm:inline">Ingresar</Link>
            <Link to="/register" className="hidden rounded-full bg-[#d0ff00] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#e1ff55] sm:inline-flex">Prueba gratis</Link>
            <button className="p-2 text-white/80 hover:text-white md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
        <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="px-6 pb-20 pt-28 md:pb-24 md:pt-36">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#009EE3]/25 bg-[#009EE3]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#7cd3ff]">
                <CreditCard className="h-4 w-4" /> Sistema operativo para negocio local
              </div>

              <h1 className="mt-8 text-5xl font-black leading-[0.98] tracking-tight md:text-6xl xl:text-7xl">
                Tu negocio<br />online,<br />
                <span className="text-[#d0ff00]">Sin comisiones.</span>
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-8 text-gray-400 md:text-xl">
                Rivapp reemplaza el caos de WhatsApp, planillas y cuaderno con una experiencia publica profesional
                y un panel interno listo para operar pedidos o turnos.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link to="/register" className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#d0ff00] px-6 py-4 text-base font-bold text-black transition hover:bg-[#e1ff55]">
                  Comenzar Gratis <ArrowRight className="h-5 w-5" />
                </Link>
                <Link to="/demo" className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white/[0.08] px-6 py-4 text-base font-bold text-white transition hover:bg-white/[0.12]">
                  Ver Demo Delivery
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-5 text-sm font-semibold text-gray-400">
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#d0ff00]" /> Sin comision por venta</span>
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[#d0ff00]" /> Demo de turnos y de pedidos</span>
              </div>
            </div>

            <HeroDashboardPreview />
          </div>
        </section>

        {/* Trust */}
        <section className="bg-[#0a0a0a] px-6 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-black md:text-4xl">Tecnologia Global, <span className="text-[#d0ff00]">Corazon Local.</span></h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-400 md:text-base">Sabemos lo dificil que es emprender. Por eso Rivapp busca darte una herramienta que este de tu lado.</p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {trustItems.map((item) => (
                <div key={item.title} className="rounded-[2rem] bg-[#111] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.26)] transition-transform hover:-translate-y-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d0ff00]/10 text-[#d0ff00]"><item.icon className="h-5 w-5" /></div>
                  <h3 className="mt-5 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-gray-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions */}
        <section id="soluciones" className="scroll-mt-24 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-gray-500">Verticales principales</p>
              <h2 className="mt-4 text-3xl font-black md:text-5xl">Cual es tu negocio?</h2>
              <p className="mt-4 text-lg text-gray-400">Dos demos reales para dos formas de operar.</p>
            </div>
            <div className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-2">
              {demos.map((demo) => <DemoCard key={demo.title} {...demo} />)}
            </div>
          </div>
        </section>

        {/* No Commissions Banner */}
        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-[2.5rem] bg-[#0a0a0a] px-8 py-14 text-center shadow-[0_30px_100px_rgba(0,0,0,0.52)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400"><Percent className="h-7 w-7" /></div>
            <h2 className="mt-8 text-4xl font-black leading-tight md:text-5xl">Tu esfuerzo es <span className="underline decoration-[#d0ff00] underline-offset-8">100% tuyo</span>.</h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-300">
              Rivapp no se queda con un porcentaje de cada movimiento.
              <span className="mt-4 block text-2xl font-black text-white">Cobras directo, operas mejor y mantienes el control.</span>
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link to="/demo" className="rounded-2xl bg-white px-8 py-4 text-lg font-black text-black transition hover:scale-[1.02]">Ver Demo Pedidos</Link>
              <Link to="/demo-turnos" className="rounded-2xl bg-white/[0.08] px-8 py-4 text-lg font-black text-white transition hover:bg-white/[0.12]">Ver Demo Turnos</Link>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="planes" className="scroll-mt-24 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-4xl font-black md:text-5xl">Planes para cada etapa</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">Una estructura clara para empezar rapido y crecer con una base mucho mas seria.</p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {plans.map((plan) => <PriceCard key={plan.title} {...plan} />)}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-24 bg-[#050505] px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <h2 className="text-3xl font-black md:text-4xl">Preguntas Frecuentes</h2>
              <p className="mt-4 text-gray-400">Respondemos las dudas importantes antes de empezar.</p>
            </div>
            <div className="mt-14 grid gap-6">
              {faqs.map((item) => (
                <div key={item.q} className="rounded-[1.8rem] bg-[#111] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.24)] transition-transform hover:-translate-y-1">
                  <h3 className="flex items-start gap-3 text-lg font-bold text-white">
                    <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#d0ff00]" /> {item.q}
                  </h3>
                  <p className="mt-4 border-l-2 border-[#d0ff00]/20 pl-5 text-sm leading-7 text-gray-400">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#050505] px-6 py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#d0ff00] p-2 text-black"><Rocket className="h-4 w-4 fill-black/15" /></div>
              <div>
                <p className="font-black text-white">Rivapp</p>
                <p>Sistema operativo para negocio local.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-5">
              <Link to="/demo" className="transition hover:text-white">Demo pedidos</Link>
              <Link to="/demo-turnos" className="transition hover:text-white">Demo turnos</Link>
              <Link to="/register" className="transition hover:text-white">Prueba gratis</Link>
            </div>
          </div>
        </footer>
      </main>

      {/* WhatsApp FAB */}
      <a
        href={`https://wa.me/${WA_PHONE}?text=${encodeURIComponent('Hola, vi la web de Rivapp y tengo una consulta.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3 md:p-4 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.4)] flex items-center gap-2 font-bold hover:bg-[#20bd5a] transition-colors"
        aria-label="Consultar por WhatsApp"
      >
        <MessageCircle size={24} />
        <span className="hidden md:block pr-1">Consultar</span>
      </a>
    </div>
  );
}
