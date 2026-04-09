const PLATFORM_ADMIN_ROLES = new Set(['platform_admin', 'superadmin', 'master_admin']);

export const isPlatformAdmin = (user) => {
  const metadata = user?.app_metadata || {};
  const role = metadata.rivapp_role || metadata.platform_role || metadata.role;

  if (typeof role === 'string' && PLATFORM_ADMIN_ROLES.has(role)) {
    return true;
  }

  if (Array.isArray(metadata.roles) && metadata.roles.some((item) => PLATFORM_ADMIN_ROLES.has(item))) {
    return true;
  }

  return metadata.is_platform_admin === true || metadata.is_platform_admin === 'true';
};
