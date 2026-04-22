import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Calendar, Check, CheckCircle2, ChevronDown,
  CreditCard, Hash, LayoutDashboard, MapPin, MessageCircle, Package,
  Percent, Rocket, Scissors, ShieldCheck, Sparkles, Utensils, Menu, X,
} from 'lucide-react';
import { appConfig, getWhatsAppUrl } from '../config/appConfig';
import Button from '../components/shared/ui/Button';
import Eyebrow from '../components/shared/ui/Eyebrow';
import Rule from '../components/shared/ui/Rule';

const DEFAULT_TRIAL_DAYS = 14;

const marqueeItems = [
  'Sin comisión por venta',
  'Abono fijo mensual',
  'Cobros directos a tu cuenta',
  'Pedidos · Turnos · Delivery',
  'Hecho en Argentina',
  'Mobile-first',
  '14 días de prueba',
];

const trustItems = [
  {
    icon: MapPin,
    kicker: 'Contexto',
    title: 'Hecho para negocio local',
    text: 'Rivapp está pensado para la realidad diaria de un negocio local en Argentina, no para una empresa abstracta.',
  },
  {
    icon: ShieldCheck,
    kicker: 'Economía',
    title: 'Dinero directo a tu cuenta',
    text: 'Tus cobros se resuelven directo con tus medios de pago. La plataforma no vive de sacarte porcentaje.',
  },
  {
    icon: MessageCircle,
    kicker: 'Experiencia',
    title: 'Frente público serio',
    text: 'Tu cliente ve una página prolija, rápida y mucho más clara que un simple formulario o un chat.',
  },
];

const demos = [
  {
    number: '01',
    title: 'Gastronomía',
    subtitle: 'Pedidos · Delivery · Retiro',
    href: '/demo',
    signupHref: '/register',
    icon: Utensils,
    description:
      'Para locales que venden por pedido, carrito, delivery o retiro. Menú digital, checkout y seguimiento real, sin fricción.',
    features: [
      'Menú digital listo para compartir',
      'Pedidos con retiro o delivery',
      'Checkout público pensado para celular',
      'Panel operativo para el negocio',
    ],
  },
  {
    number: '02',
    title: 'Turnos & Servicios',
    subtitle: 'Reservas · Agenda · Staff',
    href: '/demo-turnos',
    signupHref: '/register',
    icon: Scissors,
    description:
      'Para negocios que trabajan por agenda o reserva: belleza, salud, deportes y servicios con profesionales.',
    features: [
      'Reserva pública mobile-first',
      'Servicios, staff y horarios',
      'Confirmación clara para el cliente',
      'Dashboard interno para operar mejor',
    ],
  },
];

const faqs = [
  {
    q: '¿Realmente Rivapp no cobra comisión por venta?',
    a: 'Exacto. Rivapp trabaja con un abono fijo mensual. El objetivo es que el 100% de cada pedido o reserva sea del negocio.',
  },
  {
    q: '¿Sirve tanto para pedidos como para turnos?',
    a: 'Sí. Rivapp tiene dos recorridos claros: uno para negocios que venden por pedido y otro para negocios que trabajan con agenda.',
  },
  {
    q: '¿Puedo ver demos reales antes de contratar?',
    a: 'Sí. Tenés una demo pública de pedidos, una demo pública de turnos y dashboards demo para mostrar el sistema interno.',
  },
  {
    q: '¿Hay prueba gratis real?',
    a: `Sí. Podés activar Rivapp con ${DEFAULT_TRIAL_DAYS} días de prueba para validar el flujo antes de tomar una decisión.`,
  },
];

const plans = [
  {
    title: 'Emprendedor',
    subtitle: 'Lo esencial para digitalizar la operación.',
    price: 30000,
    features: [
      'Menú Digital / Agenda Web',
      'Pedidos WhatsApp ilimitados',
      'Gestión de stock y servicios',
      'QR personalizado',
      'Soporte por email',
    ],
  },
  {
    title: 'Profesional',
    subtitle: 'La configuración recomendada para crecer.',
    price: 40000,
    recommended: true,
    features: [
      'Todo lo de Emprendedor',
      'Integración Mercado Pago (0% com.)',
      'Gestión de staff y riders',
      'Envíos calculados por KM',
      'Cupones y fidelización',
      'Métricas de venta avanzadas',
      'Soporte prioritario WhatsApp',
    ],
  },
  {
    title: 'Corporativo',
    subtitle: 'Para marcas, cadenas o necesidades especiales.',
    price: 'A medida',
    features: [
      'Múltiples sucursales',
      'Panel maestro centralizado',
      'Integraciones con ERP/sistemas',
      'Dominio propio (ej: tunegocio.com)',
      'Desarrollo de funciones extra',
      'Gerente de cuenta dedicado',
    ],
  },
];

