"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useUser, useSignIn } from "@clerk/nextjs";
import { Loader2, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { setAuthCookie } from "@/lib/mock-auth";
import { getDashboardRoute } from "@/lib/dashboard-route";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken, isLoaded } = useAuth();
  const { signIn } = useSignIn();
  const { user } = useUser();
  const [step, setStep] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const redirect = searchParams.get("redirect") || "";
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isLoaded || hasRun.current) return;
    hasRun.current = true;

    let cancelled = false;

    const run = async () => {
      try {
        // 1. If the OTP flow already set the auth cookie, route directly.
        const authCookie = document.cookie.match(/campusvote_auth=([^;]+)/);
        if (authCookie) {
          const auth = JSON.parse(decodeURIComponent(authCookie[1]));
          const role = String(auth.role || "STUDENT").toUpperCase();
          const dest = getDashboardRoute(role);
          sessionStorage.removeItem("campusvote_login_role");
          sessionStorage.removeItem("campusvote_pending_email");
          sessionStorage.removeItem("campusvote_pending_role");
          sessionStorage.removeItem("campusvote_dest");
          if (!cancelled) {
            setStep("success");
            setTimeout(() => router.replace(dest), 800);
          }
          return;
        }

        // 2. OAuth flow: finalize the Clerk sign-in, then bridge to backend.
        if (!signIn) {
          if (!cancelled) {
            setErrorMsg("Sign-in not available. Please try again.");
            setStep("error");
          }
          return;
        }

        // After sso() redirect, the sign-in may be complete but not finalized.
        if (signIn.status === "complete" || signIn.status === "needs_first_factor") {
          // Finalize to activate the session
          if (signIn.status === "complete") {
            await signIn.finalize({
              navigate: async () => {
                // Don't let Clerk navigate — we handle routing ourselves
              },
            });
          }
        }

        // Now try to get the token
        let token: string | null = null;
        for (let attempt = 0; attempt < 30; attempt++) {
          token = await getToken();
          if (token) break;
          await new Promise((r) => setTimeout(r, 500));
        }

        if (!token) {
          if (!cancelled) {
            setErrorMsg("Could not retrieve session token. Please try again.");
            setStep("error");
          }
          return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

        const csrfRes = await fetch(`${backendUrl}/auth/csrf`, {
          credentials: "include",
        });
        const csrfData = await csrfRes.json().catch(() => ({}));
        const csrfToken = csrfData.data?.csrfToken || "";

        const res = await fetch(`${backendUrl}/auth/clerk-session`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: user?.fullName || user?.firstName || user?.username || "",
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg =
            typeof data.error === "string"
              ? data.error
              : data.error?.message || "Failed to create session. Please try again.";
          if (!cancelled) {
            setErrorMsg(msg);
            setStep("error");
          }
          return;
        }

        const data = await res.json();
        const backendUser = data.data?.user || {};
        const role = String(backendUser.role || "STUDENT").toUpperCase();
        const email = backendUser.email || "";
        const name = user?.fullName || user?.firstName || user?.username || "";

        setAuthCookie(role as any, name, email);

        let dest: string;

        if (redirect === "/register") {
          dest = "/register?stage=info";
        } else {
          dest = getDashboardRoute(role);

          const loginRole = sessionStorage.getItem("campusvote_login_role") || "student";
          if (role === "STUDENT" && loginRole === "candidate") {
            dest = "/candidate/apply";
          }
        }

        sessionStorage.removeItem("campusvote_login_role");
        sessionStorage.removeItem("campusvote_pending_email");
        sessionStorage.removeItem("campusvote_pending_role");
        sessionStorage.removeItem("campusvote_dest");

        if (!cancelled) {
          setStep("success");
          setTimeout(() => router.replace(dest), 800);
        }
      } catch (err) {
        console.error("Callback routing failed:", err);
        if (!cancelled) {
          setErrorMsg("Something went wrong. Please try signing in again.");
          setStep("error");
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, getToken, isLoaded, redirect, signIn, user]);

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center py-8">
          {step === "loading" && (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Signing you in...
              </h2>
              <p className="text-sm text-gray-500">Verifying your credentials</p>
            </>
          )}
          {step === "success" && (
            <>
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Welcome back!
              </h2>
              <p className="text-sm text-gray-500">Redirecting you to your dashboard...</p>
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
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AuthCard>
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Loading...
              </h2>
            </div>
          </AuthCard>
        </AuthLayout>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
