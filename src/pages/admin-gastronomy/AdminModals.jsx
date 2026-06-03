import React, { useEffect, useState } from 'react';
import {
  X, MapPin, Mail, Bike, Layers, Plus, Zap, TrendingUp, CloudUpload, Loader2,
  Crown, Store, User, RefreshCw, Eye, EyeOff, Copy, Check,
} from 'lucide-react';
import Button from '../../components/shared/ui/Button';
import Eyebrow from '../../components/shared/ui/Eyebrow';
import Rule from '../../components/shared/ui/Rule';
import { ASSIGNABLE_ROLES, MANAGER_ASSIGNABLE_ROLES, getRoleLabel } from '../../config/roles';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
import StoreMap from '../../components/shared/StoreMap';

function ModalShell({ title, subtitle, eyebrow, onClose, maxWidth = 'max-w-md', children }) {
  // Lock body scroll mientras el modal está abierto.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-ink/90 backdrop-blur-sm anim-fade md:items-center md:overflow-y-auto md:p-4">
      <div
        className={`relative flex w-full flex-col overflow-hidden border border-rule-strong bg-ink-2 shadow-[var(--shadow-editorial)] md:my-8 md:rounded-[var(--radius-xl)] ${maxWidth}`}
      >
        <div className="flex items-start justify-between border-b border-rule p-5 md:p-6">
          <div className="min-w-0 pr-3">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h2 className="display mt-2 text-xl text-text md:text-2xl">{title}</h2>
            {subtitle && (
              <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
            aria-label="Cerrar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 md:p-6">{children}</div>
      </div>
    </div>
  );
}

function AdminInput({ label, className, ...props }) {
  return (
    <div className={className}>
      {label && <label className="eyebrow mb-2 block">{label}</label>}
      <input
        className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text placeholder:text-text-subtle focus:border-text focus:outline-none"
        {...props}
      />
    </div>
  );
}

function AdminSelect({ label, children, ...props }) {
  return (
    <div>
      {label && <label className="eyebrow mb-2 block">{label}</label>}
      <select
        className="mono w-full cursor-pointer rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-text focus:outline-none"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

function AdminTextarea({ label, className, ...props }) {
  return (
    <div className={className}>
      {label && <label className="eyebrow mb-2 block">{label}</label>}
      <textarea
        className="w-full resize-none rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text placeholder:text-text-subtle focus:border-text focus:outline-none"
        {...props}
      />
    </div>
  );
}

export function BranchModal({ branchForm, setBranchForm, editingBranch, onSave, onClose, onGetLocation }) {
  return (
    <ModalShell
      eyebrow="Sucursal"
      title={editingBranch ? 'Editar sucursal' : 'Nueva sucursal'}
      onClose={onClose}
    >
      <form onSubmit={onSave} className="space-y-4">
        <AdminInput
          label="Nombre"
          placeholder="Ej: Centro"
          value={branchForm.name}
          onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
        />
        <div>
          <label className="eyebrow mb-2 block">Dirección</label>
          <AddressAutocomplete
            value={
              branchForm.address || branchForm.lat
                ? { address: branchForm.address || '', lat: branchForm.lat, lng: branchForm.lng }
                : null
            }
            onChange={(data) =>
              setBranchForm({
                ...branchForm,
                address: data.address,
                lat: data.lat,
                lng: data.lng,
              })
            }
            placeholder="Buscá la dirección…"
          />
          <button
            type="button"
            onClick={onGetLocation}
            className="mono mt-2 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-ml-soft hover:text-text"
          >
            <MapPin className="h-3.5 w-3.5" /> Usar mi ubicación actual
          </button>
        </div>
        <AdminInput
          label="Teléfono"
          value={branchForm.phone}
          onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
        />
        {branchForm.lat && branchForm.lng && (
          <StoreMap
            lat={Number(branchForm.lat)}
            lng={Number(branchForm.lng)}
            label={branchForm.name || 'Sucursal'}
            height={180}
          />
        )}
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-[var(--radius-md)] bg-acid py-3 text-sm font-semibold text-ink hover:brightness-110"
        >
          Guardar sucursal
        </button>
      </form>
    </ModalShell>
  );
}

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const arr = new Uint32Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * 0xffffffff);
  }
  let out = '';
  for (let i = 0; i < length; i++) out += chars[arr[i] % chars.length];
  return out;
}

