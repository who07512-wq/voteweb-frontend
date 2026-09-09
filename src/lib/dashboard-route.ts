/**
 * Returns the correct dashboard route for a given role.
 *
 * STUDENT role always maps to /candidate/status.
 * The "student portal closed" check only applies to /student/* routes
 * which are already blocked in proxy.ts middleware.
 */
export function getDashboardRoute(role: string): string {
  const normalized = String(role || "").toUpperCase();

  const routes: Record<string, string> = {
    STUDENT: "/candidate/status",
    CANDIDATE: "/candidate/status",
    ADMIN: "/admin/dashboard",
    CAD: "/cad/dashboard",
  };

  return routes[normalized] || "/candidate/status";
}
