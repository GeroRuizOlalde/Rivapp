import React from 'react';
import {
  X, MapPin, Mail, Bike, Layers, Plus, Zap, TrendingUp, CloudUpload, Loader2,
  Crown, Store, User,
} from 'lucide-react';
import Button from '../../components/shared/ui/Button';
import Eyebrow from '../../components/shared/ui/Eyebrow';
import Rule from '../../components/shared/ui/Rule';

function ModalShell({ title, subtitle, eyebrow, onClose, maxWidth = 'max-w-md', children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-ink/90 p-4 backdrop-blur-sm anim-fade">
      <div
        className={`relative my-8 w-full overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 shadow-[var(--shadow-editorial)] ${maxWidth}`}
      >
        <div className="flex items-start justify-between border-b border-rule p-6">
          <div>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h2 className="display mt-2 text-2xl text-text">{title}</h2>
            {subtitle && (
              <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-rule p-2 text-text-muted hover:border-text hover:text-text"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
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
        <AdminInput
          label="Dirección"
          value={branchForm.address}
          onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
        />
        <AdminInput
          label="Teléfono"
          value={branchForm.phone}
          onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <AdminInput
            label="Latitud"
            value={branchForm.lat || ''}
            onChange={(e) => setBranchForm({ ...branchForm, lat: e.target.value })}
          />
          <AdminInput
            label="Longitud"
            value={branchForm.lng || ''}
            onChange={(e) => setBranchForm({ ...branchForm, lng: e.target.value })}
          />
        </div>
        <button
          type="button"
          onClick={onGetLocation}
          className="mono flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] py-2 text-[11px] uppercase tracking-[0.22em] text-ml-soft hover:text-text"
        >
          <MapPin className="h-3.5 w-3.5" /> Detectar mi ubicación
        </button>
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

export function TeamModal({ newMember, setNewMember, branches, onSubmit, onClose }) {
  return (
    <ModalShell
      eyebrow="Equipo"
      title="Invitar miembro"
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="space-y-4">
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
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'manager', label: 'Gerente', tone: 'acid' },
              { key: 'staff', label: 'Cajero', tone: 'ml' },
              { key: 'admin', label: 'Admin', tone: 'signal' },
            ].map((r) => {
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
        </div>
        {(newMember.role === 'manager' || newMember.role === 'staff') && (
          <AdminSelect
            label="Sucursal asignada"
            value={newMember.branch_id}
            onChange={(e) => setNewMember({ ...newMember, branch_id: e.target.value })}
            required
          >
            <option value="">Elegí una sucursal…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </AdminSelect>
        )}
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-[var(--radius-md)] bg-acid py-3 text-sm font-semibold text-ink hover:brightness-110"
        >
          Enviar invitación
        </button>
      </form>
    </ModalShell>
  );
}

export function RolesModal({ onClose }) {
  return (
    <ModalShell
      eyebrow="Referencia"
      title="Niveles de acceso"
      subtitle="Qué puede hacer cada rol"
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="grid gap-3">
        {[
          {
            icon: Crown,
            title: 'Admin (Dueño)',
            tone: 'signal',
            desc: 'Acceso total a todo el negocio.',
            bullets: [
              'Ve y gestiona todas las sucursales',
              'Acceso a facturación y suscripción',
              'Crear/borrar productos y empleados',
              'Configuración global de la marca',
            ],
          },
          {
            icon: Store,
            title: 'Gerente (Manager)',
            tone: 'acid',
            desc: 'Líder de una sucursal específica.',
            bullets: [
              'Solo ve los datos de su sucursal asignada',
              'Puede editar menú y precios',
              'Gestiona los riders del local',
              'Ve métricas de venta locales',
            ],
          },
          {
            icon: User,
            title: 'Cajero (Staff)',
            tone: 'ml',
            desc: 'Operativo para el día a día.',
            bullets: [
              'Recibe y gestiona pedidos (Confirmar, Listo, Entregar)',
              'Puede abrir/cerrar la sucursal',
            ],
          },
        ].map((role) => {
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
            value={newCoupon.discount}
            onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
          />
          <span className="mono text-lg font-semibold text-acid">%</span>
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
