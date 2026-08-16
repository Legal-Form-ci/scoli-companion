export const ADMIN_ROLES = ["super_admin", "admin"] as const;
export const TEAM_ROLES = ["moderator", "commercial", "comptable"] as const;
export const REFERENT_ROLES = ["referent"] as const;
export const CLIENT_ROLES = ["user"] as const;

export const FINAL_ROLES = [
  ...ADMIN_ROLES,
  ...TEAM_ROLES,
  ...REFERENT_ROLES,
  ...CLIENT_ROLES,
] as const;

export type AppRole = (typeof FINAL_ROLES)[number];

const hasAny = (roles: string[], allowed: readonly string[]) =>
  roles.some((role) => allowed.includes(role));

export const isPlatformAdmin = (roles: string[]) => hasAny(roles, ADMIN_ROLES);
export const isSuperAdmin = (roles: string[]) => roles.includes("super_admin");
export const isTeamMember = (roles: string[]) => hasAny(roles, TEAM_ROLES);
export const isReferent = (roles: string[]) => hasAny(roles, REFERENT_ROLES);
export const isModerator = (roles: string[]) => roles.includes("moderator");
export const isCommercial = (roles: string[]) => roles.includes("commercial");
export const isComptable = (roles: string[]) => roles.includes("comptable");

export const hasPrivilegedRole = (roles: string[]) =>
  isPlatformAdmin(roles) || isTeamMember(roles) || isReferent(roles);

export const getDashboardPathForRoles = (roles: string[]) => {
  if (isPlatformAdmin(roles)) return "/admin";
  if (isTeamMember(roles)) return "/team";
  if (isReferent(roles)) return "/me";
  return "/client";
};

/**
 * Strict ACL for every admin section (tab id) — mirrors public.role_permissions.
 * Any section not listed here is treated as super_admin only.
 */
export const ADMIN_SECTION_ACL: Record<string, readonly AppRole[]> = {
  dashboard: ["super_admin", "admin"],
  stats: ["super_admin", "admin"],
  products: ["super_admin", "admin"],
  scholar_kits: ["super_admin", "admin"],
  school_kits: ["super_admin", "admin"],
  categories: ["super_admin", "admin"],
  flash_deals: ["super_admin", "admin"],
  promotions_mgmt: ["super_admin", "admin"],
  promotions: ["super_admin", "admin"],
  orders: ["super_admin", "admin"],
  payments: ["super_admin", "admin"],
  deliveries: ["super_admin", "admin"],
  users: ["super_admin", "admin"],
  roles: ["super_admin", "admin"],
  zones: ["super_admin", "admin"],
  referrals: ["super_admin", "admin"],
  commissions: ["super_admin", "admin"],
  articles: ["super_admin", "admin"],
  review: ["super_admin", "admin"],
  advertisements: ["super_admin", "admin"],
  faq: ["super_admin", "admin"],
  settings: ["super_admin"],
};

export const canAccessAdminSection = (roles: string[], section: string) =>
  hasAny(roles, ADMIN_SECTION_ACL[section] ?? ["super_admin"]);

/** Team dashboard sections → roles allowed. */
export const TEAM_SECTION_ACL: Record<string, readonly AppRole[]> = {
  moderation: ["super_admin", "admin", "moderator"],
  comments: ["super_admin", "admin", "moderator"],
  commercial: ["super_admin", "admin", "commercial"],
  finance: ["super_admin", "admin", "comptable"],
  withdrawals: ["super_admin", "admin", "comptable"],
};

export const canAccessTeamSection = (roles: string[], section: string) =>
  hasAny(roles, TEAM_SECTION_ACL[section] ?? ["super_admin"]);
