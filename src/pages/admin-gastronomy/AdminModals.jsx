import React from 'react';
import {
  X, MapPin, Mail, Bike, Layers, Plus, Zap, TrendingUp, CloudUpload, Loader2,
  Crown, Store, User, InfinityIcon
} from 'lucide-react';

// --- Modal: Sucursal ---
export function BranchModal({ branchForm, setBranchForm, editingBranch, onSave, onClose, onGetLocation }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
        <h2 className="text-white font-bold text-xl mb-4">{editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
        <form onSubmit={onSave} className="space-y-4">
          <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Nombre (ej: Centro)" value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} />
          <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Dirección" value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} />
          <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Teléfono" value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className="bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Latitud" value={branchForm.lat || ''} onChange={e => setBranchForm({ ...branchForm, lat: e.target.value })} />
            <input className="bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Longitud" value={branchForm.lng || ''} onChange={e => setBranchForm({ ...branchForm, lng: e.target.value })} />
          </div>
          <button type="button" onClick={onGetLocation} className="w-full py-2 text-xs font-bold text-blue-400 flex items-center justify-center gap-1 hover:text-blue-300"><MapPin size={12} /> Detectar mi ubicación</button>
          <button type="submit" className="w-full py-3 rounded-xl font-bold bg-[#d0ff00] text-black">Guardar Sucursal</button>
        </form>
      </div>
    </div>
  );
}

// --- Modal: Invitar miembro ---
export function TeamModal({ newMember, setNewMember, branches, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
        <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2"><Mail className="text-[#d0ff00]" /> Invitar Miembro</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase">Email del Usuario</label>
            <input type="email" className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1" placeholder="ejemplo@email.com" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase">Rol</label>
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setNewMember({ ...newMember, role: 'manager' })} className={`flex-1 py-2 rounded-lg font-bold border ${newMember.role === 'manager' ? 'bg-[#d0ff00]/20 border-[#d0ff00] text-[#d0ff00]' : 'border-white/10 text-gray-500'}`}>Gerente</button>
              <button type="button" onClick={() => setNewMember({ ...newMember, role: 'staff' })} className={`flex-1 py-2 rounded-lg font-bold border ${newMember.role === 'staff' ? 'bg-blue-600/20 border-blue-600 text-blue-500' : 'border-white/10 text-gray-500'}`}>Cajero</button>
              <button type="button" onClick={() => setNewMember({ ...newMember, role: 'admin' })} className={`flex-1 py-2 rounded-lg font-bold border ${newMember.role === 'admin' ? 'bg-purple-600/20 border-purple-600 text-purple-500' : 'border-white/10 text-gray-500'}`}>Admin</button>
            </div>
          </div>
          {(newMember.role === 'manager' || newMember.role === 'staff') && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-xs text-gray-500 font-bold uppercase">Asignar a Sucursal</label>
              <select className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1 outline-none" value={newMember.branch_id} onChange={e => setNewMember({ ...newMember, branch_id: e.target.value })} required>
                <option value="">Selecciona una sucursal...</option>
                {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>
          )}
          <button type="submit" className="w-full py-3 rounded-xl font-bold bg-[#d0ff00] text-black shadow-lg">Enviar Invitación</button>
        </form>
      </div>
    </div>
  );
}

