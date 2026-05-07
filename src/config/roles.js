// Roles del equipo y sus labels según el rubro del negocio.
// Los IDs canónicos viven en la DB (CHECK constraint en store_memberships /
// branch_memberships). Los labels son lo que vemos en la UI.
//
// Cuando cambies labels, hacelo acá y se propaga a TeamTab, TeamModal,
// RolesModal y cualquier otro consumer.

export const ROLE_IDS = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  RIDER: 'rider',
};

const LABELS_GASTRONOMY = {
  owner: 'Dueño',
  admin: 'Admin',
  manager: 'Gerente',
  staff: 'Cajero',
  rider: 'Rider',
};

const LABELS_TURNOS = {
  owner: 'Dueño',
  admin: 'Admin',
  manager: 'Encargado',
  staff: 'Secretario',
  rider: 'Rider', // raro en turnos, lo dejamos por completitud
};

const isGastro = (businessType) => {
  const t = (businessType || '').toLowerCase().trim();
  return ['gastronomia', 'gastronomy', 'restaurant', 'comida', 'food'].some((k) =>
    t.includes(k)
  );
};

export const getRoleLabel = (role, businessType) => {
  const id = (role || '').toLowerCase();
  const labels = isGastro(businessType) ? LABELS_GASTRONOMY : LABELS_TURNOS;
  return labels[id] || role || '';
};

// Roles que se pueden ASIGNAR al crear/editar miembros, en orden de jerarquía.
// 'owner' nunca se asigna manualmente (solo lo es el creador de la tienda).
export const ASSIGNABLE_ROLES = (businessType) => {
  const labels = isGastro(businessType) ? LABELS_GASTRONOMY : LABELS_TURNOS;
  // Si el rubro es turnos, no incluimos 'rider' por defecto.
  const includeRider = isGastro(businessType);
  const list = [
    { id: ROLE_IDS.ADMIN, label: labels.admin, tone: 'signal' },
    { id: ROLE_IDS.MANAGER, label: labels.manager, tone: 'acid' },
    { id: ROLE_IDS.STAFF, label: labels.staff, tone: 'ml' },
  ];
  if (includeRider) list.push({ id: ROLE_IDS.RIDER, label: labels.rider, tone: 'signal' });
  return list;
};

// Subset que un manager puede asignar a otros (no admin/manager).
export const MANAGER_ASSIGNABLE_ROLES = (businessType) => {
  const labels = isGastro(businessType) ? LABELS_GASTRONOMY : LABELS_TURNOS;
  const list = [{ id: ROLE_IDS.STAFF, label: labels.staff, tone: 'ml' }];
  if (isGastro(businessType)) list.push({ id: ROLE_IDS.RIDER, label: labels.rider, tone: 'signal' });
  return list;
};
