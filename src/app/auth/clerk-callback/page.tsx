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

const PORTAL_ROLE_MAP: Record<string, string> = {
  student: "STUDENT",
  candidate: "CANDIDATE",
  administrator: "ADMIN",
  cad: "CAD",
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
  const bridged = useRef(false);

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
          sessionStorage.setItem("campusvote_role_mismatch", "1");
          setErrorMsg(data.error?.message || "Sign-in bridge failed. Please try again.");
          setStep("error");
          return;
        }

        const dbRole = String(data.data?.user?.role || "").toUpperCase();
        const portalExpects = PORTAL_ROLE_MAP[roleRaw];

        // Cross-role protection: portal must match the database role.
        // ADMIN may sign in from any portal (admins can do everything);
        // everyone else must use their own portal.
        const portalAllowed =
          dbRole === "ADMIN" || portalExpects === dbRole || roleRaw === "any";

        if (!portalAllowed) {
          // Kill the just-created session — wrong portal.
          await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
            credentials: "include",
          }).catch(() => {});
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
        setStep("success");

        // Route by the DATABASE role (server-side truth), not the portal picked
        const dashboards: Record<string, string> = {
          STUDENT: "/student/dashboard",
          CANDIDATE: "/candidate/dashboard",
          ADMIN: "/admin/dashboard",
          CAD: "/cad/dashboard",
        };
        const dest = dashboards[dbRole] || "/student/dashboard";
        const needsRoll =
          (dbRole === "STUDENT" || dbRole === "CANDIDATE") &&
          !hasRollNumber(dbRole.toLowerCase(), primaryEmail);

        setTimeout(() => {
          if (needsRoll) {
            router.replace(
              `/roll-number?role=${dbRole.toLowerCase()}&email=${encodeURIComponent(primaryEmail)}&next=${encodeURIComponent(dest)}`
            );
          } else {
            router.replace(dest);
          }
        }, 800);
      } catch (err) {
        console.error("Clerk callback bridge failed:", err);
        setErrorMsg("Something went wrong completing sign-in. Please try again.");
        setStep("error");
      }
    })();
  }, [isLoaded, isSignedIn, user, getToken, router]);

  if (!isLoaded || !isSignedIn) {
    return <AuthenticateWithRedirectCallback />;
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
