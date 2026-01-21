import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../supabase/client';
import { 
  Calendar as CalendarIcon, Clock, ChevronRight, ChevronLeft, CheckCircle, 
  Loader2, User, Phone, MapPin, Store, Users, Tag, CreditCard, Banknote, Check, Copy 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// COMPONENTE DE OPCIÓN DE PAGO
const PaymentOption = ({ id, icon: Icon, label, selected, onSelect, color, customColor }) => {
    const isSelected = selected === id;
    const activeBorderColor = customColor || color;
    const activeIconColor = customColor || color;
    const activeBgClass = isSelected ? 'bg-[#1a1a1a] border-2 text-white' : 'bg-[#1a1a1a] border-white/5 text-gray-500';

    return (
        <button 
            onClick={() => onSelect(id)} 
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${activeBgClass}`} 
            style={isSelected ? {borderColor: activeBorderColor} : {}}
        >
            <Icon size={24} style={isSelected ? {color: activeIconColor} : {}} />
            <span className="text-xs font-bold">{label}</span>
        </button> 
    );
};

export default function BookingHome() {
  const { store } = useStore();
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]); 
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); 
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [customerData, setCustomerData] = useState({ name: '', phone: '' });

  // LOGICA DE CUPONES Y PAGO
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); 
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mercadopago'); 
  const [copied, setCopied] = useState(false);

  // DETECTAR PAGO EXITOSO AL VOLVER
  useEffect(() => {
      const query = new URLSearchParams(window.location.search);
      if (query.get('status') === 'success') {
          window.history.replaceState({}, document.title, window.location.pathname);
          alert("¡Pago Recibido! 🚀 Tu turno ha sido confirmado.");
          setStep(1); 
      }
  }, []);

  useEffect(() => {
    if (!store) return;
    const fetchData = async () => {
      const { data: srvData } = await supabase.from('services').select('*').eq('store_id', store.id).eq('active', true).order('price');
      if (srvData) setServices(srvData);
      const { data: staffData } = await supabase.from('staff').select('*').eq('store_id', store.id).eq('active', true);
      if (staffData) setStaffList(staffData);
      const { data: schedData } = await supabase.from('store_schedules').select('*').eq('store_id', store.id);
      if (schedData) setSchedules(schedData);
      setLoading(false);
    };
    fetchData();
  }, [store]);

  const changeMonth = (delta) => {
      const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + delta));
      setCurrentDate(new Date(newDate));
  };

  const nextStepAfterService = () => { if (store.enable_staff_selection && staffList.length > 0) setStep(2); else { setSelectedStaff(null); setStep(3); } };
  const prevStepFromDate = () => { if (store.enable_staff_selection && staffList.length > 0) setStep(2); else setStep(1); };

  // 🟢 CALCULAR CUPOS (CORREGIDO: FILTRA HORARIOS PASADOS)
  useEffect(() => {
    const calculateAvailability = async () => {
        if (!selectedDate || !selectedService) return;
        
        const dateObj = new Date(selectedDate + 'T00:00:00');
        const dayIndex = dateObj.getDay(); 
        const daySchedule = schedules.find(s => s.day_of_week === dayIndex);
        
        if (!daySchedule || daySchedule.is_closed) { setAvailableSlots([]); return; }

        const startOfDay = `${selectedDate}T00:00:00`;
        const endOfDay = `${selectedDate}T23:59:59`;
        
        // Traemos TODOS los turnos del día
        const { data: existingApts } = await supabase
            .from('appointments')
            .select('start_time, staff_id')
            .eq('store_id', store.id)
            .gte('start_time', startOfDay)
            .lte('start_time', endOfDay)
            .neq('status', 'cancelado');

        const slots = [];
        let currentTime = new Date(`${selectedDate}T${daySchedule.open_time}`);
        const endTime = new Date(`${selectedDate}T${daySchedule.close_time}`);
        const durationMs = selectedService.duration_minutes * 60000;
        const now = new Date(); // Hora actual para comparar

        // Definir límite de simultaneidad
        let limit = 1;
        if (selectedStaff) {
            limit = 1; 
        } else {
            // Si es sin preferencia, usamos el límite global o la cantidad de staff
            limit = (store.enable_multislots && store.max_concurrent_slots) 
                ? store.max_concurrent_slots 
                : (staffList.length > 0 ? staffList.length : 1);
        }

        while (currentTime.getTime() + durationMs <= endTime.getTime()) {
            
            // 🟢 FILTRO DE TIEMPO PASADO
            // Si la fecha seleccionada es HOY y la hora del slot es menor a AHORA, saltamos
            if (currentTime < now) {
                currentTime = new Date(currentTime.getTime() + durationMs);
                continue; // Pasamos al siguiente horario
            }

            const timeStr = currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
            // Asegurar formato HH:mm (ej: 09:00)
            const formattedTime = timeStr.length === 4 ? `0${timeStr}` : timeStr;
            
            // Contar ocupados en este slot
            const busyCount = existingApts.filter(apt => {
                const aptDate = new Date(apt.start_time);
                const aptStr = aptDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
                const aptFormatted = aptStr.length === 4 ? `0${aptStr}` : aptStr;
                
                if (aptFormatted === formattedTime) {
                    if (selectedStaff) return apt.staff_id === selectedStaff.id;
                    return true; // Sin preferencia cuenta todos
                }
                return false;
            }).length;

            const isFull = busyCount >= limit;
            const remaining = limit - busyCount;

            slots.push({ time: formattedTime, isFull: isFull, remaining: remaining });
            currentTime = new Date(currentTime.getTime() + durationMs);
        }
        
        setAvailableSlots(slots);
        setSelectedTime(''); 
    };

    calculateAvailability();
  }, [selectedDate, selectedService, schedules, store, selectedStaff, staffList]);

  const getDaysInMonth = (date) => { const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); const first = new Date(date.getFullYear(), date.getMonth(), 1).getDay(); const arr = Array(first).fill(null); for (let i = 1; i <= days; i++) arr.push(new Date(date.getFullYear(), date.getMonth(), i)); return arr; };
  const isDateDisabled = (dateObj) => { if (!dateObj) return true; const today = new Date(); today.setHours(0,0,0,0); if (dateObj < today) return true; const dayIndex = dateObj.getDay(); const schedule = schedules.find(s => s.day_of_week === dayIndex); if (schedule && schedule.is_closed) return true; return false; };
  const handleDateClick = (dateObj) => { if (!dateObj || isDateDisabled(dateObj)) return; const y = dateObj.getFullYear(); const m = String(dateObj.getMonth() + 1).padStart(2, '0'); const d = String(dateObj.getDate()).padStart(2, '0'); setSelectedDate(`${y}-${m}-${d}`); };

  const validateCoupon = async () => {
      if(!couponCode) return;
      setValidatingCoupon(true);
      const { data } = await supabase.from('coupons').select('*').eq('store_id', store.id).eq('code', couponCode.toUpperCase()).eq('active', true).single();
      if(data) { setAppliedCoupon(data); } else { alert("Cupón inválido o expirado"); setAppliedCoupon(null); }
      setValidatingCoupon(false);
  };

  const copyAlias = () => { navigator.clipboard.writeText(store?.cbu_alias || "ALIAS"); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  // 🟢 CONFIRMACIÓN Y PAGO (Con Asignación Automática)
  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedService || !customerData.name || !customerData.phone) return;
    setSaving(true);
    
    try {
        const isoStartDateTime = `${selectedDate}T${selectedTime}:00`; 
        const startDateObj = new Date(isoStartDateTime);
        const endDateObj = new Date(startDateObj.getTime() + selectedService.duration_minutes * 60000);
        const finalPrice = appliedCoupon ? selectedService.price * (1 - appliedCoupon.discount/100) : selectedService.price;

        // 🟢 LÓGICA DE ASIGNACIÓN AUTOMÁTICA ("MAGIC ASSIGN")
        let finalStaffId = selectedStaff ? selectedStaff.id : null;

        if (!finalStaffId) {
            // 1. Buscamos turnos existentes en ESE horario exacto
            const { data: busyApts } = await supabase
                .from('appointments')
                .select('staff_id')
                .eq('store_id', store.id)
                .eq('start_time', startDateObj.toISOString()) 
                .neq('status', 'cancelado');

            const busyStaffIds = busyApts.map(a => a.staff_id);

            // 2. Filtramos el equipo: (Todos - Ocupados)
            const availableStaff = staffList.filter(s => !busyStaffIds.includes(s.id));

            if (availableStaff.length > 0) {
                // Elegimos al primero disponible
                finalStaffId = availableStaff[0].id;
            } else {
                alert("¡Ups! Ese horario acaba de ocuparse por completo. Por favor elige otro.");
                setSaving(false);
                return;
            }
        }

        // 1. Guardar Turno
        const { data: newApt, error } = await supabase.from('appointments').insert([{
            store_id: store.id,
            service_id: selectedService.id,
            staff_id: finalStaffId, // Nunca null
            customer_name: customerData.name,
            customer_phone: customerData.phone,
            start_time: startDateObj.toISOString(),
            end_time: endDateObj.toISOString(),
            status: 'pendiente', 
            price_paid: finalPrice,
            coupon_code: appliedCoupon ? appliedCoupon.code : null,
            payment_method: paymentMethod 
        }]).select().single();

        if (error) throw error;

        // 2. MERCADO PAGO
        if (paymentMethod === 'mercadopago') {
            const { data: mpData, error: mpError } = await supabase.functions.invoke('create-order-preference', {
                body: JSON.stringify({
                    store_id: store.id,
                    items: [{
                        name: selectedService.name,
                        price: finalPrice,
                        quantity: 1
                    }],
                    order_id: newApt.id,
                    domain_url: window.location.origin,
                    type: 'appointment'
                }),
                headers: { "Content-Type": "application/json" }
            });

            if (mpError) {
                console.error("Error MP:", mpError);
                alert("Error conectando con Mercado Pago. Reserva guardada.");
            } else if (mpData?.init_point) {
                window.location.href = mpData.init_point;
                return; 
            }
        }

        // 3. WHATSAPP
        const assignedStaffName = staffList.find(s => s.id === finalStaffId)?.name || "Staff";
        const [y, m, d] = selectedDate.split('-').map(Number);
        const dateStr = new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
        
        let text = `Hola *${store.name}*! 👋%0A%0AQuiero confirmar mi turno:%0A%0A👤 *Cliente:* ${customerData.name}%0A✂️ *Servicio:* ${selectedService.name}%0A`;
        text += `💈 *Profesional:* ${assignedStaffName}%0A`;
        text += `📅 *Fecha:* ${dateStr}%0A⏰ *Hora:* ${selectedTime} hs`;
        if(appliedCoupon) text += `%0A🎟️ *Cupón:* ${appliedCoupon.code} (-${appliedCoupon.discount}%)%0A💰 *Total:* $${finalPrice}`;
        text += `%0A💳 *Pago:* ${paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'En el Local'}`;

        window.open(`https://wa.me/${store.phone || ''}?text=${text}`, '_blank');
        
        alert("¡Turno solicitado con éxito!");
        setStep(1); setSelectedDate(null); setSelectedTime(''); setSelectedStaff(null); setCustomerData({ name: '', phone: '' }); setAppliedCoupon(null); setCouponCode('');

    } catch (error) { console.error(error); alert("Error al reservar: " + error.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-blue-500"/></div>;
  const currentDays = getDaysInMonth(currentDate);
  const brandColor = store?.color_accent || '#3b82f6';

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-20">
      <header className="relative">
        <div className="h-48 w-full relative overflow-hidden bg-gray-900">{store?.banner_url ? (<><img src={store.banner_url} className="w-full h-full object-cover opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/30"></div></>) : (<div className="w-full h-full bg-gradient-to-br from-blue-900 via-gray-900 to-black"></div>)}</div>
        <div className="px-6 -mt-12 relative z-10 flex flex-col items-center text-center">
            <div className="w-28 h-28 rounded-full bg-white border-[6px] border-[#050505] shadow-2xl overflow-hidden flex items-center justify-center mb-3">
                {store?.logo_url ? (<img src={store.logo_url} className="w-full h-full object-contain p-1"/>) : (<div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500"><Store size={32}/></div>)}
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">{store?.name}</h1>
            {store?.address && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm flex items-center gap-1 mb-2 hover:text-white hover:underline transition-all cursor-pointer">
                    <MapPin size={14}/> {store.address}
                </a>
            )}
            <div className="flex gap-2 mt-2"><span className="text-xs font-bold bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/20">Abierto Ahora</span></div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-8 relative">
        <AnimatePresence mode='wait'>
            
            {step === 1 && (<motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}><h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">1. Elegí un servicio</h2><div className="space-y-3">{services.map(srv => (<div key={srv.id} onClick={() => { setSelectedService(srv); nextStepAfterService(); }} className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all flex justify-between items-center group active:scale-[0.98]"><div><h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{srv.name}</h3><div className="flex gap-3 text-xs text-gray-400 mt-1"><span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded"><Clock size={12}/> {srv.duration_minutes} min</span><span className="text-green-400 font-bold text-sm">${srv.price}</span></div></div><div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-gray-500"><ChevronRight size={20}/></div></div>))}</div></motion.div>)}
            {step === 2 && (<motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><button onClick={() => setStep(1)} className="text-xs text-gray-500 mb-6 hover:text-white flex items-center gap-1"><ChevronLeft size={14}/> Cambiar servicio</button><h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">2. ¿Con quién te cortas?</h2><div className="grid grid-cols-2 gap-3"><div onClick={() => { setSelectedStaff(null); setStep(3); }} className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 hover:border-blue-500 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group active:scale-[0.98]"><div className="w-16 h-16 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><Users size={28}/></div><h3 className="font-bold text-white">Sin Preferencia</h3><p className="text-xs text-gray-500 text-center">El primero disponible</p></div>{staffList.map(staff => (<div key={staff.id} onClick={() => { setSelectedStaff(staff); setStep(3); }} className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 hover:border-blue-500 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group active:scale-[0.98]"><div className="w-16 h-16 rounded-full bg-gray-800 overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-colors">{staff.avatar_url ? <img src={staff.avatar_url} className="w-full h-full object-cover"/> : <User size={32} className="m-auto mt-4 text-gray-600"/>}</div><h3 className="font-bold text-white">{staff.name}</h3><p className="text-xs text-blue-400">{staff.role}</p></div>))}</div></motion.div>)}
            
            {/* PASO 3: DÍA Y HORA */}
            {step === 3 && selectedService && (<motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={prevStepFromDate} className="text-xs text-gray-500 mb-6 hover:text-white flex items-center gap-1"><ChevronLeft size={14}/> Volver</button>
                <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl mb-8 flex items-center gap-4"><div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0">${selectedService.price}</div><div><h3 className="text-white font-bold text-lg leading-tight">{selectedService.name}</h3><p className="text-gray-400 text-xs flex items-center gap-2">{selectedStaff ? <><User size={10}/> {selectedStaff.name}</> : null} {selectedService.duration_minutes} min</p></div></div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">3. Elegí un día</h2>
                
                <div className="bg-[#1a1a1a] p-4 rounded-3xl border border-white/5 shadow-xl mb-6">
                    <div className="flex justify-between items-center mb-4 px-2"><button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"><ChevronLeft size={20}/></button><h3 className="font-bold text-lg capitalize">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h3><button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"><ChevronRight size={20}/></button></div>
                    <div className="grid grid-cols-7 mb-2 text-center">{DAYS_OF_WEEK.map(d => <div key={d} className="text-xs font-bold text-gray-600 uppercase py-2">{d}</div>)}</div>
                    <div className="grid grid-cols-7 gap-1">{currentDays.map((dateObj, index) => { if (!dateObj) return <div key={index} className="aspect-square"></div>; const isDisabled = isDateDisabled(dateObj); const year = dateObj.getFullYear(); const month = String(dateObj.getMonth() + 1).padStart(2, '0'); const day = String(dateObj.getDate()).padStart(2, '0'); const dateString = `${year}-${month}-${day}`; const isSelected = selectedDate === dateString; return (<button key={index} disabled={isDisabled} onClick={() => handleDateClick(dateObj)} className={`aspect-square rounded-xl text-sm font-bold flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 scale-105 z-10' : ''} ${!isSelected && !isDisabled ? 'hover:bg-white/10 text-white' : ''} ${isDisabled ? 'text-gray-700 cursor-not-allowed' : ''}`}>{dateObj.getDate()}</button>); })}</div>
                </div>

                {selectedDate && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Clock size={16} className="text-blue-500"/> Horarios disponibles</h3>
                        
                        {availableSlots.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2 mb-8">
                                {availableSlots.map(slot => (
                                    <button 
                                        key={slot.time} 
                                        disabled={slot.isFull}
                                        onClick={() => { setSelectedTime(slot.time); setStep(4); }} 
                                        className={`py-3 rounded-xl text-sm font-bold border transition-all relative overflow-hidden 
                                            ${selectedTime === slot.time 
                                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                                                : slot.isFull 
                                                    ? 'bg-red-900/10 border-red-900/20 text-red-700 opacity-50 cursor-not-allowed' 
                                                    : 'bg-[#1a1a1a] border-white/10 text-gray-300 hover:border-blue-500/50 hover:text-white'
                                            }`}
                                    >
                                        {slot.time}
                                        {store.enable_multislots && !slot.isFull && (
                                            <span className="absolute bottom-0 right-0 text-[8px] bg-white/10 px-1 rounded-tl text-gray-400">
                                                {slot.remaining} lug.
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 text-sm mb-6">Sin turnos disponibles.</div>
                        )}
                    </motion.div>
                )}
            </motion.div>)}

            {step === 4 && (
                 <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <button onClick={() => setStep(3)} className="text-xs text-gray-500 mb-6 hover:text-white flex items-center gap-1"><ChevronLeft size={14}/> Volver a horarios</button>
                    
                    {/* RESUMEN DE RESERVA */}
                    <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 space-y-4 mb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Tus Datos</h3>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><User size={12}/> NOMBRE</label><input className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-blue-500" placeholder="Tu nombre" value={customerData.name} onChange={e => setCustomerData({...customerData, name: e.target.value})}/></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Phone size={12}/> WHATSAPP</label><input className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-blue-500" placeholder="Ej: 264..." value={customerData.phone} onChange={e => setCustomerData({...customerData, phone: e.target.value})} type="tel"/></div>
                    </div>
                    
                    {/* CUPONES */}
                    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 mb-6">
                        {appliedCoupon ? (
                            <div className="flex justify-between items-center text-green-500"><span className="flex items-center gap-2 font-bold"><Tag size={16}/> Cupón {appliedCoupon.code} aplicado</span><button onClick={() => {setAppliedCoupon(null); setCouponCode('')}} className="text-xs text-red-400 hover:underline">Quitar</button></div>
                        ) : (
                            <div className="flex gap-2"><input className="flex-1 bg-black border border-white/10 p-3 rounded-xl text-white text-sm outline-none uppercase" placeholder="Código de descuento" value={couponCode} onChange={e => setCouponCode(e.target.value)}/><button onClick={validateCoupon} disabled={!couponCode || validatingCoupon} className="bg-white/10 px-4 rounded-xl font-bold text-sm hover:bg-white/20">{validatingCoupon ? '...' : 'Aplicar'}</button></div>
                        )}
                    </div>

                    {/* 🟢 SELECCIÓN DE PAGO (NUEVO) */}
                    <div className="space-y-3 mb-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Forma de Pago</h3>
                        <div className="flex gap-3">
                            <PaymentOption id="mercadopago" icon={CreditCard} label="Mercado Pago" selected={paymentMethod} onSelect={setPaymentMethod} color={brandColor} customColor="#009EE3"/>
                            <PaymentOption id="local" icon={Banknote} label="En el Local" selected={paymentMethod} onSelect={setPaymentMethod} color={brandColor}/>
                        </div>
                        <AnimatePresence>
                            {paymentMethod === 'mercadopago' && (
                                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="overflow-hidden">
                                    <div className="p-1">
                                        <p className="text-xs text-gray-500 mb-2 mt-2">Este es nuestro alias, por si no funciona el link:</p>
                                        <div className="bg-[#6b21a8]/20 border border-[#6b21a8] p-4 rounded-xl flex justify-between items-center">
                                            <div><p className="text-xs text-[#d8b4fe] uppercase font-bold">Alias / CBU:</p><p className="font-bold text-white text-lg mt-1 select-all">{store?.cbu_alias || "Consultar"}</p></div>
                                            <button onClick={copyAlias} className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-[#6b21a8] text-white hover:bg-[#7e22ce]'}`}>{copied ? <Check size={20}/> : <Copy size={20}/>}</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* RESUMEN FINAL */}
                    <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl mb-6 space-y-2">
                        <p className="text-center text-sm text-blue-200">Reserva: <strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR')}</strong> a las <strong>{selectedTime} hs</strong></p>
                        {selectedStaff && <p className="text-center text-xs text-blue-300 opacity-80">Con: <strong>{selectedStaff.name}</strong></p>}
                        <div className="border-t border-blue-500/20 mt-2 pt-2 flex justify-between items-center"><span className="text-gray-400 text-sm">Total:</span><div className="text-right">{appliedCoupon && <span className="text-xs text-gray-500 line-through block">${selectedService.price}</span>}<span className="text-xl font-bold text-white">${appliedCoupon ? selectedService.price * (1 - appliedCoupon.discount/100) : selectedService.price}</span></div></div>
                    </div>

                    {/* BOTÓN CONFIRMAR */}
                    <button onClick={handleConfirmBooking} disabled={!customerData.name || !customerData.phone || saving} className={`w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all ${(!customerData.name || !customerData.phone || saving) ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : paymentMethod === 'mercadopago' ? 'bg-[#009EE3] text-white hover:brightness-110 shadow-lg' : 'bg-green-500 text-black hover:bg-white shadow-lg shadow-green-500/20'}`}>
                        {saving ? <Loader2 className="animate-spin"/> : paymentMethod === 'mercadopago' ? 'Ir a Pagar' : <><CheckCircle size={20}/> Confirmar Turno</>}
                    </button>
                 </motion.div>
            )}

        </AnimatePresence>
      </main>
    </div>
  );
}