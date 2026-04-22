import React, { useState, useEffect } from 'react';
import { useStore } from '../context/useStore';
import { supabase } from '../supabase/client';
import { logger } from '../utils/logger';
import {
  Clock, ChevronRight, ChevronLeft, CheckCircle2, Loader2, User, Phone, MapPin,
  Store, Users, Tag, CreditCard, Banknote, Check, Copy, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/shared/ui/Button';
import Field from '../components/shared/ui/Field';
import Eyebrow from '../components/shared/ui/Eyebrow';
import Rule from '../components/shared/ui/Rule';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const STEPS = [
  { n: 1, label: 'Servicio' },
  { n: 2, label: 'Profesional' },
  { n: 3, label: 'Fecha' },
  { n: 4, label: 'Confirmar' },
];

function StepIndicator({ step, hasStaff }) {
  const visible = hasStaff ? STEPS : STEPS.filter((s) => s.n !== 2);
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${visible.length}, 1fr)` }}>
      {visible.map((s, i) => {
        const active = step === s.n;
        const done = step > s.n;
        return (
          <div key={s.n} className="flex flex-col gap-2">
            <div className={`h-0.5 w-full ${done || active ? 'bg-acid' : 'bg-rule'}`} />
            <div className="flex items-baseline gap-2">
              <span
                className={`num text-[11px] ${active ? 'text-acid' : done ? 'text-text' : 'text-text-subtle'}`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={`mono text-[10px] uppercase tracking-[0.2em] ${
                  active ? 'text-text' : 'text-text-subtle'
                }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaymentOption({ id, icon: Icon, label, hint, selected, onSelect }) {
  const isSelected = selected === id;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`group flex flex-1 flex-col items-start gap-3 rounded-[var(--radius-lg)] border p-5 text-left transition-all ${
        isSelected
          ? 'border-acid bg-acid/8'
          : 'border-rule-strong bg-ink-2 hover:border-text-muted'
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isSelected ? 'bg-acid text-ink' : 'border border-rule-strong text-text-muted'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        {isSelected && (
          <span className="mono text-[10px] uppercase tracking-[0.22em] text-acid">Elegido</span>
        )}
      </div>
      <div>
        <p className="display text-xl text-text">{label}</p>
        <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">{hint}</p>
      </div>
    </button>
  );
}

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

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mercadopago');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('status') === 'success') {
      window.history.replaceState({}, document.title, window.location.pathname);
      alert('¡Pago recibido! Tu turno fue confirmado.');
      setStep(1);
    }
  }, []);

  useEffect(() => {
    if (!store) return;
    const fetchData = async () => {
      const { data: srvData } = await supabase
        .from('services')
        .select('*')
        .eq('store_id', store.id)
        .eq('active', true)
        .order('price');
      if (srvData) setServices(srvData);

      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('store_id', store.id)
        .eq('active', true);
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

  const hasStaff = store?.enable_staff_selection && staffList.length > 0;

  const nextStepAfterService = () => {
    if (hasStaff) setStep(2);
    else {
      setSelectedStaff(null);
      setStep(3);
    }
  };
  const prevStepFromDate = () => {
    if (hasStaff) setStep(2);
    else setStep(1);
  };

  useEffect(() => {
    const calculateAvailability = async () => {
      if (!selectedDate || !selectedService) return;

      const dateObj = new Date(selectedDate + 'T00:00:00');
      const dayIndex = dateObj.getDay();
      const daySchedule = schedules.find((s) => s.day_of_week === dayIndex);

      if (!daySchedule || daySchedule.is_closed) {
        setAvailableSlots([]);
        return;
      }

      const startOfDay = `${selectedDate}T00:00:00`;
      const endOfDay = `${selectedDate}T23:59:59`;

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
      const now = new Date();

      let limit = 1;
      if (selectedStaff) {
        limit = 1;
      } else {
        limit =
          store.enable_multislots && store.max_concurrent_slots
            ? store.max_concurrent_slots
            : staffList.length > 0
            ? staffList.length
            : 1;
      }

      while (currentTime.getTime() + durationMs <= endTime.getTime()) {
        if (currentTime < now) {
          currentTime = new Date(currentTime.getTime() + durationMs);
          continue;
        }

        const timeStr = currentTime.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const formattedTime = timeStr.length === 4 ? `0${timeStr}` : timeStr;

        const busyCount = existingApts.filter((apt) => {
          const aptDate = new Date(apt.start_time);
          const aptStr = aptDate.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          const aptFormatted = aptStr.length === 4 ? `0${aptStr}` : aptStr;
          if (aptFormatted === formattedTime) {
            if (selectedStaff) return apt.staff_id === selectedStaff.id;
            return true;
          }
          return false;
        }).length;

        const isFull = busyCount >= limit;
        const remaining = limit - busyCount;

        slots.push({ time: formattedTime, isFull, remaining });
        currentTime = new Date(currentTime.getTime() + durationMs);
      }

      setAvailableSlots(slots);
      setSelectedTime('');
    };

    calculateAvailability();
  }, [selectedDate, selectedService, schedules, store, selectedStaff, staffList]);

  const getDaysInMonth = (date) => {
    const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const first = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const arr = Array(first).fill(null);
    for (let i = 1; i <= days; i++) arr.push(new Date(date.getFullYear(), date.getMonth(), i));
    return arr;
  };

  const isDateDisabled = (dateObj) => {
    if (!dateObj) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) return true;
    const dayIndex = dateObj.getDay();
    const schedule = schedules.find((s) => s.day_of_week === dayIndex);
    if (schedule && schedule.is_closed) return true;
    return false;
  };

  const handleDateClick = (dateObj) => {
    if (!dateObj || isDateDisabled(dateObj)) return;
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const validateCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('store_id', store.id)
      .eq('code', couponCode.toUpperCase())
      .eq('active', true)
      .single();
    if (data) setAppliedCoupon(data);
    else {
      alert('Cupón inválido o expirado');
      setAppliedCoupon(null);
    }
    setValidatingCoupon(false);
  };

  const copyAlias = () => {
    navigator.clipboard.writeText(store?.cbu_alias || 'ALIAS');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedService || !customerData.name || !customerData.phone) return;
    setSaving(true);

    try {
      const isoStartDateTime = `${selectedDate}T${selectedTime}:00`;
      const startDateObj = new Date(isoStartDateTime);
      const endDateObj = new Date(startDateObj.getTime() + selectedService.duration_minutes * 60000);
      const finalPrice = appliedCoupon
        ? selectedService.price * (1 - appliedCoupon.discount / 100)
        : selectedService.price;

      let finalStaffId = selectedStaff ? selectedStaff.id : null;

      if (!finalStaffId) {
        const { data: busyApts } = await supabase
          .from('appointments')
          .select('staff_id')
          .eq('store_id', store.id)
          .eq('start_time', startDateObj.toISOString())
          .neq('status', 'cancelado');
        const busyStaffIds = busyApts.map((a) => a.staff_id);
        const availableStaff = staffList.filter((s) => !busyStaffIds.includes(s.id));

        if (availableStaff.length > 0) {
          finalStaffId = availableStaff[0].id;
        } else if (store.enable_multislots) {
          finalStaffId = staffList[0]?.id;
        } else {
          alert('¡Ups! Ese horario acaba de ocuparse por completo.');
          setSaving(false);
          return;
        }
      }

      if (!finalStaffId && staffList.length > 0) finalStaffId = staffList[0].id;

      const { data: newApt, error } = await supabase
        .from('appointments')
        .insert([
          {
            store_id: store.id,
            service_id: selectedService.id,
            staff_id: finalStaffId,
            customer_name: customerData.name,
            customer_phone: customerData.phone,
            start_time: startDateObj.toISOString(),
            end_time: endDateObj.toISOString(),
            status: 'pendiente',
            price_paid: finalPrice,
            coupon_code: appliedCoupon ? appliedCoupon.code : null,
            payment_method: paymentMethod,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (paymentMethod === 'mercadopago') {
        const { data: mpData, error: mpError } = await supabase.functions.invoke('create-order-preference', {
          body: JSON.stringify({
            store_id: store.id,
            items: [{ name: selectedService.name, price: finalPrice, quantity: 1 }],
            order_id: newApt.id,
            domain_url: window.location.origin,
            type: 'appointment',
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        if (mpError) {
          logger.error('Error MP:', mpError);
          alert('Error conectando con Mercado Pago. Reserva guardada.');
        } else if (mpData?.init_point) {
          window.location.href = mpData.init_point;
          return;
        }
      }

      const assignedStaffName = staffList.find((s) => s.id === finalStaffId)?.name || 'Staff';
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dateStr = dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
      const dateCapitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

      const E_WAVE = String.fromCodePoint(0x1f44b);
      const E_USER = String.fromCodePoint(0x1f464);
      const E_CUT = String.fromCodePoint(0x2702, 0xfe0f);
      const E_BARBER = String.fromCodePoint(0x1f488);
      const E_CAL = String.fromCodePoint(0x1f4c5);
      const E_CLOCK = String.fromCodePoint(0x23f0);
      const E_TAG = String.fromCodePoint(0x1f3ab);
      const E_MONEY = String.fromCodePoint(0x1f4b0);
      const E_CARD = String.fromCodePoint(0x1f4b3);
      const E_CHECK = String.fromCodePoint(0x2705);
      const E_HOME = String.fromCodePoint(0x1f3e0);

      let msg = `Hola *${store.name}*! ${E_WAVE}\n\n`;
      msg += `Quiero confirmar mi turno:\n\n`;
      msg += `${E_USER} *Cliente:* ${customerData.name}\n`;
      msg += `${E_CUT} *Servicio:* ${selectedService.name}\n`;
      msg += `${E_BARBER} *Profesional:* ${assignedStaffName}\n`;
      msg += `${E_CAL} *Fecha:* ${dateCapitalized}\n`;
      msg += `${E_CLOCK} *Hora:* ${selectedTime} hs\n`;

      if (appliedCoupon) {
        msg += `${E_TAG} *Cupón:* ${appliedCoupon.code} (-${appliedCoupon.discount}%)\n`;
        msg += `${E_MONEY} *Total a pagar:* $${finalPrice}\n`;
      }

      const paymentText =
        paymentMethod === 'mercadopago' ? `${E_CHECK} Pagado con Mercado Pago` : `${E_HOME} A pagar en el local`;
      msg += `${E_CARD} *Pago:* ${paymentText}`;

      const encodedMsg = encodeURIComponent(msg);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${store.phone || ''}&text=${encodedMsg}`;
      window.open(whatsappUrl, '_blank');

      alert('¡Turno solicitado con éxito!');

      setStep(1);
      setSelectedDate(null);
      setSelectedTime('');
      setSelectedStaff(null);
      setCustomerData({ name: '', phone: '' });
      setAppliedCoupon(null);
      setCouponCode('');
    } catch (error) {
      logger.error(error);
      alert('Error al reservar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="h-10 w-10 animate-spin text-acid" />
      </div>
    );
  }

  const currentDays = getDaysInMonth(currentDate);
  const finalPriceCalc = appliedCoupon
    ? selectedService?.price * (1 - appliedCoupon.discount / 100)
    : selectedService?.price;

  return (
    <div className="relative min-h-screen bg-ink pb-24 text-text">
      <div className="pointer-events-none absolute inset-0 z-0 grain" aria-hidden />

      {/* Header */}
      <header className="relative z-10">
        <div className="relative h-56 w-full overflow-hidden bg-ink-2">
          {store?.banner_url ? (
            <>
              <img src={store.banner_url} alt={store.name} className="h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-ink/40 to-ink" />
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-ml/30 via-ink-3 to-ink" />
          )}
        </div>

        <div className="relative -mt-16 px-6">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[6px] border-ink bg-ink-2 shadow-[var(--shadow-lift)]">
              {store?.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
              ) : (
                <Store className="h-8 w-8 text-text-muted" />
              )}
            </div>
            <Eyebrow className="mt-5">Turnos & reservas</Eyebrow>
            <h1 className="display mt-3 text-4xl text-text md:text-5xl">{store?.name}</h1>
            {store?.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
              >
                <MapPin className="h-3.5 w-3.5 text-acid" /> {store.address}
              </a>
            )}
            <div className="mono mt-4 inline-flex items-center gap-2 rounded-full border border-acid/40 bg-acid/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-acid">
              <span className="h-1.5 w-1.5 rounded-full bg-acid" /> Abierto ahora
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-xl px-4 pt-12">
        <StepIndicator step={step} hasStaff={hasStaff} />

        <div className="mt-10">
          <AnimatePresence mode="wait">
            {/* PASO 1 · Servicio */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <Eyebrow>Paso 01</Eyebrow>
                <h2 className="display mt-3 text-4xl text-text md:text-5xl">
                  Elegí un <em className="display-italic text-acid">servicio</em>
                </h2>

                <Rule className="mt-8" />

                <div className="mt-6 grid gap-3">
                  {services.map((srv) => (
                    <button
                      key={srv.id}
                      onClick={() => {
                        setSelectedService(srv);
                        nextStepAfterService();
                      }}
                      className="group flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-rule-strong bg-ink-2 p-5 text-left transition-all hover:border-acid/60 active:scale-[0.99]"
                    >
                      <div className="min-w-0">
                        <h3 className="display text-2xl text-text group-hover:text-acid">{srv.name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                          <span className="mono inline-flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> {srv.duration_minutes} min
                          </span>
                          <span className="h-1 w-1 rounded-full bg-text-subtle" />
                          <span className="num text-base font-semibold text-acid">${srv.price}</span>
                        </div>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rule-strong text-text-muted transition-all group-hover:border-acid group-hover:bg-acid group-hover:text-ink">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* PASO 2 · Staff */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  onClick={() => setStep(1)}
                  className="mono mb-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-text-muted hover:text-text"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Cambiar servicio
                </button>

                <Eyebrow>Paso 02</Eyebrow>
                <h2 className="display mt-3 text-4xl text-text md:text-5xl">
                  ¿Con <em className="display-italic text-acid">quién</em>?
                </h2>

                <Rule className="mt-8" />

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setSelectedStaff(null);
                      setStep(3);
                    }}
                    className="group flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-rule-strong bg-ink-2 p-5 transition-all hover:border-acid/60 active:scale-[0.98]"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-acid/10 text-acid">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <h3 className="display text-lg text-text">Sin preferencia</h3>
                      <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                        El primero libre
                      </p>
                    </div>
                  </button>

                  {staffList.map((staff) => (
                    <button
                      key={staff.id}
                      onClick={() => {
                        setSelectedStaff(staff);
                        setStep(3);
                      }}
                      className="group flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-rule-strong bg-ink-2 p-5 transition-all hover:border-acid/60 active:scale-[0.98]"
                    >
                      <div className="h-14 w-14 overflow-hidden rounded-full border border-rule-strong bg-ink-3">
                        {staff.avatar_url ? (
                          <img src={staff.avatar_url} alt={staff.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="m-auto mt-4 h-6 w-6 text-text-muted" />
                        )}
                      </div>
                      <div className="text-center">
                        <h3 className="display text-lg text-text">{staff.name}</h3>
                        <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-acid">
                          {staff.role}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* PASO 3 · Fecha + hora */}
            {step === 3 && selectedService && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  onClick={prevStepFromDate}
                  className="mono mb-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-text-muted hover:text-text"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Volver
                </button>

                {/* Servicio elegido */}
                <div className="mb-8 flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-acid/30 bg-acid/[0.05] p-4">
                  <div className="min-w-0">
                    <p className="mono text-[10px] uppercase tracking-[0.22em] text-acid">Reservando</p>
                    <h3 className="display mt-1 truncate text-xl text-text">{selectedService.name}</h3>
                    <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                      {selectedStaff ? `${selectedStaff.name} · ` : ''}
                      {selectedService.duration_minutes} min
                    </p>
                  </div>
                  <p className="num text-3xl text-acid">${selectedService.price}</p>
                </div>

                <Eyebrow>Paso {hasStaff ? '03' : '02'}</Eyebrow>
                <h2 className="display mt-3 text-4xl text-text md:text-5xl">
                  Elegí un <em className="display-italic text-acid">día</em>
                </h2>

                <div className="mt-6 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="rounded-full border border-rule p-2 text-text-muted transition-colors hover:border-acid hover:text-acid"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <p className="display text-2xl capitalize text-text">
                      {MONTHS[currentDate.getMonth()]}{' '}
                      <span className="num text-text-muted">{currentDate.getFullYear()}</span>
                    </p>
                    <button
                      onClick={() => changeMonth(1)}
                      className="rounded-full border border-rule p-2 text-text-muted transition-colors hover:border-acid hover:text-acid"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 text-center">
                    {DAYS_OF_WEEK.map((d) => (
                      <div
                        key={d}
                        className="mono pb-2 text-[10px] uppercase tracking-[0.18em] text-text-subtle"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 grid grid-cols-7 gap-1">
                    {currentDays.map((dateObj, index) => {
                      if (!dateObj) return <div key={index} className="aspect-square" />;
                      const isDisabled = isDateDisabled(dateObj);
                      const year = dateObj.getFullYear();
                      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                      const day = String(dateObj.getDate()).padStart(2, '0');
                      const dateString = `${year}-${month}-${day}`;
                      const isSelected = selectedDate === dateString;
                      return (
                        <button
                          key={index}
                          disabled={isDisabled}
                          onClick={() => handleDateClick(dateObj)}
                          className={`num aspect-square rounded-[10px] text-sm transition-all ${
                            isSelected
                              ? 'bg-acid text-ink font-semibold shadow-[0_10px_30px_-10px_rgba(208,255,0,0.55)]'
                              : !isDisabled
                              ? 'text-text hover:bg-white/5'
                              : 'text-text-subtle/40 cursor-not-allowed'
                          }`}
                        >
                          {dateObj.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                  >
                    <Rule label="Horarios disponibles" />

                    {availableSlots.length > 0 ? (
                      <div className="mt-6 grid grid-cols-4 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            disabled={slot.isFull}
                            onClick={() => {
                              setSelectedTime(slot.time);
                              setStep(4);
                            }}
                            className={`num relative rounded-[var(--radius-md)] border py-3 text-sm transition-all ${
                              selectedTime === slot.time
                                ? 'border-acid bg-acid text-ink font-semibold'
                                : slot.isFull
                                ? 'cursor-not-allowed border-rule bg-ink-2 text-text-subtle/50'
                                : 'border-rule-strong bg-ink-2 text-text hover:border-acid hover:text-acid'
                            }`}
                          >
                            {slot.time}
                            {store.enable_multislots && !slot.isFull && (
                              <span className="mono absolute bottom-0.5 right-1 text-[8px] text-text-subtle">
                                {slot.remaining}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-6 rounded-[var(--radius-md)] border border-signal/30 bg-signal/10 p-4 text-center text-sm text-signal-soft">
                        Sin turnos disponibles para este día.
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* PASO 4 · Confirmar */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  onClick={() => setStep(3)}
                  className="mono mb-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-text-muted hover:text-text"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Volver a horarios
                </button>

                <Eyebrow>Paso {hasStaff ? '04' : '03'}</Eyebrow>
                <h2 className="display mt-3 text-4xl text-text md:text-5xl">
                  Tus <em className="display-italic text-acid">datos</em>
                </h2>

                <Rule className="mt-8" />

                {/* Datos */}
                <div className="mt-6 grid gap-5">
                  <Field
                    label="Nombre"
                    icon={User}
                    placeholder="Tu nombre"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  />
                  <Field
                    label="WhatsApp"
                    icon={Phone}
                    type="tel"
                    placeholder="Ej: 264..."
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  />
                </div>

                {/* Cupón */}
                <div className="mt-6 rounded-[var(--radius-lg)] border border-rule-strong bg-ink-2 p-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold text-acid">
                        <Tag className="h-4 w-4" /> Cupón {appliedCoupon.code} aplicado (-{appliedCoupon.discount}%)
                      </span>
                      <button
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode('');
                        }}
                        className="mono text-[10px] uppercase tracking-[0.22em] text-signal hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        className="mono flex-1 rounded-[var(--radius-md)] border border-rule bg-ink px-4 py-3 text-sm uppercase text-text placeholder:text-text-subtle focus:border-acid focus:outline-none"
                        placeholder="Código de descuento"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button
                        onClick={validateCoupon}
                        disabled={!couponCode || validatingCoupon}
                        variant="outline"
                        size="sm"
                      >
                        {validatingCoupon ? '…' : 'Aplicar'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Pago */}
                <div className="mt-8">
                  <Rule label="Forma de pago" />
                  <div className="mt-6 flex gap-3">
                    <PaymentOption
                      id="mercadopago"
                      icon={CreditCard}
                      label="Mercado Pago"
                      hint="Pago online"
                      selected={paymentMethod}
                      onSelect={setPaymentMethod}
                    />
                    <PaymentOption
                      id="cash"
                      icon={Banknote}
                      label="En el local"
                      hint="Efectivo / POS"
                      selected={paymentMethod}
                      onSelect={setPaymentMethod}
                    />
                  </div>

                  <AnimatePresence>
                    {paymentMethod === 'mercadopago' && store?.cbu_alias && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 flex items-center justify-between rounded-[var(--radius-md)] border border-ml/30 bg-ml/10 p-4">
                          <div className="min-w-0">
                            <p className="mono text-[10px] uppercase tracking-[0.22em] text-ml-soft">
                              Alias / CBU de respaldo
                            </p>
                            <p className="mono mt-1 select-all truncate text-base font-semibold text-text">
                              {store.cbu_alias}
                            </p>
                          </div>
                          <button
                            onClick={copyAlias}
                            className={`rounded-[10px] p-2 transition-colors ${
                              copied ? 'bg-acid text-ink' : 'bg-ml text-white hover:brightness-110'
                            }`}
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Resumen */}
                <div className="mt-8 rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
                  <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">Resumen</p>
                  <Rule className="mt-3" />
                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between text-text-muted">
                      <span>Fecha</span>
                      <span className="text-text">
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    <div className="flex justify-between text-text-muted">
                      <span>Hora</span>
                      <span className="num text-text">{selectedTime} hs</span>
                    </div>
                    {selectedStaff && (
                      <div className="flex justify-between text-text-muted">
                        <span>Profesional</span>
                        <span className="text-text">{selectedStaff.name}</span>
                      </div>
                    )}
                  </div>
                  <Rule className="mt-4" />
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">Total</span>
                    <div className="text-right">
                      {appliedCoupon && (
                        <p className="num text-xs text-text-subtle line-through">${selectedService.price}</p>
                      )}
                      <p className="num text-3xl text-acid">${finalPriceCalc}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleConfirmBooking}
                  disabled={!customerData.name || !customerData.phone || saving}
                  variant={paymentMethod === 'mercadopago' ? 'acid' : 'paper'}
                  size="xl"
                  className="mt-6 w-full"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : paymentMethod === 'mercadopago' ? (
                    <>Ir a pagar <ArrowRight className="h-4 w-4" /></>
                  ) : (
                    <>Confirmar turno <CheckCircle2 className="h-4 w-4" /></>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
