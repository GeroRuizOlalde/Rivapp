import { Info, Plus, Trash2, User, Users } from 'lucide-react';
import Button from '../../components/shared/ui/Button';
import Eyebrow from '../../components/shared/ui/Eyebrow';

export default function TeamTab({
  teamInvites,
  onOpenRolesModal,
  onOpenInviteModal,
  getBranchName,
  onDeleteInvite,
}) {
  return (
    <div className="anim-rise">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <Eyebrow>Personas</Eyebrow>
          <h1 className="display mt-3 text-4xl md:text-5xl">
            Tu <em className="display-italic text-acid">equipo</em>
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenRolesModal}
            className="rounded-[var(--radius-sm)] border border-rule bg-white/5 p-3 text-text-muted hover:border-text hover:text-text"
            title="Ver roles"
          >
            <Info className="h-4 w-4" />
          </button>
          <Button onClick={onOpenInviteModal} variant="acid" size="md">
            <Plus className="h-4 w-4" /> Invitar
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teamInvites.map((invite) => (
          <div
            key={invite.id}
            className="relative overflow-hidden rounded-[var(--radius-xl)] border border-rule-strong bg-ink-2 p-6"
          >
            <span className="mono absolute right-0 top-0 rounded-bl-[var(--radius-sm)] bg-white/5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-text-muted">
              {invite.status}
            </span>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rule-strong bg-ink-3 text-text-muted">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="display truncate text-lg text-text">{invite.email}</p>
                <p className="mono mt-0.5 text-[10px] uppercase tracking-[0.22em] text-acid">
                  {invite.role}
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-[var(--radius-sm)] border border-rule bg-ink-3 p-3">
              <div className="flex items-center justify-between">
                <span className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                  Sucursal
                </span>
                <span className="text-sm font-semibold text-text">
                  {invite.branch_id ? getBranchName(invite.branch_id) : 'Global'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onDeleteInvite(invite.id)}
              className="mono flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-signal/30 bg-signal/10 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-signal-soft transition-colors hover:bg-signal hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5" /> Revocar acceso
            </button>
          </div>
        ))}

        {teamInvites.length === 0 && (
          <div className="col-span-full rounded-[var(--radius-xl)] border border-dashed border-rule-strong p-16 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-rule-strong bg-ink-2 text-text-subtle">
              <Users className="h-5 w-5" />
            </div>
            <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
              Sin invitaciones pendientes
            </p>
            <p className="mt-2 text-sm text-text-subtle">
              Invitá a gerentes o empleados para que gestionen sus sucursales.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
