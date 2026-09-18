import type { UserRole } from '../../types';

export type AccessTier = 1 | 2 | 3;

/**
 * The hierarchy is derived from the authenticated role, never from editable
 * profile metadata. Tier inheritance is VIEW-ONLY; mutations remain protected
 * by the explicit role checks in each route/API action.
 */
export const ROLE_ACCESS_TIER: Partial<Record<UserRole, AccessTier>> = {
  admin: 1,
  teacher: 2,
  ai: 2,
  student: 3
};

const INHERITABLE_VIEW_PATHS = new Set([
  '/assignments',
  '/portfolios',
  '/student/diff',
  '/student/analytics'
]);

export function accessTierForRole(role: UserRole): AccessTier | null {
  return ROLE_ACCESS_TIER[role] ?? null;
}

export function canViewRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === targetRole) return true;
  const actorTier = accessTierForRole(actorRole);
  const targetTier = accessTierForRole(targetRole);
  return actorTier !== null && targetTier !== null && actorTier < targetTier;
}

export function canAccessRoute(
  actorRole: UserRole,
  route?: { path?: string; allowedRoles?: UserRole[] }
): boolean {
  if (!route?.allowedRoles?.length) return true;
  if (route.allowedRoles.includes(actorRole)) return true;
  if (!route.path || !INHERITABLE_VIEW_PATHS.has(route.path)) return false;
  return route.allowedRoles.some(targetRole => canViewRole(actorRole, targetRole));
}
