import { Bike, Camera, CreditCard, Edit, Globe, MapPin, Plus, Save, Star, Trash2 } from 'lucide-react';

export default function ConfigTab({
  viewBranchId,
  branches,
  branchForm,
  setBranchForm,
  settingsForm,
  setSettingsForm,
  accentColor,
  contrastTextColor,
  getBranchName,
  onOpenNewBranchModal,
  onOpenEditBranchModal,
  onSetMainBranch,
  onDeleteBranch,
  onStoreImageUpload,
  onSaveSettings,
  onGetBranchLocation,
  onUpdateBranchDetails,
}) {
  const isGlobalConfig = !viewBranchId;

  return (
    <div className="space-y-6 animate-in fade-in max-w-2xl">
      {isGlobalConfig ? (
        <>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="text-[#d0ff00]" /> Configuracion Global
          </h1>
          <p className="text-gray-400 text-sm">Gestiona la marca, pagos y crea nuevas sucursales.</p>

          <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <MapPin className="text-[#d0ff00]" /> Mis Sucursales
              </h3>
              <button
                onClick={onOpenNewBranchModal}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Plus size={16} /> Nueva Sucursal
              </button>
            </div>

            <div className="space-y-3">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${
                    branch.is_main ? 'bg-[#d0ff00]/5 border-[#d0ff00]/30' : 'bg-black/30 border-white/5'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      {branch.name}
                      {branch.is_main && (
                        <span className="bg-[#d0ff00] text-black text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest">
                          Principal
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">{branch.address}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSetMainBranch(branch.id)}
                      title="Marcar Principal"
                      className={`p-2 rounded-lg transition-colors ${branch.is_main ? 'text-[#d0ff00]' : 'text-gray-600 hover:text-[#d0ff00]'}`}
                    >
                      <Star size={18} fill={branch.is_main ? '#d0ff00' : 'transparent'} />
                    </button>
                    <button onClick={() => onOpenEditBranchModal(branch)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => onDeleteBranch(branch.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="h-40 bg-black/50 rounded-xl w-full relative overflow-hidden group">
              <img src={settingsForm.banner_url || 'https://placehold.co/600x200'} className="w-full h-full object-cover opacity-50" />
              <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/40 transition-colors">
                <div className="bg-black/50 p-2 rounded-full text-white flex items-center gap-2 text-xs font-bold border border-white/20">
                  <Camera size={16} /> Cambiar Portada
                </div>
                <input type="file" className="hidden" onChange={(event) => onStoreImageUpload(event, 'banner')} />
              </label>
            </div>

            <div className="absolute top-32 left-6">
              <div className="w-24 h-24 rounded-full bg-black border-4 border-[#1a1a1a] relative group overflow-hidden">
                <img src={settingsForm.logo_url || 'https://placehold.co/100'} className="w-full h-full object-cover" />
                <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={20} className="text-white" />
                  <input type="file" className="hidden" onChange={(event) => onStoreImageUpload(event, 'logo')} />
                </label>
              </div>
            </div>

            <div className="mt-14 space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Nombre del Local</label>
                <input
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white font-bold mt-1"
                  value={settingsForm.store_name}
                  onChange={(event) => setSettingsForm({ ...settingsForm, store_name: event.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Color de Marca</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                    value={settingsForm.color_accent}
                    onChange={(event) => setSettingsForm({ ...settingsForm, color_accent: event.target.value })}
                  />
                  <span className="text-xs text-gray-400 font-mono">{settingsForm.color_accent}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-widest border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
              <Bike size={16} /> Configuracion de Envios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Precio Base ($)</label>
                <input
                  type="number"
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1"
                  value={settingsForm.delivery_base_price}
                  onChange={(event) => setSettingsForm({ ...settingsForm, delivery_base_price: event.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Precio x Km ($)</label>
                <input
                  type="number"
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1"
                  value={settingsForm.delivery_price_per_km}
                  onChange={(event) => setSettingsForm({ ...settingsForm, delivery_price_per_km: event.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
              <input
                type="checkbox"
                className="w-5 h-5 accent-[#d0ff00]"
                checked={settingsForm.charge_delivery_in_mp}
                onChange={(event) => setSettingsForm({ ...settingsForm, charge_delivery_in_mp: event.target.checked })}
              />
              <div>
                <p className="text-sm font-bold text-white">Cobrar envio en Mercado Pago</p>
                <p className="text-xs text-gray-500">Si se desactiva, el envio se cobra en efectivo al entregar.</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/10 p-6 rounded-3xl border border-blue-500/20 space-y-4">
            <h3 className="text-blue-400 font-bold text-sm flex items-center gap-2">
              <CreditCard size={16} /> Integracion Mercado Pago (Cobros Online)
            </h3>
            <p className="text-xs text-gray-400">Pega aqui tus credenciales de produccion. Estos datos se guardan encriptados.</p>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">Access Token (Production)</label>
              <input
                className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1"
                type="password"
                placeholder="APP_USR-..."
                value={settingsForm.mp_access_token}
                onChange={(event) => setSettingsForm({ ...settingsForm, mp_access_token: event.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">Public Key (Production)</label>
              <input
                className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1"
                placeholder="TEST-..."
                value={settingsForm.mp_public_key}
                onChange={(event) => setSettingsForm({ ...settingsForm, mp_public_key: event.target.value })}
              />
            </div>
          </div>

          <button
            onClick={onSaveSettings}
            className="w-full py-4 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
            style={{ backgroundColor: accentColor, color: contrastTextColor }}
          >
            <Save size={20} /> Guardar Cambios Globales
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">{getBranchName(viewBranchId)}</h1>
              <p className="text-gray-400 text-sm">Configurando datos especificos de este local.</p>
            </div>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-widest border-b border-white/10 pb-2 mb-4">Informacion de Contacto</h3>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">Direccion Fisica</label>
              <input
                className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1"
                value={branchForm.address}
                onChange={(event) => setBranchForm({ ...branchForm, address: event.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">Telefono / WhatsApp de Sucursal</label>
              <input
                className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1"
                value={branchForm.phone}
                onChange={(event) => setBranchForm({ ...branchForm, phone: event.target.value })}
              />
            </div>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-widest border-b border-white/10 pb-2 mb-4">Geolocalizacion</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Latitud</label>
                <input
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1"
                  value={branchForm.lat || ''}
                  onChange={(event) => setBranchForm({ ...branchForm, lat: event.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Longitud</label>
                <input
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white mt-1"
                  value={branchForm.lng || ''}
                  onChange={(event) => setBranchForm({ ...branchForm, lng: event.target.value })}
                />
              </div>
            </div>
            <button onClick={onGetBranchLocation} className="text-blue-400 text-xs font-bold flex items-center gap-2 hover:text-blue-300">
              <MapPin size={14} /> Usar mi ubicacion actual
            </button>
          </div>

          <button
            onClick={onUpdateBranchDetails}
            className="w-full py-4 rounded-xl font-bold bg-[#d0ff00] text-black shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} /> Actualizar Sucursal
          </button>
        </>
      )}
    </div>
  );
}
