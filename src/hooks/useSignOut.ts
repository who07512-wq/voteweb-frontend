"use client";

import { useCallback } from "react";
import { useClerk } from "@clerk/nextjs";
import { api } from "@/lib/api/client";
import { clearAuthCookie } from "@/lib/mock-auth";
import { clearBindingToken } from "@/lib/session-binding";

/**
 * Shared sign-out for every Sign Out button in the app.
 *
 * 1. Backend session (POST /api/v1/auth/logout)
 * 2. Clerk session (signOut())
 * 3. The `campusvote_auth` cookie kept for client-side role/name state
 * 4. The binding token in sessionStorage
 */
export function useSignOut() {
  const { signOut } = useClerk();

  return useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // No backend session or network issue - continue signing out locally.
    }

    try {
      await signOut();
    } catch {
      // Clerk sign-out issue - continue with local cleanup.
    }

    clearAuthCookie();
    clearBindingToken();

    try {
      const keys = Object.keys(window.sessionStorage);
      keys
        .filter((k) => k.startsWith("campusvote_"))
        .forEach((k) => window.sessionStorage.removeItem(k));
    } catch {
      // Private mode etc. - non-fatal.
    }

    try {
      window.sessionStorage.setItem("campusvote_signed_out", "1");
    } catch {
      // Non-fatal.
    }

    window.location.href = "/login";
  }, [signOut]);
}