// Modal de "Agregar miembro". Maneja el form Y el resultado (credenciales para
// copiar) sin hacer reload del modal.
//   onSubmit(memberData) → debe devolver { success, was_new_user, temp_password, email_sent, email_error } o null.
//   currentRole / currentBranchId — si quien crea es 'manager', se restringe
//   el scope: solo puede crear staff/rider en SU misma sucursal.
export function TeamModal({
  newMember,
  setNewMember,
  branches,
  businessType = 'gastronomia',
  currentRole = null,
  currentBranchId = null,
  onSubmit,
  onClose,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null); // 'email' | 'pwd' | null

  const isRestrictedManager = currentRole === 'manager';

  // Roles que el caller puede asignar (labels según rubro)
  const allowedRoles = (
    isRestrictedManager
      ? MANAGER_ASSIGNABLE_ROLES(businessType)
      : ASSIGNABLE_ROLES(businessType)
  ).map((r) => ({ key: r.id, label: r.label, tone: r.tone }));

  // Inicializar password + scope al abrir
  useEffect(() => {
    setNewMember((prev) => {
      const next = { ...prev };
      if (!next.password) next.password = generatePassword();
      // Si soy manager, forzar branch a la mía y rol a uno permitido.
      if (isRestrictedManager) {
        next.branch_id = currentBranchId || '';
        if (!allowedRoles.find((r) => r.key === next.role)) next.role = 'staff';
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const regenerate = () => setNewMember({ ...newMember, password: generatePassword() });

  const handleCopy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await onSubmit({
        email: newMember.email,
        role: newMember.role,
        branch_id: newMember.branch_id || null,
        password: newMember.password,
      });
      if (res) setResult(res);
      else onClose();
    } finally {
      setSubmitting(false);
    }
  };

  // VISTA: resultado con credenciales
  if (result) {
    const { was_new_user, email, temp_password, email_sent, email_error } = result;
    return (
      <ModalShell eyebrow="Listo" title="Miembro agregado" onClose={onClose}>
        <div className="space-y-5">
          {was_new_user ? (
            <>
              <p className="text-sm text-text-muted">
                Cuenta nueva creada. {email_sent
                  ? 'Le enviamos un email con las credenciales.'
                  : 'No se pudo enviar el email — copialas y mandáselas vos.'}
                {email_error && ` (${email_error})`}
              </p>
              <div className="space-y-3 rounded-[var(--radius-md)] border border-acid/30 bg-acid/[0.05] p-4">
                <div>
                  <p className="mono mb-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">Email</p>
                  <div className="flex items-center justify-between gap-2 rounded bg-ink-3 p-2">
                    <code className="mono truncate text-sm text-text">{email}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(email, 'email')}
                      className="shrink-0 rounded border border-rule p-1.5 text-text-muted hover:border-text hover:text-text"
                      aria-label="Copiar email"
                    >
                      {copied === 'email' ? <Check className="h-3.5 w-3.5 text-acid" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="mono mb-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                    Contraseña temporal
                  </p>
                  <div className="flex items-center justify-between gap-2 rounded bg-ink-3 p-2">
                    <code className="mono truncate text-sm text-text">{temp_password}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(temp_password, 'pwd')}
                      className="shrink-0 rounded border border-rule p-1.5 text-text-muted hover:border-text hover:text-text"
                      aria-label="Copiar contraseña"
                    >
                      {copied === 'pwd' ? <Check className="h-3.5 w-3.5 text-acid" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                Esta contraseña no se va a volver a mostrar. Guardala antes de cerrar.
              </p>
            </>
          ) : (
            <p className="text-sm text-text-muted">
              <strong className="text-text">{email}</strong> ya tenía cuenta. Le agregamos el acceso a esta tienda con su contraseña existente.
            </p>
          )}
          <Button onClick={onClose} variant="acid" size="lg" className="w-full">
            Listo
          </Button>
        </div>
      </ModalShell>
    );
  }

  // VISTA: form
  return (
    <ModalShell eyebrow="Equipo" title="Agregar miembro" onClose={onClose}>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <AdminInput
          type="email"
          label="Email"
          placeholder="persona@email.com"
          value={newMember.email}
          onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
          required
        />
        <div>
          <label className="eyebrow mb-2 block">Rol</label>
          <div className={`grid gap-2 ${allowedRoles.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {allowedRoles.map((r) => {
              const active = newMember.role === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setNewMember({ ...newMember, role: r.key })}
                  className={`mono rounded-[var(--radius-sm)] border py-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                    active
                      ? r.tone === 'acid'
                        ? 'border-acid bg-acid/10 text-acid'
                        : r.tone === 'ml'
                        ? 'border-ml bg-ml/10 text-ml-soft'
                        : 'border-signal bg-signal/10 text-signal-soft'
                      : 'border-rule-strong text-text-muted hover:border-text-muted hover:text-text'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          {isRestrictedManager && (
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
              Como gerente, solo podés crear cajeros o riders para tu sucursal.
            </p>
          )}
        </div>
        {branches?.length > 0 &&
          (newMember.role === 'manager' || newMember.role === 'staff' || newMember.role === 'rider') && (
            <AdminSelect
              label="Sucursal asignada"
              value={newMember.branch_id}
              onChange={(e) => setNewMember({ ...newMember, branch_id: e.target.value })}
              required
              disabled={isRestrictedManager}
            >
              <option value="">Elegí una sucursal…</option>
              {branches
                .filter((b) => (isRestrictedManager ? b.id === currentBranchId : true))
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </AdminSelect>
          )}

        <div>
          <label className="eyebrow mb-2 flex items-center justify-between">
            <span>Contraseña temporal</span>
            <button
              type="button"
              onClick={regenerate}
              className="mono inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.22em] text-text-muted hover:text-text"
            >
              <RefreshCw className="h-3 w-3" /> Regenerar
            </button>
          </label>
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newMember.password || ''}
              onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
              className="mono flex-1 bg-transparent text-sm text-text outline-none"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="shrink-0 text-text-muted hover:text-text"
              aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mono mt-2 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
            La persona la podrá cambiar después desde "olvidé mi contraseña".
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-acid py-3 text-sm font-semibold text-ink hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creando…
            </>
          ) : (
            'Crear miembro'
          )}
        </button>
      </form>
    </ModalShell>
  );
}

export function RolesModal({ onClose, businessType = 'gastronomia' }) {
  const isGastro = (businessType || '').toLowerCase().includes('gastr')
    || (businessType || '').toLowerCase().includes('food')
    || (businessType || '').toLowerCase().includes('restaurant');

  const roles = [
    {
      icon: Crown,
      title: `${getRoleLabel('admin', businessType)} (Dueño / Admin)`,
      tone: 'signal',
      desc: 'Acceso total a todo el negocio.',
      bullets: [
        'Ve y gestiona todas las sucursales',
        'Acceso a facturación y suscripción',
        'Crear/borrar miembros y configurar la marca',
        isGastro ? 'Edita menú, precios y todo el catálogo' : 'Edita servicios, precios y horarios',
      ],
    },
    {
      icon: Store,
      title: `${getRoleLabel('manager', businessType)}`,
      tone: 'acid',
      desc: 'Líder de una sucursal específica.',
      bullets: [
        'Solo ve los datos de su sucursal asignada',
        isGastro ? 'Puede editar menú y precios' : 'Puede editar servicios y agenda',
        isGastro ? 'Gestiona staff y riders del local' : 'Gestiona staff de su local',
        'Ve métricas de venta locales',
      ],
    },
    {
      icon: User,
      title: getRoleLabel('staff', businessType),
      tone: 'ml',
      desc: 'Operativo para el día a día.',
      bullets: isGastro
        ? [
            'Recibe y gestiona pedidos (Confirmar, Listo, Entregar)',
            'Puede abrir/cerrar la sucursal',
          ]
        : [
            'Confirma o rechaza turnos solicitados',
            'Reagenda y cancela turnos',
            'Atiende a clientes en mostrador',
          ],
    },
  ];

  return (
    <ModalShell
      eyebrow="Referencia"
      title="Niveles de acceso"
      subtitle="Qué puede hacer cada rol"
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="grid gap-3">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div
              key={role.title}
              className={`flex gap-4 rounded-[var(--radius-md)] border p-5 ${
                role.tone === 'signal'
                  ? 'border-signal/30 bg-signal/[0.05]'
                  : role.tone === 'acid'
                  ? 'border-acid/30 bg-acid/[0.05]'
                  : 'border-ml/30 bg-ml/[0.05]'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  role.tone === 'signal'
                    ? 'bg-signal/15 text-signal-soft'
                    : role.tone === 'acid'
                    ? 'bg-acid/15 text-acid'
                    : 'bg-ml/15 text-ml-soft'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="display text-xl text-text">{role.title}</p>
                <p className="mt-1 text-sm text-text-muted">{role.desc}</p>
                <ul className="mt-3 space-y-1 text-xs text-text-subtle">
                  {role.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
      <Button onClick={onClose} variant="outline" size="lg" className="mt-6 w-full">
        Entendido
      </Button>
    </ModalShell>
  );
}

export function EditOrderModal({ editingOrder, setEditingOrder, onSave, onClose }) {
  const isPaid = editingOrder.payment_status === 'paid' || editingOrder.paid;
  return (
    <ModalShell
      eyebrow="Pedido"
      title={`#${editingOrder.id.slice(0, 6)}`}
      subtitle={isPaid ? 'Pagado' : 'Pendiente'}
      onClose={onClose}
    >
      <div
        className={`mb-5 flex items-center justify-between rounded-[var(--radius-md)] border p-3 ${
          isPaid ? 'border-acid/30 bg-acid/[0.05]' : 'border-ml/30 bg-ml/[0.05]'
        }`}
      >
        <span className="mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
          Estado del pago
        </span>
        <span
          className={`mono text-[11px] font-semibold uppercase tracking-[0.22em] ${
            isPaid ? 'text-acid' : 'text-ml-soft'
          }`}
        >
          {isPaid ? 'Pagado ✓' : 'Pendiente'}
        </span>
      </div>
      {editingOrder.payment_id && (
        <p className="mono mb-4 text-right text-[10px] uppercase tracking-[0.2em] text-text-subtle">
          Ref MP: {editingOrder.payment_id}
        </p>
      )}
      <form onSubmit={onSave} className="space-y-4">
        <AdminInput
          label="Nombre del cliente"
          value={editingOrder.customer_name}
          onChange={(e) => setEditingOrder({ ...editingOrder, customer_name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <AdminInput
            label="Total ($)"
            type="number"
            value={editingOrder.total}
            onChange={(e) => setEditingOrder({ ...editingOrder, total: e.target.value })}
          />
          <AdminSelect
            label="Estado"
            value={editingOrder.status}
            onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
          >
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="listo">Listo</option>
            <option value="entregado">Entregado</option>
            <option value="archivado">Archivado</option>
            <option value="rechazado">Rechazado</option>
          </AdminSelect>
        </div>
        <AdminSelect
          label="Pago"
          value={editingOrder.payment_method}
          onChange={(e) => setEditingOrder({ ...editingOrder, payment_method: e.target.value })}
        >
          <option value="efectivo">Efectivo</option>
          <option value="mercadopago">Mercado Pago</option>
        </AdminSelect>
        <AdminTextarea
          label="Nota"
          className="h-20"
          rows="3"
          value={editingOrder.note || ''}
          onChange={(e) => setEditingOrder({ ...editingOrder, note: e.target.value })}
        />
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-[var(--radius-md)] bg-ml py-3 text-sm font-semibold text-white hover:brightness-110"
        >
          Guardar cambios
        </button>
      </form>
    </ModalShell>
  );
}

export function AssignRiderModal({ order, riders, getBranchName, onAssign, onClose }) {
  const candidates = riders.filter((r) => !r.branch_id || r.branch_id === order.branch_id);
  return (
    <ModalShell
      eyebrow="Asignar"
      title="Elegir rider"
      subtitle={getBranchName(order.branch_id)}
      onClose={onClose}
    >
      <div className="space-y-2">
        {candidates.map((r) => (
          <button
            key={r.id}
            onClick={() => onAssign(r.id)}
            className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-rule-strong bg-ink-3 p-3 text-left transition-colors hover:border-acid"
          >
            <span className="flex items-center gap-2 font-semibold text-text">
              <Bike className="h-4 w-4" /> {r.name}
            </span>
            <span className="mono rounded-sm bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] text-text-muted">
              Asignar
            </span>
          </button>
        ))}
        {candidates.length === 0 && (
          <div className="rounded-[var(--radius-md)] border border-signal/30 bg-signal/10 p-4 text-center">
            <p className="mono text-[11px] uppercase tracking-[0.22em] text-signal-soft">
              No hay riders en esta sucursal
            </p>
            <p className="mt-1 text-xs text-text-muted">Creá uno en la pestaña Riders.</p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function ProductExtrasInput({ tempExtra, setTempExtra, extras, onAdd, onRemove }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-rule bg-ink-3 p-4">
      <Eyebrow>
        <Plus className="h-3 w-3" /> Extras opcionales
      </Eyebrow>
      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-[var(--radius-sm)] border border-rule bg-ink p-2 text-sm text-text placeholder:text-text-subtle focus:border-text focus:outline-none"
          placeholder="Ej: Bacon"
          value={tempExtra.name}
          onChange={(e) => setTempExtra({ ...tempExtra, name: e.target.value })}
        />
        <input
          className="num w-20 rounded-[var(--radius-sm)] border border-rule bg-ink p-2 text-sm text-text placeholder:text-text-subtle focus:border-text focus:outline-none"
          placeholder="$"
          type="number"
          value={tempExtra.price}
          onChange={(e) => setTempExtra({ ...tempExtra, price: e.target.value })}
        />
        <button
          type="button"
          onClick={onAdd}
          className="rounded-[var(--radius-sm)] bg-white/5 px-3 hover:bg-white/10"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {extras.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {extras.map((ex, i) => (
            <span
              key={i}
              className="mono inline-flex items-center gap-1 rounded-sm border border-rule bg-ink px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-text"
            >
              {ex.name} · <span className="num text-acid">${ex.price}</span>
              <button type="button" onClick={() => onRemove(i)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductModalBody({ state, setState, tempExtra, setTempExtra, uploadingImage, onImageUpload, onAddExtra, onRemoveExtra, isEdit }) {
  return (
    <>
      <AdminInput
        label="Nombre"
        value={state.name}
        onChange={(e) => setState({ ...state, name: e.target.value })}
      />
      <AdminTextarea
        label="Descripción"
        rows="3"
        value={state.description}
        onChange={(e) => setState({ ...state, description: e.target.value })}
      />
      <AdminInput
        label="Categoría"
        value={state.category}
        onChange={(e) => setState({ ...state, category: e.target.value })}
      />

      <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed border-rule-strong bg-ink-3 p-5 text-text-muted transition-colors hover:border-text-muted">
        {uploadingImage ? (
          <Loader2 className="h-6 w-6 animate-spin text-text" />
        ) : (
          <CloudUpload className="h-6 w-6" />
        )}
        <span className="mono mt-2 text-[10px] uppercase tracking-[0.22em]">
          {state.image ? 'Imagen cargada' : isEdit ? 'Cambiar foto' : 'Subir foto'}
        </span>
        <input type="file" className="absolute inset-0 cursor-pointer opacity-0" onChange={onImageUpload} />
      </div>

      <div className="rounded-[var(--radius-md)] border border-rule bg-ink-3 p-4">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-text">
            <Layers className="h-4 w-4" /> ¿Tiene variantes?
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-[color:var(--color-acid)]"
            checked={state.has_variants}
            onChange={(e) => setState({ ...state, has_variants: e.target.checked })}
          />
        </label>
        {!state.has_variants && (
          <AdminInput
            label="Precio único"
            type="number"
            className="mt-4"
            value={state.price}
            onChange={(e) => setState({ ...state, price: e.target.value })}
          />
        )}
      </div>

      <ProductExtrasInput
        tempExtra={tempExtra}
        setTempExtra={setTempExtra}
        extras={state.extras || []}
        onAdd={onAddExtra}
        onRemove={onRemoveExtra}
      />

      <div className="rounded-[var(--radius-md)] border border-rule bg-ink-3 p-4">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-text">
            <span className="text-lg">∞</span> ¿Stock infinito?
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-[color:var(--color-acid)]"
            checked={state.has_infinite_stock}
            onChange={(e) => setState({ ...state, has_infinite_stock: e.target.checked })}
          />
        </label>
        {!state.has_infinite_stock && (
          <AdminInput
            label="Cantidad en stock"
            type="number"
            className="mt-4"
            value={state.stock}
            onChange={(e) => setState({ ...state, stock: e.target.value })}
          />
        )}
      </div>
    </>
  );
}

export function CreateProductModal({
  newProduct,
  setNewProduct,
  tempExtra,
  setTempExtra,
  accentColor,
  contrastTextColor,
  uploadingImage,
  onImageUpload,
  onAddExtra,
  onRemoveExtra,
  onSubmit,
  onClose,
}) {
  return (
    <ModalShell eyebrow="Producto" title="Nuevo producto" onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <ProductModalBody
          state={newProduct}
          setState={setNewProduct}
          tempExtra={tempExtra}
          setTempExtra={setTempExtra}
          uploadingImage={uploadingImage}
          onImageUpload={onImageUpload}
          onAddExtra={() => onAddExtra(false)}
          onRemoveExtra={(i) => onRemoveExtra(i, false)}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" onClick={onClose} variant="outline" size="md" className="flex-1">
            Cancelar
          </Button>
          <button
            type="submit"
            className="flex-1 rounded-[var(--radius-md)] py-3 text-sm font-semibold"
            style={{ backgroundColor: accentColor, color: contrastTextColor }}
          >
            Guardar
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function EditProductModal({
  editingProduct,
  setEditingProduct,
  tempExtra,
  setTempExtra,
  uploadingImage,
  onImageUpload,
  onAddExtra,
  onRemoveExtra,
  onSubmit,
  onClose,
}) {
  return (
    <ModalShell eyebrow="Producto" title="Editar producto" onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <ProductModalBody
          state={editingProduct}
          setState={setEditingProduct}
          tempExtra={tempExtra}
          setTempExtra={setTempExtra}
          uploadingImage={uploadingImage}
          onImageUpload={onImageUpload}
          onAddExtra={() => onAddExtra(true)}
          onRemoveExtra={(i) => onRemoveExtra(i, true)}
          isEdit
        />
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-[var(--radius-md)] bg-ml py-3 text-sm font-semibold text-white hover:brightness-110"
        >
          Guardar cambios
        </button>
      </form>
    </ModalShell>
  );
}

export function PromoModal({ promoTargetItem, promoConfig, setPromoConfig, onSubmit, onClose }) {
  return (
    <ModalShell
      eyebrow="Marketing"
      title="Crear promoción"
      subtitle={promoTargetItem.name}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          {[
            { key: 'discount', label: '% Descuento' },
            { key: 'nxm', label: 'NxM' },
          ].map((t) => {
            const active = promoConfig.type === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setPromoConfig({ ...promoConfig, type: t.key })}
                className={`mono flex-1 rounded-[var(--radius-sm)] border py-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                  active
                    ? 'border-acid bg-acid/10 text-acid'
                    : 'border-rule-strong text-text-muted hover:border-text-muted hover:text-text'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {promoConfig.type === 'discount' && (
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3">
            <span className="mono text-text-muted">%</span>
            <input
              className="num w-full bg-transparent text-lg font-semibold text-text outline-none"
              type="number"
              value={promoConfig.value}
              onChange={(e) => setPromoConfig({ ...promoConfig, value: e.target.value })}
            />
          </div>
        )}
        {promoConfig.type === 'nxm' && (
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3">
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">Lleva</span>
              <input
                className="num mt-1 w-full bg-transparent text-lg font-semibold text-text outline-none"
                type="number"
                value={promoConfig.buy}
                onChange={(e) => setPromoConfig({ ...promoConfig, buy: e.target.value })}
              />
            </div>
            <span className="mono text-text-subtle">×</span>
            <div className="flex-1 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3">
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">Paga</span>
              <input
                className="num mt-1 w-full bg-transparent text-lg font-semibold text-text outline-none"
                type="number"
                value={promoConfig.pay}
                onChange={(e) => setPromoConfig({ ...promoConfig, pay: e.target.value })}
              />
            </div>
          </div>
        )}
        <button
          onClick={onSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-acid py-3 text-sm font-semibold text-ink hover:brightness-110"
        >
          <Zap className="h-4 w-4" /> Lanzar promoción
        </button>
      </div>
    </ModalShell>
  );
}

export function PriceModal({ priceConfig, setPriceConfig, onApply, onClose }) {
  return (
    <ModalShell
      eyebrow="Catálogo"
      title="Ajuste masivo"
      subtitle="Aplicar a todo el menú"
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          {[
            { key: 'increase', label: 'Aumentar', tone: 'acid' },
            { key: 'decrease', label: 'Reducir', tone: 'signal' },
          ].map((a) => {
            const active = priceConfig.action === a.key;
            return (
              <button
                key={a.key}
                onClick={() => setPriceConfig({ ...priceConfig, action: a.key })}
                className={`mono flex-1 rounded-[var(--radius-sm)] border py-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                  active
                    ? a.tone === 'acid'
                      ? 'border-acid bg-acid/10 text-acid'
                      : 'border-signal bg-signal/10 text-signal-soft'
                    : 'border-rule-strong text-text-muted hover:text-text'
                }`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          {[
            { key: 'percent', label: '% Porcentaje' },
            { key: 'fixed', label: '$ Fijo' },
          ].map((t) => {
            const active = priceConfig.type === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setPriceConfig({ ...priceConfig, type: t.key })}
                className={`mono flex-1 rounded-[var(--radius-sm)] border py-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                  active
                    ? 'border-ml bg-ml/10 text-ml-soft'
                    : 'border-rule-strong text-text-muted hover:text-text'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <input
          type="number"
          placeholder="Valor (ej: 10)"
          className="num w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-center text-lg font-semibold text-text focus:border-text focus:outline-none"
          value={priceConfig.value}
          onChange={(e) => setPriceConfig({ ...priceConfig, value: e.target.value })}
        />
        <button
          onClick={onApply}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-ml py-3 text-sm font-semibold text-white hover:brightness-110"
        >
          <TrendingUp className="h-4 w-4" /> Aplicar a todo el menú
        </button>
      </div>
    </ModalShell>
  );
}

export function CouponModal({ newCoupon, setNewCoupon, accentColor, contrastTextColor, onSubmit, onClose }) {
  return (
    <ModalShell eyebrow="Marketing" title="Nuevo cupón" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="eyebrow mb-2 block">Código</label>
          <input
            className="mono w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm uppercase tracking-[0.2em] text-text focus:border-text focus:outline-none"
            placeholder="RIVA10"
            value={newCoupon.code}
            onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
            required
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="mono text-[11px] uppercase tracking-[0.22em] text-text-muted">Descuento</span>
          <input
            className="num flex-1 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-center text-lg font-semibold text-text focus:border-text focus:outline-none"
            type="number"
            min="1"
            max="100"
            value={newCoupon.discount}
            onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
          />
          <span className="mono text-lg font-semibold text-acid">%</span>
        </div>
        <div>
          <label className="eyebrow mb-2 block">Cantidad de usos</label>
          <input
            className="num w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-center text-lg font-semibold text-text focus:border-text focus:outline-none"
            type="number"
            min="1"
            placeholder="Sin límite"
            value={newCoupon.max_uses}
            onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
          />
          <p className="mt-1 text-[11px] text-text-muted">Dejalo vacío para usos ilimitados</p>
        </div>
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-[var(--radius-md)] py-3 text-sm font-semibold"
          style={{ backgroundColor: accentColor, color: contrastTextColor }}
        >
          Crear cupón
        </button>
      </form>
    </ModalShell>
  );
}

export function CreateRiderModal({
  newRider,
  setNewRider,
  branches,
  accentColor,
  contrastTextColor,
  onSubmit,
  onClose,
}) {
  return (
    <ModalShell eyebrow="Flota" title="Nuevo rider" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <AdminInput
          label="Nombre"
          value={newRider.name}
          onChange={(e) => setNewRider({ ...newRider, name: e.target.value })}
          required
        />
        <AdminInput
          label="PIN de acceso"
          className="mono"
          value={newRider.access_pin}
          onChange={(e) => setNewRider({ ...newRider, access_pin: e.target.value })}
          required
        />
        <AdminSelect
          label="Sucursal"
          value={newRider.branch_id || ''}
          onChange={(e) => setNewRider({ ...newRider, branch_id: e.target.value })}
          required
        >
          <option value="">Elegí sucursal…</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </AdminSelect>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] py-3 text-sm font-semibold"
          style={{ backgroundColor: accentColor, color: contrastTextColor }}
        >
          <Bike className="h-4 w-4" /> Crear rider
        </button>
      </form>
    </ModalShell>
  );
}
