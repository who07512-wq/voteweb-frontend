"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { HelpCircle, Loader2, ShieldAlert } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { RoleSelector } from "@/components/auth/RoleSelector";
import type { UserRole } from "@/lib/auth-types";

/**
 * Shared login portal implementation used by /login, /login/student,
 * /login/cad and /login/admin. The `portal` prop preselects (and for
 * non-student portals locks) the role; the backend still verifies the
 * DB role after Google returns.
 *
 * Google sign-in is resilient: it tries Clerk's signal-based sso() API
 * first, then the classic authenticateWithRedirect(), then Clerk's
 * hosted sign-in page — so a single API hiccup never blocks sign-in.
 */
export function RoleLoginPage({
  portal,
  initialRole,
}: {
  portal: "any" | "student" | "cad" | "admin";
  initialRole?: UserRole;
}) {
  const { signIn } = useSignIn();
  const clerk = useClerk();
  const isLoaded = Boolean(signIn);
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    initialRole ||
      (portal === "student"
        ? "student"
        : portal === "cad"
          ? "cad"
          : portal === "admin"
            ? "administrator"
            : "student")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState(
    portal === "any" ? "" :
    portal === "admin" ? "Administrator access only — only whitelisted email addresses can sign in here."
    : portal === "cad" ? "Election monitor portal — anyone with a Google account can sign in. Only the Admin portal is restricted to whitelisted emails."
    : ""
  );
  const [error, setError] = useState("");

  useEffect(() => {
    // Surface role-mismatch rejections relayed by the callback page
    const flagged = sessionStorage.getItem("campusvote_role_mismatch");
    if (flagged) {
      setNotice("");
      setError(
        "This Google account is not authorized for this portal. Sign in from the correct portal for your role."
      );
      sessionStorage.removeItem("campusvote_role_mismatch");
    }
  }, []);

  const describe = (err: unknown): string => {
    const anyErr = err as { code?: string; message?: string } | null;
    const code = anyErr?.code ? ` (code: ${anyErr.code})` : "";
    const message = anyErr?.message ? ` — ${anyErr.message}` : "";
    return `${code}${message}`;
  };

  const startGoogleSignIn = async () => {
    setError("");
    if (!signIn || !clerk) {
      setError("Sign-in is still loading. Please try again in a moment.");
      return;
    }
    setIsLoading(true);
    sessionStorage.setItem("campusvote_login_role", selectedRole);
    // Tell the callback page an OAuth flow is genuinely in progress. Clerk
    // navigates back to the callback URL a second time (no query params) after
    // completing the handshake; without this flag the callback would treat
    // that second visit as a stray direct visit and bounce the user to /login.
    sessionStorage.setItem("campusvote_oauth_started", "1");
    sessionStorage.removeItem("campusvote_bridged");
    sessionStorage.removeItem("campusvote_dest");

    // If a Clerk session is ALREADY active (e.g. the user completed sign-in
    // earlier but landed back on /login), starting a brand-new OAuth flow via
    // signIn.sso() fails with "sign failed" — Clerk refuses to create a new
    // sign-in while a session exists. In that case skip the Google round-trip
    // entirely and go straight to the callback, which re-bridges the existing
    // session and routes by the database role.
    if (clerk.session?.id || clerk.session) {
      window.location.href = `${window.location.origin}/auth/clerk-callback`;
      return;
    }

    // ABSOLUTE URLs matter: when the flow falls through to Clerk's hosted
    // page (accounts.dev), relative URLs get resolved against the Clerk
    // origin and the user ends up on Clerk's dead-end default-redirect page.
    // Forcing the complete URL back to our own origin guarantees the user
    // always lands on the app's callback, which then routes by DB role.
    const callbackUrl = `${window.location.origin}/auth/clerk-callback`;
    const options = {
      strategy: "oauth_google" as const,
      redirectUrl: callbackUrl,
      redirectCallbackUrl: callbackUrl,
    };

    // Attempt 1: DIRECT full-page navigation to the Clerk hosted sign-in URL
    // (MOST RELIABLE — this is the one that works on phones too). We build
    // the exact sign-in URL with clerk.buildSignInUrl() and navigate with a
    // plain window.location.href. No dependence on in-memory Clerk navigation
    // state, popups, or router internals — a hard page load always happens on
    // every device. signIn.sso() is NOT used as the primary path because it
    // can silently resolve WITHOUT navigating when a stale sign-in attempt
    // exists in the Clerk session, which makes the button appear dead.
    // Force the return URLs so the instance's broken default-redirect is
    // never used and the user always comes back to our callback.
    try {
      const builder = clerk as unknown as {
        buildSignInUrl?: (o: Record<string, unknown>) => string;
        redirectToSignIn?: (o?: Record<string, unknown>) => void;
      };
      if (typeof builder.buildSignInUrl === "function") {
        const url = builder.buildSignInUrl({
          signInForceRedirectUrl: callbackUrl,
          signInFallbackRedirectUrl: callbackUrl,
        });
        if (url && url.startsWith("http")) {
          window.location.href = url;
          return;
        }
      }
    } catch (err) {
      console.error("Google sign-in (buildSignInUrl) failed:", err);
    }

    // Attempt 2: Clerk hosted redirect via the in-memory object. Reached only
    // if buildSignInUrl was unavailable; performs a real navigation to the
    // Clerk sign-in page, which then offers Google.
    try {
      const hosted = clerk as unknown as {
        redirectToSignIn: (o?: Record<string, unknown>) => void;
      };
      hosted.redirectToSignIn({
        signInForceRedirectUrl: callbackUrl,
        signInFallbackRedirectUrl: callbackUrl,
      });
      return;
    } catch (err) {
      console.error("Google sign-in (hosted) failed:", err);
    }

    // Attempt 3: signal-based sso() — direct Google flow. Only reached if
    // both hosted paths threw. Guarded so a resolve-without-navigation
    // (stale sign-in) can't be mistaken for success: we wait a moment and
    // fall through to the error message if no navigation started.
    try {
      const res = (await signIn.sso(options)) as { error?: unknown } | undefined;
      if (res?.error) {
        console.error("Google sign-in (sso) failed:", res.error);
      } else {
        // Assume the browser is navigating to Google. Give it a beat; if
        // nothing happened (stale sign-in silent no-op), report it instead
        // of leaving the button dead.
        setTimeout(() => {
          if (document.visibilityState !== "hidden") {
            setError(
              "Google sign-in did not open. Please try again — if it keeps failing, refresh the page first."
            );
            setIsLoading(false);
          }
        }, 3000);
        return;
      }
    } catch (err) {
      console.error("Google sign-in (sso) threw:", err);
    }

    setError(
      "Google sign-in could not be started. Please refresh the page and try again — if it keeps failing, check that you are visiting the official site URL."
    );
    setIsLoading(false);
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center mb-6">
          <AuthHeader
            title={
              portal === "admin" ? "Admin Portal" :
              portal === "cad" ? "CAD Portal" :
              portal === "student" ? "Student Portal" :
              "Sign In"
            }
            subtitle="Use your institute Google account to continue"
          />
        </div>

        {notice && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            {notice}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {portal === "any" ? (
            <RoleSelector selectedRole={selectedRole} onSelect={setSelectedRole} />
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 text-center">
              Signing in as <strong>{selectedRole}</strong>
            </div>
          )}

          <button
            onClick={startGoogleSignIn}
            disabled={isLoading || !isLoaded}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2 text-gray-700">
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirecting to Google...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
                </svg>
                <span className="text-gray-700 font-medium">Continue with Google</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs text-text-secondary pt-1">
            <Link href="/access-request" className="hover:text-primary-600 transition-colors">
              Request voting access
            </Link>
            <Link href="/email-recovery" className="hover:text-primary-600 transition-colors">
              Can&apos;t access your registered email?
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border text-xs text-text-secondary text-center flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          Secured by Clerk — your Google password is never shared with CampusVote
          <HelpCircle className="w-3 h-3 opacity-50" />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
