"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthenticateWithRedirectCallback, useAuth, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { hasRollNumber } from "@/lib/roll-number";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

type BridgeStep = "checking" | "bridging" | "success" | "error";

/**
 * Roles each portal accepts. Candidates sign in as STUDENT too — applying
 * candidates are students until an admin approves their application. The
 * backend (not this check) enforces what each role may actually do.
 */
const PORTAL_ROLES_ALLOWED: Record<string, string[]> = {
  student: ["STUDENT"],
  candidate: ["CANDIDATE", "STUDENT"],
  administrator: ["ADMIN"],
  // CAD portal is OPEN: anyone with a Google account can sign in here and
  // is granted CAD by the backend. Only the ADMIN portal is whitelisted.
  cad: ["CAD", "STUDENT", "CANDIDATE"],
};

/**
 * Clerk OAuth callback + backend session bridge.
 *
 * 1. <AuthenticateWithRedirectCallback /> completes the Google OAuth handshake.
 * 2. The Clerk session is exchanged for a backend session (cv_sid cookie) via
 *    POST /auth/clerk-session.
 * 3. PORTAL ROLE ENFORCEMENT: the role chosen on the login portal is checked
 *    against the role the backend database reports. A mismatch (e.g. a student
 *    using /login/admin) is rejected: the backend session is destroyed and the
 *    user is sent back to their portal with an error.
 */
