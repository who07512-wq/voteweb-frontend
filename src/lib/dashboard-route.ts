/**
 * Returns the correct dashboard route for a given role,
 * respecting the NEXT_PUBLIC_STUDENT_PORTAL_CLOSED flag.
 *
 * When the student portal is closed, STUDENT role users
 * are sent to /portal-closed instead of /student/dashboard.
 * Other roles (CANDIDATE, ADMIN, CAD) are unaffected.
 */
export function getDashboardRoute(role: string): string {
  const normalized = String(role || "").toUpperCase();
  const isStudentPortalClosed =
    process.env.NEXT_PUBLIC_STUDENT_PORTAL_CLOSED === "true";

  if (normalized === "STUDENT" && isStudentPortalClosed) {
    return "/portal-closed";
  }

  const routes: Record<string, string> = {
    STUDENT: "/candidate/status",
    CANDIDATE: "/candidate/dashboard",
    ADMIN: "/admin/dashboard",
    CAD: "/cad/dashboard",
  };

  return routes[normalized] || (isStudentPortalClosed ? "/portal-closed" : "/candidate/status");
}
