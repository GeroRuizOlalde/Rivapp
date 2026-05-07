// Helpers para armar URLs de WhatsApp con mensajes pre-formateados.
// Centraliza el formato así templates de pedidos / turnos quedan consistentes.

const cleanPhone = (phone) => String(phone || '').replace(/\D/g, '');

export const buildWhatsAppUrl = (phone, message) => {
  const num = cleanPhone(phone);
  if (!num) return '';
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
};

// Mensaje que el cliente final manda al local cuando confirma su pedido.
export const buildOrderMessage = ({
  storeName,
  branchName,
  orderId,
  customerName,
  customerPhone,
  items = [], // [{ name, quantity, variantName?, extrasNames? }]
  total,
  paymentMethod,
  deliveryMode, // 'delivery' | 'takeaway'
  deliveryLocation, // google maps URL para delivery
  note,
  trackingLink,
}) => {
  const lines = [];
  lines.push('👋 *¡Hola! Quiero hacer un pedido* 🍽️');
  if (branchName) lines.push(`📍 *Sucursal:* ${branchName}`);
  if (orderId) lines.push(`🆔 *ID:* #${orderId}`);
  lines.push('');
  lines.push(`👤 *Cliente:* ${customerName}`);
  if (customerPhone) lines.push(`📞 *Tel:* ${customerPhone}`);
  lines.push('');
  lines.push('🧾 *DETALLE DEL PEDIDO:*');
  items.forEach((i) => {
    let line = `▪️ *${i.quantity}x* ${i.name}`;
    if (i.variantName) line += ` _(${i.variantName})_`;
    lines.push(line);
    if (i.extrasNames) lines.push(`   └ ➕ ${i.extrasNames}`);
  });
  lines.push('');
  lines.push(`💰 *TOTAL:* $${Number(total || 0).toLocaleString('es-AR')}`);
  if (paymentMethod) {
    const pmLabel = paymentMethod === 'mercadopago' ? '✅ Mercado Pago' : '💵 Efectivo';
    lines.push(`💳 *Forma de pago:* ${pmLabel}`);
  }
  lines.push('');
  if (deliveryMode === 'delivery') {
    lines.push('🛵 *Envío a domicilio*');
    if (deliveryLocation) lines.push(`📍 ${deliveryLocation}`);
  } else if (deliveryMode === 'takeaway') {
    lines.push('🛍️ *Retiro en local*');
  }
  if (note) {
    lines.push('');
    lines.push(`📝 *Nota:* _${note}_`);
  }
  if (trackingLink) {
    lines.push('');
    lines.push(`🔗 *Seguimiento:* ${trackingLink}`);
  }
  if (storeName) {
    lines.push('');
    lines.push(`_Pedido a ${storeName} desde Rivapp_`);
  }
  return lines.join('\n');
};

// Mensaje para confirmar/agendar un turno.
export const buildAppointmentMessage = ({
  storeName,
  serviceName,
  staffName,
  dateStr,
  customerName,
  customerPhone,
  total,
  paymentMethod,
  trackingLink,
}) => {
  const lines = [];
  lines.push('📅 *Solicitud de turno*');
  lines.push('');
  if (customerName) lines.push(`👤 *Cliente:* ${customerName}`);
  if (customerPhone) lines.push(`📞 *Tel:* ${customerPhone}`);
  lines.push('');
  if (serviceName) lines.push(`✂️ *Servicio:* ${serviceName}`);
  if (staffName) lines.push(`🧑‍💼 *Profesional:* ${staffName}`);
  if (dateStr) lines.push(`🗓️ *Fecha:* ${dateStr}`);
  if (total != null) {
    lines.push('');
    lines.push(`💰 *Total:* $${Number(total).toLocaleString('es-AR')}`);
  }
  if (paymentMethod) {
    const pmLabel = paymentMethod === 'mercadopago' ? '✅ Mercado Pago' : '💵 Efectivo';
    lines.push(`💳 *Pago:* ${pmLabel}`);
  }
  if (trackingLink) {
    lines.push('');
    lines.push(`🔗 ${trackingLink}`);
  }
  if (storeName) {
    lines.push('');
    lines.push(`_Reserva en ${storeName} desde Rivapp_`);
  }
  return lines.join('\n');
};

// Mensaje de recordatorio que el admin manda al cliente.
export const buildReminderMessage = ({
  storeName,
  customerName,
  serviceName,
  dateStr,
}) => {
  const greeting = customerName ? `Hola *${customerName}*! 👋` : 'Hola! 👋';
  const lines = [
    greeting,
    '',
    `Te escribo de *${storeName || 'el local'}* para recordarte tu turno:`,
    '',
  ];
  if (serviceName) lines.push(`✂️ ${serviceName}`);
  if (dateStr) lines.push(`📅 ${dateStr} hs`);
  lines.push('');
  lines.push('Por favor confirmame si vas a poder asistir. ¡Gracias!');
  return lines.join('\n');
};