// --- Modal: Roles ---
export function RolesModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
      <div className="bg-[#1a1a1a] p-8 rounded-3xl w-full max-w-2xl border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X size={24} /></button>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2">Niveles de Acceso</h2>
          <p className="text-gray-400">¿Qué puede hacer cada miembro de tu equipo?</p>
        </div>
        <div className="grid gap-4">
          <div className="bg-black/40 p-4 rounded-2xl border border-purple-500/30 flex gap-4">
            <div className="bg-purple-500/20 p-3 rounded-xl h-fit text-purple-400"><Crown size={24} /></div>
            <div>
              <h3 className="text-purple-400 font-bold text-lg">Admin (Dueño)</h3>
              <p className="text-gray-300 text-sm mb-2">Acceso total a todo el negocio.</p>
              <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                <li>Ve y gestiona <strong>todas las sucursales</strong>.</li>
                <li>Acceso a Facturación y Suscripción.</li>
                <li>Puede crear/borrar productos y empleados.</li>
                <li>Configuración global de la marca.</li>
              </ul>
            </div>
          </div>
          <div className="bg-black/40 p-4 rounded-2xl border border-[#d0ff00]/30 flex gap-4">
            <div className="bg-[#d0ff00]/20 p-3 rounded-xl h-fit text-[#d0ff00]"><Store size={24} /></div>
            <div>
              <h3 className="text--[#d0ff00] font-bold text-lg">Gerente (Manager)</h3>
              <p className="text-gray-300 text-sm mb-2">Líder de una sucursal específica.</p>
              <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                <li>Solo ve los datos de <strong>SU sucursal asignada</strong>.</li>
                <li>Puede editar el Menú y Precios.</li>
                <li>Gestiona los Riders de su local.</li>
                <li>Ve métricas de ventas de su local.</li>
              </ul>
            </div>
          </div>
          <div className="bg-black/40 p-4 rounded-2xl border border-blue-500/30 flex gap-4">
            <div className="bg-blue-500/20 p-3 rounded-xl h-fit text-blue-400"><User size={24} /></div>
            <div>
              <h3 className="text-blue-400 font-bold text-lg">Cajero (Staff)</h3>
              <p className="text-gray-300 text-sm mb-2">Operativo para el día a día.</p>
              <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                <li>Recibe y gestiona pedidos (Confirmar, Listo, Entregar).</li>
                <li>Puede abrir/cerrar la sucursal.</li>
              </ul>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white transition-colors">Entendido</button>
      </div>
    </div>
  );
}

// --- Modal: Editar Pedido ---
export function EditOrderModal({ editingOrder, setEditingOrder, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
        <h2 className="text-white font-bold text-xl mb-4">Editar Pedido #{editingOrder.id.slice(0,6)}</h2>
        <div className="mb-4 bg-[#111] p-3 rounded-xl border border-white/5 flex justify-between items-center">
          <span className="text-gray-400 text-xs">Estado del Pago</span>
          <span className={`font-bold text-sm ${(editingOrder.payment_status === 'paid' || editingOrder.paid) ? 'text-green-500' : 'text-blue-400'}`}>
            {(editingOrder.payment_status === 'paid' || editingOrder.paid) ? 'PAGADO' : 'PENDIENTE'}
          </span>
        </div>
        {editingOrder.payment_id && (<div className="text-xs text-gray-500 mb-4 text-right font-mono">Ref MP: {editingOrder.payment_id}</div>)}
        <form onSubmit={onSave} className="space-y-4">
          <div><label className="text-xs text-gray-400">Nombre Cliente</label><input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" value={editingOrder.customer_name} onChange={e => setEditingOrder({ ...editingOrder, customer_name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-gray-400">Total ($)</label><input type="number" className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" value={editingOrder.total} onChange={e => setEditingOrder({ ...editingOrder, total: e.target.value })} /></div>
            <div><label className="text-xs text-gray-400">Estado</label><select className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" value={editingOrder.status} onChange={e => setEditingOrder({ ...editingOrder, status: e.target.value })}><option value="pendiente">Pendiente</option><option value="confirmado">Confirmado</option><option value="listo">Listo</option><option value="entregado">Entregado</option><option value="archivado">Archivado</option><option value="rechazado">Rechazado</option></select></div>
          </div>
          <div><label className="text-xs text-gray-400">Pago</label><select className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" value={editingOrder.payment_method} onChange={e => setEditingOrder({ ...editingOrder, payment_method: e.target.value })}><option value="efectivo">Efectivo</option><option value="mercadopago">MercadoPago</option></select></div>
          <div><label className="text-xs text-gray-400">Nota</label><textarea className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white h-20 resize-none" value={editingOrder.note || ''} onChange={e => setEditingOrder({ ...editingOrder, note: e.target.value })} /></div>
          <button type="submit" className="w-full py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500">Guardar Cambios</button>
        </form>
      </div>
    </div>
  );
}

