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
 * 2. Clerk session (signOut) — with redirect to /login to force full reset
 * 3. The `campusvote_auth` cookie kept for client-side role/name state
 * 4. The binding token in sessionStorage
 *
 * The redirect after signOut is critical: it forces a full page reload which
 * clears all in-memory Clerk state. Without it, a stale session can linger
 * and cause "already signed in" errors when registering a new account.
 */
export function useSignOut() {
  const { signOut } = useClerk();

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

    // Clerk signOut clears the session cookie/token. The redirect forces
    // a full page reload so no stale Clerk state remains in memory.
    try {
      await signOut({ redirectUrl: "/login" });
    } catch {
      // Fallback: redirect manually if Clerk signOut fails.
      window.location.href = "/login";
    }
  }, [signOut]);
}
