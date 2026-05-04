import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Eyebrow from '../components/shared/ui/Eyebrow';
import Rule from '../components/shared/ui/Rule';

const LAST_UPDATED = '2026-05-04';

// Política de privacidad genérica para SaaS B2B en Argentina, alineada con
// Ley N° 25.326. Revisar y completar datos del titular antes de publicar.
export default function Privacidad() {
  return (
    <div className="relative min-h-screen bg-ink text-text">
      <div className="pointer-events-none absolute inset-0 z-0 grain" aria-hidden />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Link
          to="/"
          className="mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </Link>

        <div className="mt-10">
          <Eyebrow>Legal</Eyebrow>
          <h1 className="display mt-3 text-5xl md:text-6xl">
            Política de <em className="display-italic text-acid">Privacidad</em>
          </h1>
          <p className="mono mt-4 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
            Última actualización · {LAST_UPDATED}
          </p>
        </div>

        <Rule className="my-10" />

        <div className="space-y-10 text-sm leading-7 text-text-muted">
          <Section title="Resumen">
            <p>
              Rivapp respeta tu privacidad. Tratamos tus datos personales y los datos cargados en tu
              cuenta solo para prestarte el servicio. No los vendemos. Cumplimos con la Ley N° 25.326 de
              Protección de Datos Personales.
            </p>
          </Section>

          <Section title="1. Responsable del tratamiento">
            <p>
              Riva Estudio (titular del servicio Rivapp). Domicilio y datos de contacto:{' '}
              <span className="text-text">completar antes de publicar</span>. Email para consultas de
              privacidad: <span className="text-text">soporte@rivapp.com.ar</span>.
            </p>
          </Section>

          <Section title="2. Qué datos recolectamos">
            <p className="mb-3">
              <span className="text-text">Datos de cuenta del dueño del negocio:</span> email, nombre,
              teléfono, contraseña (almacenada con hash), información del local (nombre, slug, dirección,
              logo).
            </p>
            <p className="mb-3">
              <span className="text-text">Datos operativos cargados por vos:</span> menú, servicios,
              precios, agenda, miembros del equipo, sucursales, riders, cupones.
            </p>
            <p className="mb-3">
              <span className="text-text">Datos de tus clientes finales:</span> nombre, teléfono, email
              opcional, dirección de entrega (cuando aplica), historial de pedidos o turnos. Estos datos
              los cargás vos al recibir reservas o pedidos en tu local; sos su responsable directo.
            </p>
            <p>
              <span className="text-text">Datos técnicos:</span> dirección IP, tipo de dispositivo,
              cookies necesarias para mantener tu sesión iniciada y errores capturados (solo cuando
              ocurren) para diagnosticar problemas.
            </p>
          </Section>

          <Section title="3. Para qué usamos los datos">
            <ul className="list-disc space-y-2 pl-5">
              <li>Prestar el servicio Rivapp y sus funciones (gestión, cobros, agenda, etc.).</li>
              <li>Procesar pagos a través de Mercado Pago.</li>
              <li>Notificarte sobre cambios en tu cuenta o el servicio.</li>
              <li>Mejorar el servicio analizando uso agregado y errores.</li>
              <li>Cumplir obligaciones legales (impositivas, de respuesta a autoridades, etc.).</li>
            </ul>
          </Section>

          <Section title="4. Con quién compartimos los datos">
            <p>
              Solo compartimos datos con proveedores que nos prestan infraestructura, en la medida
              necesaria para el servicio:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <span className="text-text">Supabase</span> — base de datos, autenticación y storage.
              </li>
              <li>
                <span className="text-text">Vercel</span> — hosting de la aplicación web.
              </li>
              <li>
                <span className="text-text">Mercado Pago</span> — procesamiento de cobros.
              </li>
              <li>
                <span className="text-text">Sentry</span> — monitoreo de errores (solo metadata técnica).
              </li>
            </ul>
            <p className="mt-3">
              No vendemos tus datos ni los compartimos con terceros para fines publicitarios.
            </p>
          </Section>

          <Section title="5. Tus derechos (Ley 25.326)">
            <p>Como titular de tus datos personales tenés derecho a:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <span className="text-text">Acceso:</span> saber qué datos tenemos sobre vos.
              </li>
              <li>
                <span className="text-text">Rectificación:</span> corregir datos inexactos.
              </li>
              <li>
                <span className="text-text">Supresión:</span> pedirnos que eliminemos tus datos cuando ya
                no sean necesarios o retires tu consentimiento.
              </li>
              <li>
                <span className="text-text">Oposición:</span> oponerte a tratamientos específicos.
              </li>
            </ul>
            <p className="mt-3">
              Para ejercer estos derechos escribinos a soporte@rivapp.com.ar. Respondemos dentro de los
              10 días corridos. La autoridad de control en Argentina es la Agencia de Acceso a la
              Información Pública (AAIP).
            </p>
          </Section>

          <Section title="6. Cuánto tiempo conservamos los datos">
            <p>
              Conservamos los datos mientras tu cuenta esté activa. Si cancelás tu cuenta, eliminamos los
              datos operativos dentro de los 90 días, salvo que tengamos obligación legal de
              conservarlos por más tiempo (por ejemplo, registros contables).
            </p>
          </Section>

          <Section title="7. Seguridad">
            <p>
              Aplicamos medidas técnicas y organizativas razonables para proteger tus datos:
              comunicaciones cifradas (HTTPS), autenticación, control de acceso por roles, separación
              multi-tenant a nivel de base de datos (Row Level Security) y monitoreo de errores. Ningún
              sistema es 100% seguro; te recomendamos elegir contraseñas robustas y avisarnos ante
              cualquier sospecha.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              Usamos cookies estrictamente necesarias para mantener tu sesión iniciada y para que la
              aplicación funcione. No usamos cookies publicitarias ni de tracking de terceros.
            </p>
          </Section>

          <Section title="9. Cambios a esta política">
            <p>
              Podemos actualizar esta política para reflejar cambios en el servicio o en la legislación.
              Te avisaremos por email o desde el panel cuando haya cambios materiales con al menos 15
              días de anticipación.
            </p>
          </Section>
        </div>

        <Rule className="my-10" />

        <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
          ¿Dudas? Escribinos a soporte@rivapp.com.ar
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="display text-2xl text-text">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
