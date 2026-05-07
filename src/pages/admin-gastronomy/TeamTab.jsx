import { useEffect, useState } from 'react';
import { Crown, Edit, Info, Mail, Plus, Trash2, User, Users } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { useToast } from '../../components/shared/toastContext';
import { useConfirm } from '../../components/shared/confirmContext';
import Button from '../../components/shared/ui/Button';
import Eyebrow from '../../components/shared/ui/Eyebrow';
import Rule from '../../components/shared/ui/Rule';

const ROLE_TONE = {
  owner: 'border-acid bg-acid/10 text-acid',
  admin: 'border-acid bg-acid/10 text-acid',
  manager: 'border-ml bg-ml/10 text-ml-soft',
  staff: 'border-rule-strong bg-white/5 text-text-muted',
  rider: 'border-signal bg-signal/10 text-signal-soft',
};

const ROLE_LABEL = {
  owner: 'Dueño',
  admin: 'Admin',
  manager: 'Gerente',
  staff: 'Staff',
  rider: 'Rider',
};

export default function TeamTab({
  storeId,
  branches = [],
  teamInvites,
  onOpenRolesModal,
  onOpenInviteModal,
  getBranchName,
  onDeleteInvite,
  refreshInvites,
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const fetchMembers = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-team-members', {
        body: { store_id: storeId },
      });
      if (error || data?.error) {
        toast.error(data?.error || error.message);
      } else {
        setMembers(data?.members || []);
      }
    } catch (err) {
      toast.error('Error cargando equipo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleRemove = async (member) => {
    const ok = await confirm({
      title: `¿Quitar a ${member.email}?`,
      message: 'Le sacás todo el acceso a esta tienda. La cuenta del usuario sigue existiendo.',
      confirmLabel: 'Quitar acceso',
      danger: true,
    });
    if (!ok) return;
    const { data, error } = await supabase.functions.invoke('remove-team-member', {
      body: { store_id: storeId, user_id: member.user_id },
    });
    if (error || data?.error) {
      toast.error(data?.error || error.message);
      return;
    }
    toast.success('Miembro removido');
    fetchMembers();
  };

  const pendingInvites = (teamInvites || []).filter((i) => i.status === 'pending');

  return (
    <div className="mx-auto max-w-5xl pb-20 anim-rise">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Eyebrow>Personas</Eyebrow>
          <h1 className="display mt-3 text-4xl md:text-5xl">
            Tu <em className="display-italic text-acid">equipo</em>
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Gestioná quién tiene acceso al panel y con qué permisos.
          </p>
        </div>
        <div className="flex w-full gap-2 md:w-auto">
          <button
            onClick={onOpenRolesModal}
            className="rounded-[var(--radius-sm)] border border-rule bg-white/5 p-3 text-text-muted hover:border-text hover:text-text"
            title="Ver descripción de roles"
            aria-label="Roles"
          >
            <Info className="h-4 w-4" />
          </button>
          <Button onClick={onOpenInviteModal} variant="acid" size="md" className="flex-1 md:flex-none">
            <Plus className="h-4 w-4" /> Invitar
          </Button>
        </div>
      </header>

      {/* MIEMBROS ACTIVOS */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <Eyebrow>Miembros activos</Eyebrow>
          {!loading && (
            <span className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
              {members.length} {members.length === 1 ? 'persona' : 'personas'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="rounded-[var(--radius-md)] border border-rule bg-ink-2 p-8 text-center">
            <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">
              Cargando equipo…
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {members.map((m) => {
              const tone = ROLE_TONE[m.role] || ROLE_TONE.staff;
              const isOwner = m.role === 'owner';
              return (
                <div
                  key={m.id}
                  className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-rule-strong bg-ink-2 p-4 md:flex-row md:items-center md:justify-between md:p-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rule-strong bg-ink-3 text-text-muted">
                      {isOwner ? <Crown className="h-4 w-4 text-acid" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="display truncate text-base text-text">{m.email}</p>
                      <p className="mono mt-0.5 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                        {m.scope === 'branch' && m.branch_name
                          ? `Sucursal: ${m.branch_name}`
                          : 'Acceso a toda la tienda'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`mono rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] ${tone}`}
                    >
                      {ROLE_LABEL[m.role] || m.role}
                    </span>
                    {m.editable && (
                      <>
                        <button
                          onClick={() => setEditing(m)}
                          className="rounded-[var(--radius-sm)] border border-rule bg-white/5 p-2 text-text-muted hover:border-text hover:text-text"
                          aria-label="Editar"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemove(m)}
                          className="rounded-[var(--radius-sm)] border border-signal/30 bg-signal/10 p-2 text-signal hover:bg-signal hover:text-white"
                          aria-label="Quitar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {members.length === 0 && (
              <div className="rounded-[var(--radius-xl)] border border-dashed border-rule-strong p-10 text-center">
                <Users className="mx-auto mb-3 h-5 w-5 text-text-subtle" />
                <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">
                  Sin miembros activos
                </p>
                <p className="mt-2 text-sm text-text-subtle">
                  Invitá a tu primer empleado o gerente.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* INVITACIONES PENDIENTES */}
      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <Eyebrow>Invitaciones pendientes</Eyebrow>
          {pendingInvites.length > 0 && (
            <span className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
              {pendingInvites.length}
            </span>
          )}
        </div>

        {pendingInvites.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-rule p-6 text-center">
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
              Sin invitaciones pendientes
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-rule-strong bg-ink-2 p-4 md:flex-row md:items-center md:justify-between md:p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-acid/30 bg-acid/10 text-acid">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="display truncate text-base text-text">{invite.email}</p>
                    <p className="mono mt-0.5 text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                      {invite.branch_id
                        ? `Sucursal: ${getBranchName(invite.branch_id)}`
                        : 'Acceso global'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`mono rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] ${ROLE_TONE[invite.role] || ROLE_TONE.staff}`}
                  >
                    {ROLE_LABEL[invite.role] || invite.role}
                  </span>
                  <button
                    onClick={() => onDeleteInvite(invite.id)}
                    className="rounded-[var(--radius-sm)] border border-signal/30 bg-signal/10 p-2 text-signal hover:bg-signal hover:text-white"
                    aria-label="Revocar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <EditMemberModal
          member={editing}
          branches={branches}
          storeId={storeId}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchMembers();
            if (refreshInvites) refreshInvites();
          }}
        />
      )}
    </div>
  );
}

function EditMemberModal({ member, branches, storeId, onClose, onSaved }) {
  const toast = useToast();
  const [role, setRole] = useState(member.role === 'owner' ? 'manager' : member.role);
  const [scope, setScope] = useState(member.scope);
  const [branchId, setBranchId] = useState(member.branch_id || branches[0]?.id || '');
  const [saving, setSaving] = useState(false);

  // Lock body scroll
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const handleSave = async () => {
    if (scope === 'branch' && !branchId) {
      toast.error('Elegí una sucursal');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('update-team-member', {
      body: {
        store_id: storeId,
        user_id: member.user_id,
        new_role: role,
        new_scope: scope,
        new_branch_id: scope === 'branch' ? branchId : null,
      },
    });
    setSaving(false);
    if (error || data?.error) {
      toast.error(data?.error || error.message);
      return;
    }
    toast.success('Miembro actualizado');
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-center bg-ink/90 backdrop-blur-sm md:items-center md:overflow-y-auto md:p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden border border-rule-strong bg-ink-2 shadow-[var(--shadow-editorial)] md:my-8 md:rounded-[var(--radius-xl)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-rule p-5 md:p-6">
          <Eyebrow>Editar miembro</Eyebrow>
          <h3 className="display mt-2 text-xl text-text">{member.email}</h3>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 md:p-6">
          <div>
            <label className="eyebrow mb-2 block">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mono w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm uppercase tracking-[0.15em] text-text focus:border-acid focus:outline-none"
            >
              <option value="admin">Admin (acceso total)</option>
              <option value="manager">Gerente</option>
              <option value="staff">Staff</option>
              <option value="rider">Rider</option>
            </select>
          </div>

          <div>
            <label className="eyebrow mb-2 block">Alcance</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'store', label: 'Toda la tienda' },
                { id: 'branch', label: 'Una sucursal' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setScope(opt.id)}
                  className={`mono rounded-[var(--radius-md)] border px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                    scope === opt.id
                      ? 'border-acid bg-acid/10 text-acid'
                      : 'border-rule bg-ink-3 text-text-muted hover:border-text-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {scope === 'branch' && (
            <div>
              <label className="eyebrow mb-2 block">Sucursal asignada</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-rule bg-ink-3 p-3 text-sm text-text focus:border-acid focus:outline-none"
              >
                {branches.length === 0 && <option value="">Sin sucursales creadas</option>}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Rule />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="mono rounded-[var(--radius-sm)] border border-rule bg-ink-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted hover:border-text hover:text-text"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="mono rounded-[var(--radius-sm)] bg-acid px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink hover:brightness-110 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
