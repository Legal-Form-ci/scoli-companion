import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageLoader from "@/components/PageLoader";
import type { AppRole } from "@/lib/rbac";

interface RoleGuardProps {
  children: ReactNode;
  /** Roles that may access this route. If omitted, any authenticated user is allowed. */
  allow?: AppRole[];
  /** Roles that must never access this route, even if they also have an allowed role. */
  deny?: AppRole[];
  /** Where to send unauthenticated users. Defaults to /auth. */
  loginRedirect?: string;
  /** Where to send authenticated-but-unauthorized users. Defaults to the user's natural dashboard. */
  forbiddenRedirect?: string;
}

/**
 * Single source of truth for protecting dashboards.
 *
 * Waits for both auth AND roles to finish loading before deciding,
 * which eliminates the flicker / wrong-redirect that happens when
 * each page checks `roles` while they're still being fetched.
 */
const RoleGuard = ({
  children,
  allow,
  deny,
  loginRedirect = "/auth",
  forbiddenRedirect,
}: RoleGuardProps) => {
  const { user, loading, rolesLoading, roles, getDashboardPath } = useAuth();
  const location = useLocation();

  // Still resolving — show a stable loader instead of flashing the wrong UI.
  if (loading || (user && rolesLoading)) {
    return <PageLoader />;
  }

  // Not signed in.
  if (!user) {
    return (
      <Navigate
        to={loginRedirect}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // No role restriction → any signed-in user is fine.
  if (deny?.some((r) => roles.includes(r))) {
    return <Navigate to={forbiddenRedirect ?? getDashboardPath()} replace />;
  }

  if (!allow || allow.length === 0) return <>{children}</>;

  const hasAccess = allow.some((r) => roles.includes(r));
  if (!hasAccess) {
    return <Navigate to={forbiddenRedirect ?? getDashboardPath()} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
