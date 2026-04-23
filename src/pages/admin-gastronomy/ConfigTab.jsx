import { Bike, Camera, CreditCard, Edit, Globe, MapPin, Plus, Save, Star, Trash2 } from 'lucide-react';
import Button from '../../components/shared/ui/Button';
import Eyebrow from '../../components/shared/ui/Eyebrow';
import Rule from '../../components/shared/ui/Rule';

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
    <div className="max-w-3xl space-y-8 anim-rise">
      {isGlobalConfig ? (
        <>
          <header>
            <Eyebrow>
              <Globe className="h-3 w-3" /> Global
            </Eyebrow>
            <h1 className="display mt-3 text-4xl md:text-5xl">
              Configuración <em className="display-italic" style={{ color: accentColor }}>marca</em>
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Marca, pagos y sucursales desde un solo lugar.
            </p>
          </header>

          {/* Sucursales */}
          <section className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
            <div className="flex items-center justify-between">
              <Eyebrow>
                <MapPin className="h-3 w-3" /> Sucursales
              </Eyebrow>
              <Button onClick={onOpenNewBranchModal} variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" /> Nueva
              </Button>
            </div>

            <Rule className="mt-4" />

            <div className="mt-5 space-y-2">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className={`flex items-center justify-between rounded-[var(--radius-md)] border p-4 transition-colors ${
                    branch.is_main ? 'border-acid/30 bg-acid/[0.05]' : 'border-rule bg-ink-3'
                  }`}
                >
                  <div>
                    <p className="display inline-flex items-center gap-2 text-lg text-text">
                      {branch.name}
                      {branch.is_main && (
                        <span
                          className="mono rounded-sm px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em]"
                          style={{ backgroundColor: accentColor, color: 'black' }}
                        >
                          Principal
                        </span>
                      )}
                    </p>
                    <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                      {branch.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSetMainBranch(branch.id)}
                      title="Marcar principal"
                      className="rounded-[var(--radius-sm)] p-2"
                      style={{ color: branch.is_main ? accentColor : 'var(--color-text-subtle)' }}
                    >
                      <Star className="h-4 w-4" fill={branch.is_main ? accentColor : 'transparent'} />
                    </button>
                    <button
                      onClick={() => onOpenEditBranchModal(branch)}
                      className="rounded-[var(--radius-sm)] p-2 text-ml-soft hover:bg-ml/10"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteBranch(branch.id)}
                      className="rounded-[var(--radius-sm)] p-2 text-signal hover:bg-signal/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Branding */}
          <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2">
            <div className="group relative h-44 w-full overflow-hidden bg-ink-3">
              <img
                src={settingsForm.banner_url || 'https://placehold.co/600x200'}
                alt="Portada"
                className="h-full w-full object-cover opacity-60"
              />
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-ink/30 transition-colors hover:bg-ink/60">
                <div className="mono inline-flex items-center gap-2 rounded-full border border-rule-strong bg-ink/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text backdrop-blur-md">
                  <Camera className="h-3.5 w-3.5" /> Cambiar portada
                </div>
                <input type="file" className="hidden" onChange={(event) => onStoreImageUpload(event, 'banner')} />
              </label>
            </div>

            <div className="absolute left-6 top-32">
              <div className="group relative h-24 w-24 overflow-hidden rounded-full border-[5px] border-ink-2 bg-ink-3">
                <img
                  src={settingsForm.logo_url || 'https://placehold.co/100'}
                  alt="Logo"
                  className="h-full w-full object-cover"
                />
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-ink/70 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-5 w-5 text-text" />
                  <input type="file" className="hidden" onChange={(event) => onStoreImageUpload(event, 'logo')} />
                </label>
              </div>
            </div>

            <div className="space-y-5 px-6 pb-6 pt-14">
              <div>
                <label className="eyebrow mb-2 block">Nombre del local</label>
                <input
                  className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm font-semibold text-text focus:border-text focus:outline-none"
                  value={settingsForm.store_name}
                  onChange={(event) => setSettingsForm({ ...settingsForm, store_name: event.target.value })}
                />
              </div>
              <div>
                <label className="eyebrow mb-2 block">Color de marca</label>
                <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3">
                  <input
                    type="color"
                    className="h-11 w-11 cursor-pointer rounded-[var(--radius-sm)] border-none bg-transparent"
                    value={settingsForm.color_accent}
                    onChange={(event) => setSettingsForm({ ...settingsForm, color_accent: event.target.value })}
                  />
                  <span className="mono text-sm uppercase text-text">{settingsForm.color_accent}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Envíos */}
          <section className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
            <Eyebrow>
              <Bike className="h-3 w-3" /> Envíos
            </Eyebrow>
            <Rule className="mt-4" />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="eyebrow mb-2 block">Precio base ($)</label>
                <input
                  type="number"
                  className="num w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-text focus:outline-none"
                  value={settingsForm.delivery_base_price}
                  onChange={(event) => setSettingsForm({ ...settingsForm, delivery_base_price: event.target.value })}
                />
              </div>
              <div>
                <label className="eyebrow mb-2 block">Precio por km ($)</label>
                <input
                  type="number"
                  className="num w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-text focus:outline-none"
                  value={settingsForm.delivery_price_per_km}
                  onChange={(event) => setSettingsForm({ ...settingsForm, delivery_price_per_km: event.target.value })}
                />
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-rule bg-ink-3 p-4">
              <input
                type="checkbox"
                className="h-5 w-5"
                style={{ accentColor }}
                checked={settingsForm.charge_delivery_in_mp}
                onChange={(event) => setSettingsForm({ ...settingsForm, charge_delivery_in_mp: event.target.checked })}
              />
              <div>
                <p className="text-sm font-semibold text-text">Cobrar envío en Mercado Pago</p>
                <p className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                  Si se desactiva, el envío se cobra al entregar
                </p>
              </div>
            </label>
          </section>

          {/* Mercado Pago */}
          <section className="rounded-[var(--radius-xl)] border border-ml/30 bg-ml/[0.05] p-6">
            <Eyebrow tone="ml">
              <CreditCard className="h-3 w-3" /> Integración Mercado Pago
            </Eyebrow>
            <p className="mt-3 text-sm text-text-muted">
              Pegá tus credenciales de producción. Los datos se guardan encriptados.
            </p>
            <Rule className="mt-4" />

            <div className="mt-5 space-y-4">
              <div>
                <label className="eyebrow mb-2 block">Access token (production)</label>
                <input
                  className="mono w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-ml focus:outline-none"
                  type="password"
                  placeholder="APP_USR-…"
                  value={settingsForm.mp_access_token}
                  onChange={(event) => setSettingsForm({ ...settingsForm, mp_access_token: event.target.value })}
                />
              </div>
              <div>
                <label className="eyebrow mb-2 block">Public key (production)</label>
                <input
                  className="mono w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-ml focus:outline-none"
                  placeholder="APP_USR-…"
                  value={settingsForm.mp_public_key}
                  onChange={(event) => setSettingsForm({ ...settingsForm, mp_public_key: event.target.value })}
                />
              </div>
            </div>
          </section>

          <button
            onClick={onSaveSettings}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] py-4 font-semibold shadow-[var(--shadow-lift)] transition-transform hover:scale-[1.01]"
            style={{ backgroundColor: accentColor, color: contrastTextColor }}
          >
            <Save className="h-4 w-4" /> Guardar cambios globales
          </button>
        </>
      ) : (
        <>
          <header>
            <Eyebrow>Sucursal</Eyebrow>
            <h1 className="display mt-3 text-4xl md:text-5xl">{getBranchName(viewBranchId)}</h1>
            <p className="mt-2 text-sm text-text-muted">Configurando datos específicos de este local.</p>
          </header>

          <section className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
            <Eyebrow>Contacto</Eyebrow>
            <Rule className="mt-4" />
            <div className="mt-5 space-y-4">
              <div>
                <label className="eyebrow mb-2 block">Dirección física</label>
                <input
                  className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-text focus:outline-none"
                  value={branchForm.address}
                  onChange={(event) => setBranchForm({ ...branchForm, address: event.target.value })}
                />
              </div>
              <div>
                <label className="eyebrow mb-2 block">Teléfono / WhatsApp</label>
                <input
                  className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-text focus:outline-none"
                  value={branchForm.phone}
                  onChange={(event) => setBranchForm({ ...branchForm, phone: event.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6">
            <Eyebrow>Geolocalización</Eyebrow>
            <Rule className="mt-4" />
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <label className="eyebrow mb-2 block">Latitud</label>
                <input
                  className="num w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-text focus:outline-none"
                  value={branchForm.lat || ''}
                  onChange={(event) => setBranchForm({ ...branchForm, lat: event.target.value })}
                />
              </div>
              <div>
                <label className="eyebrow mb-2 block">Longitud</label>
                <input
                  className="num w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-text focus:outline-none"
                  value={branchForm.lng || ''}
                  onChange={(event) => setBranchForm({ ...branchForm, lng: event.target.value })}
                />
              </div>
            </div>
            <button
              onClick={onGetBranchLocation}
              className="mono mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-ml-soft hover:text-text"
            >
              <MapPin className="h-3.5 w-3.5" /> Usar mi ubicación actual
            </button>
          </section>

          <button
            onClick={onUpdateBranchDetails}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-acid py-4 font-semibold text-ink shadow-[var(--shadow-lift)] hover:brightness-110"
          >
            <Save className="h-4 w-4" /> Actualizar sucursal
          </button>
        </>
      )}
    </div>
  );
}