function ClerkCallbackInner() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<BridgeStep>("checking");
  const [errorMsg, setErrorMsg] = useState("");
  const [directVisit, setDirectVisit] = useState(false);
  const bridged = useRef(false);

  useEffect(() => {
    // DIRECT VISIT / STALE FLOW HANDLING:
    // This page is only meaningful as the OAuth return target. If someone
    // opens it with no OAuth parameters (or a flow has gone stale), bounce
    // back to /login instead of hanging here or letting Clerk redirect to
    // its own dead-end default-redirect page.
    if (!isLoaded || isSignedIn) return;
    const params = new URLSearchParams(window.location.search);
    const hasOauth = ["code", "state", "sso_state", "error"].some((k) =>
      params.has(k)
    );
    const oauthStarted =
      sessionStorage.getItem("campusvote_oauth_started") === "1";

    if (!hasOauth && !oauthStarted) {
      // Genuine stray visit (no OAuth params AND no flow in progress).
      setDirectVisit(true);
      const t = setTimeout(() => router.replace("/login"), 400);
      return () => clearTimeout(t);
    }

    // OAuth handshake is in progress (params present, OR Clerk's second
    // post-handshake navigation to this URL with no params). Keep waiting
    // for the session to be ready; never bounce a real sign-in back to login.
    const t = setTimeout(() => router.replace("/login"), 20000);
    return () => clearTimeout(t);
  }, [isLoaded, isSignedIn, router]);

  // On a remount after Clerk's internal redirect, restore a completed bridge
  // instead of re-running it (re-running would create a second backend
  // session and double-redirect).
  useEffect(() => {
    if (!isLoaded) return;
    const already = sessionStorage.getItem("campusvote_bridged");
    if (already === "1") {
      bridged.current = true;
      const dest = sessionStorage.getItem("campusvote_dest") || "/student/dashboard";
      setStep("success");
      const t = setTimeout(() => router.replace(dest), 300);
      return () => clearTimeout(t);
    }
  }, [isLoaded, router]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || bridged.current) return;
    bridged.current = true;

    (async () => {
      try {
        setStep("bridging");

        const primaryEmail =
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress;
        if (!primaryEmail) {
          setErrorMsg("Your Google account has no email address to sign in with.");
          setStep("error");
          return;
        }

        const token = await getToken();
        const roleRaw = sessionStorage.getItem("campusvote_login_role") || "student";
        const role = roleRaw.toUpperCase();

        const csrfRes = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
        const csrfData = await csrfRes.json();
        const csrfToken = csrfData.data?.csrfToken || "";

        const res = await fetch(`${API_BASE}/auth/clerk-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({
            email: primaryEmail,
            name: user.fullName || user.firstName || "",
            role: role,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          sessionStorage.removeItem("campusvote_oauth_started");
          sessionStorage.setItem("campusvote_role_mismatch", "1");
          setErrorMsg(data.error?.message || "Sign-in bridge failed. Please try again.");
          setStep("error");
          return;
        }

        const dbRole = String(data.data?.user?.role || "").toUpperCase();

        // Cross-role protection: portal must match the database role.
        // ADMIN may sign in from any portal (admins can do everything);
        // everyone else must be on a portal that accepts their role.
        const portalAllowed =
          dbRole === "ADMIN" ||
          roleRaw === "any" ||
          (PORTAL_ROLES_ALLOWED[roleRaw] || []).includes(dbRole);

        if (!portalAllowed) {
          // Kill the just-created session — wrong portal.
          await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
            credentials: "include",
          }).catch(() => {});
          sessionStorage.removeItem("campusvote_oauth_started");
          sessionStorage.setItem("campusvote_role_mismatch", "1");
          sessionStorage.removeItem("campusvote_login_role");
          setTimeout(() => router.replace(`/login/${roleRaw}`), 600);
          setStep("error");
          setErrorMsg(
            `This account's role (${dbRole}) does not match this portal. You have been signed out.`
          );
          return;
        }

        if (data.data?.bindingToken) {
          try {
            const { setBindingToken } = await import("@/lib/session-binding");
            setBindingToken(data.data.bindingToken);
          } catch {
            /* non-fatal */
          }
        }

        sessionStorage.removeItem("campusvote_login_role");
        sessionStorage.removeItem("campusvote_oauth_started");
        sessionStorage.setItem("campusvote_bridged", "1");
        setStep("success");

        // Route by the DATABASE role (server-side truth), not the portal picked
        const dashboards: Record<string, string> = {
          STUDENT: "/student/dashboard",
          CANDIDATE: "/candidate/dashboard",
          ADMIN: "/admin/dashboard",
          CAD: "/cad/dashboard",
        };
        let dest = dashboards[dbRole] || "/student/dashboard";
        // A student who chose the candidate portal is here to apply
        if (dbRole === "STUDENT" && roleRaw === "candidate") {
          dest = "/candidate/apply";
        }
        // Roll numbers are stored per portal role: candidate applicants are
        // asked on the candidate portal, everyone else as student. Check BOTH
        // keys so a roll saved under either role is honored (a candidate is
        // still a student until approved) — this is what prevents being
        // bounced back to the roll-number page right after entering it.
        const rollRole = roleRaw === "candidate" ? "candidate" : "student";
        const otherRollRole = rollRole === "candidate" ? "student" : "candidate";
        const needsRoll =
          (dbRole === "STUDENT" || dbRole === "CANDIDATE") &&
          !hasRollNumber(rollRole, primaryEmail) &&
          !hasRollNumber(otherRollRole, primaryEmail);

        const rollUrl = `/roll-number?role=${rollRole}&email=${encodeURIComponent(primaryEmail)}&next=${encodeURIComponent(dest)}`;

        // Persist the resolved destination so a remount after Clerk's
        // internal redirect goes straight there without re-bridging.
        sessionStorage.setItem("campusvote_dest", needsRoll ? rollUrl : dest);

        setTimeout(() => {
          router.replace(needsRoll ? rollUrl : dest);
        }, 800);
      } catch (err) {
        console.error("Clerk callback bridge failed:", err);
        sessionStorage.removeItem("campusvote_oauth_started");
        setErrorMsg("Something went wrong completing sign-in. Please try again.");
        setStep("error");
      }
    })();
  }, [isLoaded, isSignedIn, user, getToken, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <AuthLayout>
        <AuthCard>
          <div className="text-center py-8">
            {directVisit ? (
              <>
                <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Taking you back to sign in…
                </h2>
                <p className="text-sm text-gray-500">
                  There is no sign-in in progress.
                </p>
              </>
            ) : (
              <>
                <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Completing sign-in…
                </h2>
                <AuthenticateWithRedirectCallback />
              </>
            )}
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center py-8">
          {(step === "checking" || step === "bridging") && (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {step === "bridging" ? "Setting up your session..." : "Completing sign-in..."}
              </h2>
              <p className="text-sm text-gray-500">
                {step === "bridging" ? "Connecting your Google account to CampusVote" : "Verifying your Google account"}
              </p>
            </>
          )}
          {step === "success" && (
            <>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Signed in!</h2>
              <p className="text-sm text-gray-500">Taking you to your dashboard...</p>
            </>
          )}
          {step === "error" && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign-in failed</h2>
              <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
              <a
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
              >
                Back to login
              </a>
            </>
          )}
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

export default function ClerkCallbackPage() {
  return <ClerkCallbackInner />;
}
