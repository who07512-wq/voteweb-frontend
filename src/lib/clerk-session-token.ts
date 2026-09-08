"use client";

/**
 * Shared frontend helper for obtaining a Clerk session token from the REAL
 * active Clerk browser session and returning it to the backend as a Bearer
 * credential.
 *
 * This helper NEVER constructs, mocks or validates a token itself — it only
 * asks the Clerk SDK's official `getToken()` method for the active session's
 * token and passes back exactly what the SDK returns (or null). The backend
 * (`@clerk/express` / `clerkMiddleware` + `getAuth`) is the single authority
 * that verifies the token against the Clerk instance JWKS/issuer, so there is
 * no hand-rolled "JWT check" here. Any string the SDK emits is echoed to the
 * server; anything else (`null`, throw) is treated as "no token" and returned
 * as null so callers can handle it gracefully instead of sending a bogus
 * header value.
 *
 * The token can legitimately be null right after `clerk.setActive({ session })`
 * (sign-up flow) because the SDK takes a moment to promote the new session to
 * be the browser's ACTIVE session, and `getToken()` returns null while no
 * active session exists. We therefore poll `getToken()` for a short window.
 */

type ClerkTokenFetchOptions = {
  skipCache?: boolean;
  template?: string;
  organizationId?: string;
};

type ClerkTokenFetcher = (
  options?: ClerkTokenFetchOptions
) => Promise<string | null>;

export type ClerkSessionState = {
  /** Whether the Clerk SDK has finished loading auth state. */
  isLoaded?: boolean;
  /** Current sign-in status reported by the SDK. */
  isSignedIn?: boolean | null | undefined;
  /** The active session id reported by the SDK (string when signed in). */
  sessionId?: string | null | undefined;
  /** How many extra attempts after the first getToken() call. */
  retries?: number;
  /** Delay between retry attempts in ms. */
  retryDelayMs?: number;
};

/**
 * Get the active Clerk session token using only the official SDK `getToken()`.
 *
 * Returns the SDK's token when it is a non-empty string, or `null` when the
 * SDK reports no token. Never throws, never returns an empty/fabricated value.
 */
export async function getClerkSessionToken(
  getToken: ClerkTokenFetcher,
  state: ClerkSessionState = {}
): Promise<string | null> {
  const retries = state.retries ?? 4;
  const retryDelayMs = state.retryDelayMs ?? 500;

  console.log("[CLERK DEBUG] loaded:", state.isLoaded);
  console.log("[CLERK DEBUG] signedIn:", state.isSignedIn);
  console.log("[CLERK DEBUG] active session:", state.sessionId ? true : false);

  let token: string | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
    try {
      // Official Clerk SDK method. It internally awaits Clerk having loaded
      // and returns null when there is no active session.
      token = await getToken({ skipCache: true });
    } catch (err) {
      console.log(
        "[CLERK DEBUG] getToken error:",
        (err as Error | null)?.message ?? "unknown"
      );
      token = null;
    }
    const tokenExists =
      typeof token === "string" && token.length > 0;
    console.log("[CLERK DEBUG] token exists:", tokenExists);
    if (tokenExists) {
      console.log("[CLERK DEBUG] token length:", token!.length);
      console.log(
        "[CLERK DEBUG] jwt-like:",
        token!.split(".").length >= 2
      );
      return token;
    }
  }
  return null;
}