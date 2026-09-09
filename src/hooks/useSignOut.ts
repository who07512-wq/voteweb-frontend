"use client";

import { useCallback } from "react";
import { api } from "@/lib/api/client";
import { clearAuthCookie } from "@/lib/mock-auth";
import { clearBindingToken } from "@/lib/session-binding";

/**
 * Shared sign-out for every Sign Out button in the app.
 *
 * 1. Backend session (POST /api/v1/auth/logout)
 * 2. Clear client-side auth state (cookies, sessionStorage)
 * 3. Redirect to /login
 */
export function useSignOut() {
  return useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // No backend session or network issue - continue signing out locally.
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

    // Redirect to login — forces a full page reload so no stale state remains.
    window.location.href = "/login";
  }, []);
}
