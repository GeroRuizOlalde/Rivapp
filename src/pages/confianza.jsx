import { MapPin, ShieldCheck, MessageCircle } from 'lucide-react';

export default function TrustSection() {
  return (
    <section className="py-20 bg-black border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* TÍTULO DE LA SECCIÓN */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Tecnología Global, <span className="text-[#d0ff00]">Soporte Local.</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            A diferencia de las apps multinacionales, nosotros estamos acá. 
            Hablás con personas reales, no con bots.
          </p>
        </div>

        {/* GRILLA DE CONFIANZA */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* 1. IDENTIDAD LOCAL */}
          <div className="bg-[#111] p-8 rounded-3xl border border-white/5 hover:border-[#d0ff00]/30 transition-colors">
            <div className="w-12 h-12 bg-[#d0ff00]/10 rounded-xl flex items-center justify-center mb-6">
              <MapPin className="text-[#d0ff00]" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Hecho en San Juan</h3>
            <p className="text-gray-500 text-sm">
              Desarrollado en Rivadavia por <strong>Riva Estudio</strong>. 
              Conocemos el mercado local y las necesidades de los comerciantes de la zona.
            </p>
          </div>

          {/* 2. SIN LETRA CHICA (SEGURIDAD) */}
          <div className="bg-[#111] p-8 rounded-3xl border border-white/5 hover:border-[#d0ff00]/30 transition-colors">
            <div className="w-12 h-12 bg-[#d0ff00]/10 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="text-[#d0ff00]" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Datos Seguros</h3>
            <p className="text-gray-500 text-sm">
              Tu dinero va directo a tu cuenta (MercadoPago/Efectivo). 
              Nosotros no tocamos tus ventas ni cobramos comisiones ocultas.
            </p>
          </div>

          {/* 3. SOPORTE DIRECTO */}
          <div className="bg-[#111] p-8 rounded-3xl border border-white/5 hover:border-[#d0ff00]/30 transition-colors">
            <div className="w-12 h-12 bg-[#d0ff00]/10 rounded-xl flex items-center justify-center mb-6">
              <MessageCircle className="text-[#d0ff00]" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Soporte por WhatsApp</h3>
            <p className="text-gray-500 text-sm">
              ¿Tenés una duda? Te respondemos por WhatsApp al instante. 
              Configuración inicial asistida para que arranques en 24hs.
            </p>
          </div>

        </div>

        {/* PRUEBA SOCIAL "BETA" (Si tenés algún cliente piloto, activá esto) */}
        {/* <div className="mt-20 pt-10 border-t border-white/5 text-center">
          <p className="text-gray-500 text-sm mb-6">CONFÍAN EN NOSOTROS</p>
          <div className="flex justify-center items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
             <img src="/logos/cliente1.png" alt="San Juan Delivery" className="h-12" />
             <img src="/logos/cliente2.png" alt="Otro Cliente" className="h-12" />
          </div>
        </div> 
        */}

      </div>
    </section>
  );
}