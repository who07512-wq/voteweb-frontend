"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useUser, useSignIn, useSignUp, useClerk } from "@clerk/nextjs";
import { Loader2, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { setAuthCookie } from "@/lib/mock-auth";
import { getDashboardRoute } from "@/lib/dashboard-route";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken, isLoaded } = useAuth();
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { user } = useUser();
  const [step, setStep] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const redirect = searchParams.get("redirect") || "";
  const hasRun = useRef(false);

  const bridgeToBackend = async (token: string, name?: string) => {
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
        name: name || user?.fullName || user?.firstName || user?.username || "",
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg =
        typeof data.error === "string"
          ? data.error
          : data.error?.message || "Failed to create session.";
      throw new Error(msg);
    }

    const data = await res.json();
    return data.data;
  };

  const navigateAfterBridge = (backendData: any) => {
    const backendUser = backendData?.user || {};
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

    setStep("success");
    setTimeout(() => router.replace(dest), 800);
  };

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

        // 2. OAuth flow: follow the official Clerk v7 callback pattern.
        console.log("[clerk-callback] signIn status:", signIn?.status);
        console.log("[clerk-callback] signUp status:", signUp?.status);
        console.log("[clerk-callback] signIn existingSession:", !!signIn?.existingSession);
        console.log("[clerk-callback] signUp existingSession:", !!signUp?.existingSession);
        console.log("[clerk-callback] signIn isTransferable:", signIn?.isTransferable);
        console.log("[clerk-callback] signUp isTransferable:", signUp?.isTransferable);

        // Case A: Sign-in is already complete — finalize it.
        if (signIn?.status === "complete") {
          console.log("[clerk-callback] signIn complete, finalizing...");
          await signIn.finalize({
            navigate: async ({ session, decorateUrl }: any) => {
              if (session?.currentTask) {
                console.log("[clerk-callback] session task:", session.currentTask);
                return;
              }
              // Don't navigate — we handle routing ourselves after bridging.
            },
          });
        }

        // Case B: Sign-up used an existing account — transfer to sign-in.
        if (signUp?.isTransferable) {
          console.log("[clerk-callback] signUp transferable, transferring to sign-in...");
          await signIn.create({ transfer: true });
          if (signIn.status === "complete") {
            await signIn.finalize({
              navigate: async () => {},
            });
          }
        }

        // Case C: Sign-in used an external account not in DB — transfer to sign-up.
        if (signIn?.isTransferable) {
          console.log("[clerk-callback] signIn transferable, transferring to sign-up...");
          await signUp.create({ transfer: true });
          if (signUp.status === "complete") {
            await signUp.finalize({
              navigate: async () => {},
            });
          }
          // Sign-up needs more info — redirect to register.
          if (!cancelled) {
            setErrorMsg("Account not found. Redirecting to registration...");
            setStep("error");
            setTimeout(() => router.replace("/register"), 1500);
          }
          return;
        }

        // Case D: Sign-in has an existing session — activate it.
        if (signIn?.existingSession || signUp?.existingSession) {
          const sessionId = signIn?.existingSession?.sessionId || signUp?.existingSession?.sessionId;
          if (sessionId) {
            console.log("[clerk-callback] activating existing session:", sessionId);
            await clerk.setActive({
              session: sessionId,
              navigate: async () => {},
            });
          }
        }

        // Case E: Sign-up is complete — finalize it.
        if (signUp?.status === "complete") {
          console.log("[clerk-callback] signUp complete, finalizing...");
          await signUp.finalize({
            navigate: async () => {},
          });
        }

        // Now try to get the token with retries.
        let token: string | null = null;
        for (let attempt = 0; attempt < 30; attempt++) {
          token = await getToken();
          if (token) break;
          console.log(`[clerk-callback] getToken attempt ${attempt + 1} failed, retrying...`);
          await new Promise((r) => setTimeout(r, 500));
        }

        if (!token) {
          console.error("[clerk-callback] all getToken attempts failed");
          console.error("[clerk-callback] final signIn status:", signIn?.status);
          console.error("[clerk-callback] final signUp status:", signUp?.status);
          if (!cancelled) {
            setErrorMsg("Could not retrieve session token. Please try again.");
            setStep("error");
          }
          return;
        }

        console.log("[clerk-callback] got token, bridging to backend...");
        const backendData = await bridgeToBackend(token, user?.fullName || user?.firstName || user?.username || "");

        if (!cancelled) {
          navigateAfterBridge(backendData);
        }
      } catch (err) {
        console.error("[clerk-callback] error:", err);
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try signing in again.");
          setStep("error");
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, getToken, isLoaded, redirect, signIn, signUp, clerk, user]);

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
