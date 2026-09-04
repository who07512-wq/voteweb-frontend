"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthenticateWithRedirectCallback, useAuth, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { hasRollNumber } from "@/lib/roll-number";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

type BridgeStep = "checking" | "bridging" | "success" | "error";

/**
 * Clerk OAuth callback + backend session bridge.
 *
 * 1. <AuthenticateWithRedirectCallback /> completes the Google OAuth
 *    handshake (verifies the redirect from accounts.google.com via Clerk).
 * 2. Once Clerk reports a signed-in user, this page exchanges the Clerk
 *    session for a backend session (cv_sid cookie) via POST /auth/clerk-session,
 *    then routes to the role dashboard (capturing the roll number first if the
 *    user has never provided one).
 */
function ClerkCallbackInner() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<BridgeStep>("checking");
  const [errorMsg, setErrorMsg] = useState("");
  const bridged = useRef(false);

  // Step 2: once Clerk finishes the OAuth handshake, bridge to the backend.
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
        const role = sessionStorage.getItem("campusvote_login_role") || "student";

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
            role: role.toUpperCase(),
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErrorMsg(data.error?.message || "Sign-in bridge failed. Please try again.");
          setStep("error");
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

        const dashboards: Record<string, string> = {
          student: "/student/dashboard",
          candidate: "/candidate/dashboard",
          administrator: "/admin/dashboard",
        };
        const dest = dashboards[role] || "/student/dashboard";
        const needsRoll =
          (role === "student" || role === "candidate") &&
          !hasRollNumber(role, primaryEmail);

        setTimeout(() => {
          if (needsRoll) {
            router.replace(
              `/roll-number?role=${role}&email=${encodeURIComponent(primaryEmail)}&next=${encodeURIComponent(dest)}`
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

  // Step 1: let Clerk complete the OAuth handshake while signed out.
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
