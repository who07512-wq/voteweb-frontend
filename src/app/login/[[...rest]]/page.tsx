"use client";

import { useEffect, useState } from "react";
import { RoleLoginPage } from "../role-login";
import type { UserRole } from "@/lib/auth-types";

/**
 * Main login portal. Supports ?role=student|candidate|cad|administrator to
 * preselect a role (used by deep links like /candidate). Unknown values
 * fall back to the combined portal with the role selector.
 */
export default function LoginPage() {
  const [initialRole, setInitialRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("role");
    if (!raw) return;
    const map: Record<string, UserRole> = {
      student: "student",
      candidate: "candidate",
      cad: "cad",
      admin: "administrator",
      administrator: "administrator",
    };
    const mapped = map[raw.toLowerCase()];
    if (mapped) setInitialRole(mapped);
  }, []);

  if (initialRole) {
    return <RoleLoginPage portal="any" initialRole={initialRole} />;
  }
  return <RoleLoginPage portal="any" />;
}