const processSteps = [
  { n: '01', title: 'Te registrás', text: 'En un minuto tenés tu URL pública lista para compartir.' },
  { n: '02', title: 'Cargás tu operación', text: 'Productos o servicios, staff, horarios, zonas de envío.' },
  { n: '03', title: 'Recibís pedidos', text: 'Cobros directos, panel interno, ticket para el cliente.' },
  { n: '04', title: 'Medís y crecés', text: 'Métricas reales, fidelización, cupones y panel maestro.' },
];

function MobileMenu({ isOpen, onClose }) {
  const firstLinkRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstLinkRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/80 backdrop-blur-md" onClick={onClose} />
      <div className="absolute left-0 top-20 z-50 w-full border-b border-rule bg-ink">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-8">
          {[
            { to: '#soluciones', label: 'Soluciones' },
            { to: '#proceso', label: 'Proceso' },
            { to: '#planes', label: 'Planes' },
            { to: '#faq', label: 'Preguntas' },
          ].map((l, i) => (
            <a
              key={l.label}
              href={l.to}
              ref={i === 0 ? firstLinkRef : null}
              onClick={onClose}
              className="group flex items-baseline justify-between border-b border-rule py-5"
            >
              <span className="display text-4xl text-text">{l.label}</span>
              <span className="mono text-xs text-text-muted">0{i + 1}</span>
            </a>
          ))}
          <div className="mt-6 flex flex-col gap-3">
            <Button to="/login" variant="outline" size="lg" onClick={onClose}>
              Ingresar
            </Button>
            <Button to="/register" variant="acid" size="lg" onClick={onClose}>
              Empezar gratis <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function HeroConsole() {
  return (
    <div className="relative w-full">
      <div className="absolute -left-10 -top-10 hidden lg:block">
        <div className="mono rotate-[-4deg] text-[10px] uppercase tracking-[0.3em] text-acid">
          Panel operativo · Live
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 shadow-[var(--shadow-editorial)]">
        <div className="flex h-9 items-center justify-between border-b border-rule bg-ink-3 px-4">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-signal/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-acid/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-ml-soft/80" />
          </div>
          <div className="mono text-[10px] text-text-muted">{appConfig.appDomainLabel}/admin</div>
          <div className="mono text-[10px] text-text-subtle">v4.2</div>
        </div>

        <div className="grid grid-cols-[auto_1fr]">
          <div className="hidden w-48 flex-col gap-1 border-r border-rule bg-ink/60 p-4 md:flex">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-acid text-ink">
                <Rocket className="h-3.5 w-3.5" />
              </div>
              <span className="display text-lg">Rivapp</span>
            </div>
            <div className="flex items-center gap-2 rounded-[8px] bg-acid/12 px-2.5 py-2 text-xs font-medium text-acid">
              <LayoutDashboard className="h-3.5 w-3.5" /> Panel
            </div>
            {['Pedidos', 'Productos', 'Clientes', 'Métricas'].map((l) => (
              <div key={l} className="flex items-center gap-2 px-2.5 py-2 text-xs text-text-muted">
                <Package className="h-3.5 w-3.5" /> {l}
              </div>
            ))}
          </div>

          <div className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="eyebrow">Resumen · Abril</p>
                <h3 className="display mt-1 text-3xl text-text">
                  Dinero <em className="display-italic text-acid">directo</em>
                </h3>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-ml/15 px-3 py-1 text-[10px] font-medium text-ml-soft mono">
                <CreditCard className="h-3 w-3" /> Mercado Pago
              </div>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-3">
              {[
                ['Ingresos', '$128k', '+18%'],
                ['Pagados', '284', '+42'],
                ['Comisión', '0%', 'fijo'],
              ].map(([label, value, delta]) => (
                <div key={label} className="rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3">
                  <p className="eyebrow text-[9px]">{label}</p>
                  <p className="num mt-1 text-2xl font-semibold text-text">{value}</p>
                  <p className="mono mt-0.5 text-[10px] text-acid">{delta}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[var(--radius-md)] border border-rule bg-ink-3 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="eyebrow text-[10px]">Semana · L a D</p>
                <p className="mono text-[10px] text-text-muted">GMT-3</p>
              </div>
              <div className="grid h-32 grid-cols-7 items-end gap-2">
                {[40, 68, 48, 82, 58, 92, 70].map((h, i) => (
                  <div key={i} className="relative">
                    <div
                      className="w-full rounded-t-[3px] bg-gradient-to-t from-ml to-acid"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 -right-4 hidden rotate-[3deg] rounded-[var(--radius-md)] border border-rule-strong bg-paper px-4 py-3 shadow-[var(--shadow-lift)] md:block">
        <p className="mono text-[9px] uppercase tracking-[0.2em] text-ink-text-muted">Último pedido</p>
        <p className="display mt-0.5 text-xl text-ink-text">
          <em className="display-italic">Hamburguesa</em> triple
        </p>
        <p className="num mt-0.5 text-xs text-ink-text-muted">$12.400 · 14:32 · Pago MP</p>
      </div>
    </div>
  );
}

function DemoCard({ number, title, subtitle, href, signupHref, icon: Icon, description, features }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-8 transition-all hover:border-acid/40 md:p-10">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-acid/0 blur-3xl transition-all duration-700 group-hover:bg-acid/15" />

      <header className="flex items-start justify-between">
        <div>
          <Eyebrow>№ {number} · {subtitle}</Eyebrow>
          <h3 className="display mt-5 text-5xl text-text md:text-6xl">{title}</h3>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-rule-strong text-text-muted transition-all group-hover:border-acid group-hover:bg-acid group-hover:text-ink">
          <Icon className="h-5 w-5" />
        </div>
      </header>

      <p className="mt-6 max-w-md text-base leading-7 text-text-muted text-pretty">{description}</p>

      <Rule className="mt-8" />

      <ul className="mt-6 grid gap-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm text-text">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-10 flex flex-wrap gap-3">
        <Button to={signupHref} variant="acid" size="lg">
          Empezar gratis <ArrowRight className="h-4 w-4" />
        </Button>
        <Button to={href} variant="outline" size="lg">
          Ver demo <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}

function PriceCard({ title, subtitle, price, features, recommended }) {
  const priceLabel = typeof price === 'number' ? `$${price.toLocaleString('es-AR')}` : price;
  const contactUrl = getWhatsAppUrl(appConfig.supportWhatsApp, `Hola, estoy interesado en el plan ${title} de Rivapp`);

  return (
    <article
      className={`relative flex h-full flex-col rounded-[var(--radius-xl)] border p-8 md:p-10 ${
        recommended
          ? 'border-acid bg-ink-2 shadow-[var(--shadow-acid)]'
          : 'border-rule-strong bg-ink-2'
      }`}
    >
      {recommended && (
        <div className="absolute -top-3 left-8 flex items-center gap-1.5 rounded-full bg-acid px-3 py-1 text-[10px] mono uppercase tracking-[0.2em] text-ink">
          <Sparkles className="h-3 w-3" /> Más elegido
        </div>
      )}

      <Eyebrow tone={recommended ? 'acid' : 'muted'}>Plan</Eyebrow>
      <h3 className="display mt-3 text-5xl text-text">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-text-muted text-pretty">{subtitle}</p>

      <Rule className="mt-8" />

      <div className="mt-8 flex items-baseline gap-2">
        <span className={`display text-6xl ${recommended ? 'text-acid' : 'text-text'}`}>{priceLabel}</span>
        {typeof price === 'number' && <span className="mono text-xs text-text-subtle">/mes</span>}
      </div>
      <p className="mono mt-2 text-[11px] uppercase tracking-[0.2em] text-text-subtle">
        {typeof price === 'number' ? 'ARS · finales' : 'según alcance'}
      </p>

      <ul className="mt-10 flex-1 space-y-4">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm text-text">
            <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${recommended ? 'text-acid' : 'text-text-muted'}`} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button
        href={contactUrl || '/register'}
        target="_blank"
        rel="noopener noreferrer"
        variant={recommended ? 'acid' : 'outline'}
        size="lg"
        className="mt-10"
      >
        Empezar ahora <ArrowRight className="h-4 w-4" />
      </Button>
    </article>
  );
}

function FaqItem({ index, q, a }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="border-b border-rule">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-6 py-6 text-left transition-colors hover:text-acid"
      >
        <div className="flex items-start gap-5">
          <span className="mono mt-2 text-[10px] uppercase tracking-[0.2em] text-text-subtle">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="display text-2xl text-text md:text-3xl">{q}</span>
        </div>
        <ChevronDown
          className={`mt-3 h-5 w-5 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180 text-acid' : ''}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-6 pl-10 text-base leading-7 text-text-muted text-pretty">{a}</p>
        </div>
      </div>
    </div>
  );
}

function Marquee() {
  const items = [...marqueeItems, ...marqueeItems];
  return (
    <div className="relative overflow-hidden border-y border-rule bg-ink-2 py-6">
      <div className="flex w-max anim-ticker gap-12">
        {items.map((t, i) => (
          <div key={i} className="flex shrink-0 items-center gap-12">
            <span className="display text-3xl text-text">{t}</span>
            <span className="h-2 w-2 rounded-full bg-acid" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink text-text">
      <div className="pointer-events-none fixed inset-0 z-0 grain" aria-hidden />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute left-[-14%] top-[-20%] h-[60vw] w-[60vw] rounded-full bg-acid/[0.035] blur-[140px]" />
        <div className="absolute bottom-[-22%] right-[-12%] h-[50vw] w-[50vw] rounded-full bg-ml/[0.07] blur-[140px]" />
      </div>

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-rule bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-acid text-ink">
              <Rocket className="h-4 w-4" />
            </div>
            <span className="display text-2xl tracking-tight text-text">Rivapp</span>
            <span className="hidden mono rounded-sm border border-rule px-1.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-text-muted md:inline">
              v4 · AR
            </span>
          </Link>

          <nav className="hidden items-center gap-10 md:flex">
            {[
              ['#soluciones', 'Soluciones'],
              ['#proceso', 'Proceso'],
              ['#planes', 'Planes'],
              ['#faq', 'Preguntas'],
            ].map(([href, label], i) => (
              <a
                key={label}
                href={href}
                className="mono text-xs uppercase tracking-[0.18em] text-text-muted transition-colors hover:text-text"
              >
                <span className="text-acid">0{i + 1}/</span> {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="mono hidden text-xs uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-text sm:inline"
            >
              Ingresar
            </Link>
            <Button to="/register" variant="acid" size="pill" className="hidden sm:inline-flex">
              Prueba gratis <ArrowRight className="h-4 w-4" />
            </Button>
            <button
              className="p-2 text-text md:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menú"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="px-6 pb-24 pt-32 md:pb-32 md:pt-40">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-center justify-between anim-rise">
              <Eyebrow>
                <Hash className="h-3 w-3" />
                Edición № 042 · Abril 2026
              </Eyebrow>
              <Eyebrow tone="acid" className="hidden md:inline-flex">
                14 días de prueba · sin tarjeta
              </Eyebrow>
            </div>

            <div className="grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <h1 className="display anim-rise text-text text-[clamp(3.5rem,9vw,8.5rem)] leading-[0.92]">
                  Tu negocio<br />
                  <em className="display-italic">online,</em> sin<br />
                  <span className="relative inline-block text-acid">
                    comisiones
                    <svg
                      className="absolute -bottom-2 left-0 w-full"
                      viewBox="0 0 300 12"
                      fill="none"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M2 8 C 75 2, 150 2, 298 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  .
                </h1>

                <div className="anim-rise d-2 mt-12 grid max-w-xl gap-6">
                  <p className="text-lg leading-8 text-text-muted text-pretty md:text-xl">
                    Rivapp reemplaza el caos de WhatsApp, planillas y cuaderno con una experiencia pública
                    <em className="display-italic text-text"> profesional</em> y un panel interno listo para
                    operar pedidos o turnos.
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button to="/register" variant="acid" size="xl">
                      Comenzar gratis <ArrowRight className="h-5 w-5" />
                    </Button>
                    <Button to="/demo" variant="outline" size="xl">
                      Ver demo delivery
                    </Button>
                  </div>
                </div>

                <div className="anim-rise d-3 mt-14 grid max-w-xl grid-cols-2 gap-10 border-t border-rule pt-8">
                  <div>
                    <p className="num text-4xl text-text">0%</p>
                    <p className="mono mt-1 text-[11px] uppercase tracking-[0.2em] text-text-subtle">
                      Comisión por venta
                    </p>
                  </div>
                  <div>
                    <p className="num text-4xl text-text">14d</p>
                    <p className="mono mt-1 text-[11px] uppercase tracking-[0.2em] text-text-subtle">
                      Prueba sin tarjeta
                    </p>
                  </div>
                </div>
              </div>

              <div className="anim-rise d-4 lg:pt-10">
                <HeroConsole />
              </div>
            </div>
          </div>
        </section>

        <Marquee />

        {/* Trust */}
        <section className="px-6 py-24 md:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.4fr_0.6fr] lg:gap-20">
              <div>
                <Eyebrow>Por qué Rivapp</Eyebrow>
                <h2 className="display mt-5 text-5xl text-text md:text-6xl">
                  Tecnología global,<br />
                  <em className="display-italic text-acid">corazón local.</em>
                </h2>
              </div>
              <p className="text-lg leading-8 text-text-muted text-pretty md:text-xl lg:pt-4">
                Sabemos lo difícil que es emprender en Argentina. Rivapp busca darte una herramienta que esté
                realmente de tu lado — no una más que te cobre por existir.
              </p>
            </div>

            <Rule className="mt-16" label="Tres apuestas" />

            <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-rule md:grid-cols-3">
              {trustItems.map((item, i) => (
                <article key={item.title} className="flex flex-col gap-6 bg-ink-2 p-10">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rule-strong text-acid">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="mono text-xs text-text-subtle">0{i + 1} / 03</span>
                  </div>
                  <div>
                    <Eyebrow>{item.kicker}</Eyebrow>
                    <h3 className="display mt-3 text-3xl text-text">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-text-muted text-pretty">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions */}
        <section id="soluciones" className="scroll-mt-24 px-6 py-24 md:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <Eyebrow>Verticales</Eyebrow>
                <h2 className="display mt-5 text-5xl text-text md:text-7xl">
                  ¿Cuál es<br /><em className="display-italic">tu negocio</em>?
                </h2>
              </div>
              <p className="max-w-md text-base leading-7 text-text-muted text-pretty lg:pb-3">
                Dos demos reales, dos formas de operar. Elegí la que más se parece a lo que hacés todos los
                días.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 md:gap-8">
              {demos.map((demo) => (
                <DemoCard key={demo.title} {...demo} />
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section id="proceso" className="scroll-mt-24 bg-paper px-6 py-24 text-ink-text md:py-32 grain grain-paper relative">
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.45fr_0.55fr] lg:gap-20">
              <div>
                <Eyebrow tone="ink">Proceso</Eyebrow>
                <h2 className="display mt-5 text-5xl md:text-7xl">
                  De caos<br />a <em className="display-italic">claridad,</em><br />
                  en cuatro pasos.
                </h2>
              </div>
              <p className="text-lg leading-8 text-ink-text-muted text-pretty md:text-xl lg:pt-4">
                Sin migraciones eternas ni consultorías. Activás tu operación, empezás a recibir y después
                ajustás a medida.
              </p>
            </div>

            <div className="mt-16 grid gap-px bg-[color:var(--color-rule-paper)] md:grid-cols-4">
              {processSteps.map((s) => (
                <div key={s.n} className="flex flex-col gap-8 bg-paper p-8 md:p-10">
                  <div className="flex items-baseline justify-between">
                    <span className="num text-6xl font-light text-ink-text">{s.n}</span>
                    <span className="mono text-[10px] uppercase tracking-[0.22em] text-ink-text-muted">
                      paso
                    </span>
                  </div>
                  <div>
                    <h3 className="display text-3xl">{s.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-ink-text-muted">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 flex flex-col items-start gap-6 border-t border-[color:var(--color-rule-paper)] pt-10 md:flex-row md:items-center md:justify-between">
              <p className="display text-3xl md:text-4xl">
                Listo en <em className="display-italic">menos de una tarde.</em>
              </p>
              <Button to="/register" variant="ink" size="xl">
                Activar Rivapp <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* No commissions manifesto */}
        <section className="px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-[var(--radius-2xl)] border border-rule-strong bg-ink-2 p-10 md:p-16">
              <div className="flex items-start justify-between gap-6">
                <Eyebrow>Manifiesto</Eyebrow>
                <Percent className="h-5 w-5 text-signal" />
              </div>

              <h2 className="display mt-8 text-5xl leading-[0.95] text-text md:text-7xl">
                Tu esfuerzo es<br />
                <em className="display-italic text-acid">100% tuyo.</em>
              </h2>

              <p className="mt-10 max-w-2xl text-lg leading-8 text-text-muted text-pretty md:text-xl">
                Rivapp no se queda con un porcentaje de cada movimiento. Cobrás directo, operás mejor y
                mantenés el control — sin cuentas intermedias, sin retenciones opacas.
              </p>

              <Rule className="mt-12" />

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button to="/demo" variant="acid" size="lg">
                  Ver demo pedidos <ArrowUpRight className="h-4 w-4" />
                </Button>
                <Button to="/demo-turnos" variant="outline" size="lg">
                  Ver demo turnos <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="planes" className="scroll-mt-24 px-6 py-24 md:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <Eyebrow>Planes</Eyebrow>
                <h2 className="display mt-5 text-5xl text-text md:text-7xl">
                  Una estructura<br /><em className="display-italic">para cada etapa.</em>
                </h2>
              </div>
              <p className="max-w-md text-base leading-7 text-text-muted text-pretty lg:pb-3">
                Abono mensual, sin comisión por venta. Cambiás de plan cuando tu operación crece.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
              {plans.map((plan) => (
                <PriceCard key={plan.title} {...plan} />
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-24 px-6 py-24 md:py-32">
          <div className="mx-auto max-w-4xl">
            <Eyebrow>Preguntas</Eyebrow>
            <h2 className="display mt-5 text-5xl text-text md:text-6xl">
              Dudas <em className="display-italic">honestas,</em><br />
              respuestas también.
            </h2>

            <div className="mt-16">
              {faqs.map((item, i) => (
                <FaqItem key={item.q} index={i} q={item.q} a={item.a} />
              ))}
            </div>

            <div className="mt-16 flex flex-col items-start gap-6 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-8 md:flex-row md:items-center md:justify-between md:p-10">
              <div>
                <h3 className="display text-3xl text-text md:text-4xl">
                  ¿Queda <em className="display-italic">algo</em> sin responder?
                </h3>
                <p className="mt-2 text-sm text-text-muted">Escribinos por WhatsApp y te contestamos hoy.</p>
              </div>
              <Button
                href={
                  getWhatsAppUrl(appConfig.supportWhatsApp, 'Hola, tengo una consulta sobre Rivapp.') || '/register'
                }
                target="_blank"
                rel="noopener noreferrer"
                variant="acid"
                size="lg"
              >
                Abrir WhatsApp <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-rule bg-ink">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-acid text-ink">
                  <Rocket className="h-4 w-4" />
                </div>
                <span className="display text-3xl text-text">Rivapp</span>
              </div>
              <p className="mt-4 max-w-md text-sm text-text-muted">
                Sistema operativo para negocio local. <em className="display-italic text-text">Hecho en Argentina.</em>
              </p>
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-6">
              <div>
                <p className="eyebrow mb-4">Producto</p>
                <ul className="grid gap-2 text-sm text-text-muted">
                  <li><Link to="/demo" className="hover:text-text">Demo pedidos</Link></li>
                  <li><Link to="/demo-turnos" className="hover:text-text">Demo turnos</Link></li>
                  <li><Link to="/register" className="hover:text-text">Prueba gratis</Link></li>
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-4">Cuenta</p>
                <ul className="grid gap-2 text-sm text-text-muted">
                  <li><Link to="/login" className="hover:text-text">Ingresar</Link></li>
                  <li><Link to="/register" className="hover:text-text">Crear cuenta</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-rule">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 md:flex-row md:items-center md:justify-between">
              <p className="mono text-[11px] uppercase tracking-[0.2em] text-text-subtle">
                © {new Date().getFullYear()} Rivapp · {appConfig.appDomainLabel}
              </p>
              <p className="mono text-[11px] uppercase tracking-[0.2em] text-text-subtle">
                <Calendar className="mr-2 inline h-3 w-3" /> Abono fijo · Sin comisión por venta
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* WhatsApp FAB */}
      <a
        href={
          getWhatsAppUrl(appConfig.supportWhatsApp, 'Hola, vi la web de Rivapp y tengo una consulta.') || '/register'
        }
        target="_blank"
        rel="noopener noreferrer"
        className="group fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-acid px-4 py-3 font-sans text-sm font-semibold text-ink shadow-[0_20px_50px_-12px_rgba(208,255,0,0.55)] transition-transform hover:-translate-y-0.5 md:px-5 md:py-4"
        aria-label="Consultar por WhatsApp"
      >
        <MessageCircle size={20} />
        <span className="hidden md:inline">Consultar</span>
      </a>
    </div>
  );
}
