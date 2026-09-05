"use client";

import { useCallback } from "react";
import { useClerk } from "@clerk/nextjs";
import { api } from "@/lib/api/client";
import { clearAuthCookie } from "@/lib/mock-auth";
import { clearBindingToken } from "@/lib/session-binding";

/**
 * Shared sign-out for every Sign Out button in the app.
 *
 * The app mixes three auth layers and a working sign-out has to end all of
 * them, otherwise the user gets bounced straight back after clicking Sign Out:
 *
 * 1. Backend session (POST /api/v1/auth/logout) - student / admin / OTP sessions
 * 2. The mock `campusvote_auth` cookie kept for client-side role/name state
 * 3. The Clerk session used for candidate accounts (the proxy redirects
 *    unauthenticated /candidate/* requests back to sign-in, and a live Clerk
 *    session on /login immediately redirects to /candidate/dashboard)
 *
 * Each step is best-effort so a failure (e.g. backend unreachable) never
 * blocks the logout. A full page navigation clears all client state.
 */
export function useSignOut() {
  const { signOut: clerkSignOut } = useClerk();

  return useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // No backend session or network issue - continue signing out locally.
    }

    clearAuthCookie();
    clearBindingToken();

    // Clear every flow flag so no stale state on /login or the callback page
    // can bounce the user straight back into a dashboard after sign-out.
    try {
      const keys = Object.keys(window.sessionStorage);
      keys
        .filter((k) => k.startsWith("campusvote_"))
        .forEach((k) => window.sessionStorage.removeItem(k));
    } catch {
      // Private mode etc. - non-fatal.
    }

    // Tell /login this is an intentional sign-out: it must NOT auto-bounce an
    // in-flight/leftover Clerk session back into the portal.
    try {
      window.sessionStorage.setItem("campusvote_signed_out", "1");
    } catch {
      // Non-fatal.
    }

    try {
      await clerkSignOut();
    } catch {
      // No Clerk session (student / admin accounts) - ignore.
    }

    // Full page navigation on purpose: a client-side router.push would keep
    // Clerk's in-memory session state and any module-level auth state alive,
    // so a stale dashboard could be served from the browser cache (e.g. via
    // the back button) after logout.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }, [clerkSignOut]);
}