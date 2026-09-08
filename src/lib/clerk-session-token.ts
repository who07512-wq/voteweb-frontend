"use client";

/**
 * Shared helper for obtaining a *valid* Clerk session token (JWT) from the
 * active Clerk session and feeding it to the backend as a Bearer credential.
 *
 * Every backend call that proves a Clerk session MUST go through
 * getValidClerkSessionToken. It guarantees the returned value is a real
 * compact JWT (three dot-separated segments), so callers can NEVER send
 * `Bearer null`, `Bearer undefined`, `Bearer ""`, a Clerk session id, or any
 * other non-JWT value to the API.
 */

type ClerkGetTokenOptions = Partial<{
  skipCache: boolean;
  template: string;
  organizationId: string;
}>;

type ClerkTokenFetcher = (
  options?: ClerkGetTokenOptions
) => Promise<string | null>;

export function isValidClerkJwt(token: string | null | undefined): token is string {
  if (!token || typeof token !== "string") return false;
  return token.split(".").length === 3;
}

/**
 * Fetches a session token for the ACTIVE Clerk session and returns it only
 * if it is a valid compact JWT. Throws when no token is available.
 */
export async function getValidClerkSessionToken(
  getToken: ClerkTokenFetcher
): Promise<string> {
  let token: string | null = null;
  try {
    token = await getToken({ skipCache: true });
  } catch {
    token = null;
  }
  if (!token) throw new Error("No Clerk session token available.");
  if (!isValidClerkJwt(token)) {
    throw new Error("Clerk did not return a valid JWT.");
  }
  return token;
}