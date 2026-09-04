"use client";

// The VoteWeb backend requires the session binding token (returned by
// /auth/login and /otp/verify-login) on every state-changing request that
// carries a session cookie (X-Session-Binding header). Without it, the
// session is treated as unauthenticated and writes (casting votes, marking
// notifications read, admin actions) fail with 401.
//
// The token is not secret by itself (it is bound to the httpOnly session
// cookie server-side) but should not be kept longer than the page session.
const STORAGE_KEY = "campusvote_binding_token";

export function setBindingToken(token: string | null | undefined): void {
  if (typeof window === "undefined") return;
  if (token) {
    window.sessionStorage.setItem(STORAGE_KEY, token);
  } else {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function getBindingToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(STORAGE_KEY);
}

export function clearBindingToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