// --- Modal: Asignar Rider ---
export function AssignRiderModal({ order, riders, getBranchName, onAssign, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
        <h2 className="text-white font-bold text-xl mb-1">Asignar Rider</h2>
        <p className="text-xs text-gray-500 mb-4">Para pedido en: <strong className="text-[#d0ff00]">{getBranchName(order.branch_id)}</strong></p>
        <div className="space-y-2">
          {riders.filter(r => !r.branch_id || r.branch_id === order.branch_id).map(r => (
            <button key={r.id} onClick={() => onAssign(r.id)} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white flex justify-between items-center hover:border-white/30 hover:bg-white/5 transition-all">
              <span className="font-bold flex items-center gap-2"><Bike size={16} /> {r.name}</span>
              <span className="text-xs bg-white/10 px-2 py-1 rounded">Seleccionar</span>
            </button>
          ))}
          {riders.filter(r => !r.branch_id || r.branch_id === order.branch_id).length === 0 && (
            <div className="text-center py-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <p className="text-red-500 text-sm font-bold">No hay riders en esta sucursal.</p>
              <p className="text-xs text-gray-400 mt-1">Crea uno en la pestaña Riders.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Modal: Crear Producto ---
export function CreateProductModal({ newProduct, setNewProduct, tempExtra, setTempExtra, accentColor, contrastTextColor, uploadingImage, onImageUpload, onAddExtra, onRemoveExtra, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] overflow-y-auto">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
        <h2 className="text-white font-bold text-xl mb-4">Nuevo Producto</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Nombre" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
          <textarea className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white h-20 resize-none" placeholder="Descripción" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
          <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Categoría" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
          <div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:border-white/30 transition-colors cursor-pointer relative">
            {uploadingImage ? <Loader2 className="animate-spin text-white" /> : <CloudUpload size={24} />}
            <span className="text-xs mt-2">{newProduct.image ? "Imagen cargada" : "Subir Foto"}</span>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onImageUpload} />
          </div>
          <div className="bg-white/5 p-3 rounded-xl">
            <div className="flex items-center justify-between mb-2"><label className="text-sm font-bold flex items-center gap-2"><Layers size={16} /> ¿Tiene Variantes?</label><input type="checkbox" className="w-5 h-5 accent-orange-500" checked={newProduct.has_variants} onChange={e => setNewProduct({ ...newProduct, has_variants: e.target.checked })} /></div>
            {!newProduct.has_variants && (<input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Precio Único" type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />)}
          </div>
          <ProductExtrasInput tempExtra={tempExtra} setTempExtra={setTempExtra} extras={newProduct.extras} onAdd={() => onAddExtra(false)} onRemove={(i) => onRemoveExtra(i, false)} />
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl"><label className="text-sm font-bold flex items-center gap-2"><span className="text-lg">∞</span> ¿Stock Infinito?</label><input type="checkbox" className="w-5 h-5 accent-orange-500" checked={newProduct.has_infinite_stock} onChange={e => setNewProduct({ ...newProduct, has_infinite_stock: e.target.checked })} /></div>
          {!newProduct.has_infinite_stock && (<input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Cantidad Stock" type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} />)}
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-700 py-3 rounded-xl font-bold">Cancelar</button>
            <button type="submit" className="flex-1 py-3 rounded-xl font-bold" style={{ backgroundColor: accentColor, color: contrastTextColor }}>Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Modal: Editar Producto ---
export function EditProductModal({ editingProduct, setEditingProduct, tempExtra, setTempExtra, uploadingImage, onImageUpload, onAddExtra, onRemoveExtra, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] overflow-y-auto">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
        <h2 className="text-white font-bold text-xl mb-4">Editar Producto</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
          <textarea className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white h-20 resize-none" value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} />
          <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} />
          <div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:border-white/30 transition-colors cursor-pointer relative">
            {uploadingImage ? <Loader2 className="animate-spin text-white" /> : <CloudUpload size={24} />}
            <span className="text-xs mt-2">Cambiar Foto</span>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onImageUpload} />
          </div>
          <div className="bg-white/5 p-3 rounded-xl">
            <div className="flex items-center justify-between mb-2"><label className="text-sm font-bold flex items-center gap-2"><Layers size={16} /> ¿Tiene Variantes?</label><input type="checkbox" className="w-5 h-5 accent-orange-500" checked={editingProduct.has_variants} onChange={e => setEditingProduct({ ...editingProduct, has_variants: e.target.checked })} /></div>
            {!editingProduct.has_variants && (<input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} />)}
          </div>
          <ProductExtrasInput tempExtra={tempExtra} setTempExtra={setTempExtra} extras={editingProduct.extras || []} onAdd={() => onAddExtra(true)} onRemove={(i) => onRemoveExtra(i, true)} />
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl"><label className="text-sm font-bold flex items-center gap-2"><span className="text-lg">∞</span> ¿Stock Infinito?</label><input type="checkbox" className="w-5 h-5 accent-orange-500" checked={editingProduct.has_infinite_stock} onChange={e => setEditingProduct({ ...editingProduct, has_infinite_stock: e.target.checked })} /></div>
          {!editingProduct.has_infinite_stock && (<input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" type="number" value={editingProduct.stock} onChange={e => setEditingProduct({ ...editingProduct, stock: e.target.value })} />)}
          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4">Guardar Cambios</button>
        </form>
      </div>
    </div>
  );
}

// --- Shared: Extras input ---
function ProductExtrasInput({ tempExtra, setTempExtra, extras, onAdd, onRemove }) {
  return (
    <div className="bg-white/5 p-3 rounded-xl">
      <label className="text-sm font-bold flex items-center gap-2 mb-2"><Plus size={16} /> Extras (Opcional)</label>
      <div className="flex gap-2 mb-2">
        <input className="flex-1 bg-black/50 border border-white/10 p-2 rounded-lg text-sm text-white" placeholder="Ej: Bacon" value={tempExtra.name} onChange={e => setTempExtra({ ...tempExtra, name: e.target.value })} />
        <input className="w-20 bg-black/50 border border-white/10 p-2 rounded-lg text-sm text-white" placeholder="$" type="number" value={tempExtra.price} onChange={e => setTempExtra({ ...tempExtra, price: e.target.value })} />
        <button type="button" onClick={onAdd} className="bg-white/10 p-2 rounded-lg hover:bg-white/20"><Plus size={16} /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {extras.map((ex, i) => (<span key={i} className="bg-black/40 border border-white/10 px-2 py-1 rounded text-xs flex items-center gap-1">{ex.name} (${ex.price}) <button type="button" onClick={() => onRemove(i)}><X size={12} /></button></span>))}
      </div>
    </div>
  );
}

// --- Modal: Promo ---
export function PromoModal({ promoTargetItem, promoConfig, setPromoConfig, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
        <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2"><Zap className="text-yellow-500" /> Crear Promoción</h2>
        <p className="text-sm text-gray-400 mb-4">Producto: <strong className="text-white">{promoTargetItem.name}</strong></p>
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setPromoConfig({ ...promoConfig, type: 'discount' })} className={`flex-1 py-2 rounded-lg font-bold border ${promoConfig.type === 'discount' ? 'bg-blue-600/20 border-blue-600 text-blue-500' : 'border-white/10 text-gray-500'}`}>% Descuento</button>
            <button onClick={() => setPromoConfig({ ...promoConfig, type: 'nxm' })} className={`flex-1 py-2 rounded-lg font-bold border ${promoConfig.type === 'nxm' ? 'bg-purple-600/20 border-purple-600 text-purple-500' : 'border-white/10 text-gray-500'}`}>NxM</button>
          </div>
          {promoConfig.type === 'discount' && (
            <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl p-3"><span className="text-gray-400 font-bold">%</span><input className="bg-transparent text-white outline-none w-full text-lg font-bold" type="number" value={promoConfig.value} onChange={e => setPromoConfig({ ...promoConfig, value: e.target.value })} /></div>
          )}
          {promoConfig.type === 'nxm' && (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3"><label className="text-[10px] text-gray-500 block uppercase font-bold">Lleva</label><input className="bg-transparent text-white outline-none w-full text-lg font-bold" type="number" value={promoConfig.buy} onChange={e => setPromoConfig({ ...promoConfig, buy: e.target.value })} /></div>
              <span className="font-bold text-gray-500">X</span>
              <div className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3"><label className="text-[10px] text-gray-500 block uppercase font-bold">Paga</label><input className="bg-transparent text-white outline-none w-full text-lg font-bold" type="number" value={promoConfig.pay} onChange={e => setPromoConfig({ ...promoConfig, pay: e.target.value })} /></div>
            </div>
          )}
          <button onClick={onSubmit} className="w-full py-3 rounded-xl font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition-colors">Lanzar Promo</button>
        </div>
      </div>
    </div>
  );
}

// --- Modal: Precios Masivos ---
export function PriceModal({ priceConfig, setPriceConfig, onApply, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
        <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2"><TrendingUp /> Precios Masivos</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setPriceConfig({ ...priceConfig, action: 'increase' })} className={`flex-1 py-2 rounded-lg font-bold border ${priceConfig.action === 'increase' ? 'bg-green-600/20 border-green-600 text-green-500' : 'border-white/10 text-gray-500'}`}>Aumentar</button>
            <button onClick={() => setPriceConfig({ ...priceConfig, action: 'decrease' })} className={`flex-1 py-2 rounded-lg font-bold border ${priceConfig.action === 'decrease' ? 'bg-red-600/20 border-red-600 text-red-500' : 'border-white/10 text-gray-500'}`}>Reducir</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPriceConfig({ ...priceConfig, type: 'percent' })} className={`flex-1 py-2 rounded-lg font-bold border ${priceConfig.type === 'percent' ? 'bg-blue-600/20 border-blue-600 text-blue-500' : 'border-white/10 text-gray-500'}`}>% Porcentaje</button>
            <button onClick={() => setPriceConfig({ ...priceConfig, type: 'fixed' })} className={`flex-1 py-2 rounded-lg font-bold border ${priceConfig.type === 'fixed' ? 'bg-blue-600/20 border-blue-600 text-blue-500' : 'border-white/10 text-gray-500'}`}>$ Fijo</button>
          </div>
          <input type="number" placeholder="Valor (ej: 10)" className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-white text-center font-bold text-lg" value={priceConfig.value} onChange={e => setPriceConfig({ ...priceConfig, value: e.target.value })} />
          <button onClick={onApply} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600">Aplicar</button>
        </div>
      </div>
    </div>
  );
}

// --- Modal: Cupón ---
export function CouponModal({ newCoupon, setNewCoupon, accentColor, contrastTextColor, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
        <h2 className="text-white font-bold text-xl mb-4">Nuevo Cupón</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white uppercase" placeholder="CÓDIGO (ej: RIVA10)" value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })} />
          <div className="flex items-center gap-2"><span className="text-gray-400 font-bold">Descuento:</span><input className="w-20 bg-black/50 border border-white/10 p-2 rounded-lg text-white text-center" type="number" value={newCoupon.discount} onChange={e => setNewCoupon({ ...newCoupon, discount: e.target.value })} /><span className="text-white font-bold">%</span></div>
          <button className="w-full py-3 rounded-xl font-bold" style={{ backgroundColor: accentColor, color: contrastTextColor }}>Crear Cupón</button>
        </form>
      </div>
    </div>
  );
}

// --- Modal: Nuevo Rider ---
export function CreateRiderModal({ newRider, setNewRider, branches, accentColor, contrastTextColor, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
        <h2 className="text-white font-bold text-xl mb-4">Nuevo Rider</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="Nombre" value={newRider.name} onChange={e => setNewRider({ ...newRider, name: e.target.value })} required />
          <input className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" placeholder="PIN de Acceso" value={newRider.access_pin} onChange={e => setNewRider({ ...newRider, access_pin: e.target.value })} required />
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase ml-1">Asignar a Sucursal</label>
            <select className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1 outline-none" value={newRider.branch_id || ''} onChange={e => setNewRider({ ...newRider, branch_id: e.target.value })} required>
              <option value="">Selecciona sucursal...</option>
              {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
          <button className="w-full py-3 rounded-xl font-bold" style={{ backgroundColor: accentColor, color: contrastTextColor }}>Crear Rider</button>
        </form>
      </div>
    </div>
  );
}
