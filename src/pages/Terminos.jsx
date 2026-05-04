import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Eyebrow from '../components/shared/ui/Eyebrow';
import Rule from '../components/shared/ui/Rule';

const LAST_UPDATED = '2026-05-04';

// Template legal genérico para SaaS B2B en Argentina. Revisar y completar
// los datos del titular antes de salir a producción.
export default function Terminos() {
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
            Términos y <em className="display-italic text-acid">Condiciones</em>
          </h1>
          <p className="mono mt-4 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
            Última actualización · {LAST_UPDATED}
          </p>
        </div>

        <Rule className="my-10" />

        <div className="space-y-10 text-sm leading-7 text-text-muted">
          <Section title="1. Sobre Rivapp">
            <p>
              Rivapp es un servicio SaaS (Software as a Service) que provee herramientas de gestión de
              pedidos, turnos, agenda, equipo y cobros a negocios locales en Argentina. Al registrarte y
              utilizar el servicio aceptás estos Términos.
            </p>
            <p className="mt-3">
              <span className="text-text">Titular del servicio:</span> Riva Estudio. Contacto:{' '}
              <span className="text-text">soporte@rivapp.com.ar</span> (completar con datos reales).
            </p>
          </Section>

          <Section title="2. Cuenta y responsabilidad">
            <p>
              Para usar Rivapp necesitás crear una cuenta proporcionando un email válido. Sos responsable
              de mantener la confidencialidad de tus credenciales y de toda actividad realizada bajo tu
              cuenta. Avisanos inmediatamente si sospechás un acceso no autorizado.
            </p>
            <p className="mt-3">
              Para registrarte tenés que ser mayor de 18 años y estar habilitado legalmente para celebrar
              contratos. Podés invitar miembros de tu equipo desde el panel de administración; sos
              responsable del uso que hagan del servicio.
            </p>
          </Section>

          <Section title="3. Planes, pagos y prueba">
            <p>
              Rivapp ofrece distintos planes con precios mensuales en pesos argentinos, listados en
              nuestra página principal. La suscripción se renueva mensualmente y se cobra a través de
              Mercado Pago.
            </p>
            <p className="mt-3">
              Podés cancelar tu suscripción en cualquier momento desde el panel o contactando a soporte;
              la cancelación tiene efecto al final del período facturado vigente y no se devuelven
              importes proporcionales. El período de prueba gratuita es sin cargo y se convierte en plan
              pago solo si activás explícitamente una suscripción.
            </p>
          </Section>

          <Section title="4. Uso aceptable">
            <p>No se permite usar Rivapp para:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Vender productos o servicios prohibidos por la legislación argentina.</li>
              <li>Spam, phishing o cualquier tipo de comunicación engañosa hacia tus clientes.</li>
              <li>Intentar comprometer la seguridad, integridad o disponibilidad del servicio.</li>
              <li>Usar el servicio para actividades ilícitas o que infrinjan derechos de terceros.</li>
            </ul>
            <p className="mt-3">
              Podemos suspender cuentas que incumplan estas reglas, con aviso previo cuando sea posible.
            </p>
          </Section>

          <Section title="5. Datos del negocio y de los clientes finales">
            <p>
              Los datos cargados en Rivapp (productos, agenda, clientes finales, pedidos) son tuyos. Los
              procesamos solamente para prestarte el servicio y mejorarlo. No los vendemos a terceros.
            </p>
            <p className="mt-3">
              Vos sos el responsable del tratamiento de los datos personales de tus clientes finales en
              los términos de la Ley N° 25.326 de Protección de Datos Personales. Rivapp actúa como
              encargado del tratamiento. Más detalles en nuestra{' '}
              <Link to="/privacidad" className="text-acid hover:underline">
                Política de Privacidad
              </Link>
              .
            </p>
          </Section>

          <Section title="6. Disponibilidad y soporte">
            <p>
              Hacemos lo razonable para mantener Rivapp disponible 24/7, pero no garantizamos
              disponibilidad ininterrumpida. Podemos realizar tareas de mantenimiento programado avisando
              con anticipación. Brindamos soporte en horario comercial por email y WhatsApp.
            </p>
          </Section>

          <Section title="7. Limitación de responsabilidad">
            <p>
              En la medida máxima permitida por la ley, la responsabilidad total de Rivapp por reclamos
              relacionados con el servicio se limita al importe abonado por vos en los últimos 3 meses.
              No nos responsabilizamos por lucro cesante, pérdida de oportunidades o daños indirectos.
            </p>
          </Section>

          <Section title="8. Modificaciones">
            <p>
              Podemos actualizar estos Términos para reflejar cambios en el servicio o en la legislación.
              Te avisaremos por email o desde el panel cuando haya cambios materiales con al menos 15
              días de anticipación.
            </p>
          </Section>

          <Section title="9. Ley aplicable y jurisdicción">
            <p>
              Estos Términos se rigen por la legislación de la República Argentina. Cualquier
              controversia se resolverá ante los tribunales ordinarios con asiento en la Ciudad Autónoma
              de Buenos Aires (o ajustar a la jurisdicción real del titular).
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
