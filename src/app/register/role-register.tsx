"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSignUp, useAuth } from "@clerk/nextjs";
import {
  HelpCircle,
  Loader2,
  Mail,
  UserPlus,
  Hash,
  Mic,
  Phone,
} from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { setBindingToken } from "@/lib/session-binding";
import { setAuthCookie } from "@/lib/mock-auth";
import { getDashboardRoute } from "@/lib/dashboard-route";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

type Stage = "email" | "code" | "info";
export type RegisterPortal = "any" | "candidate" | "student";

const PORTAL_TITLES: Record<RegisterPortal, string> = {
  any: "Create your account",
  candidate: "Candidate Registration",
  student: "Student Registration",
};

export function RoleRegisterPage({ portal }: { portal: RegisterPortal }) {
  const { signUp } = useSignUp();
  const { getToken, isSignedIn } = useAuth();

  const [selectedRole] = useState<"candidate" | "student">("candidate");

  // If already signed in (stale session from a previous login), redirect to
  // login so the user can sign out properly before registering a new account.
  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const { getMe } = await import("@/lib/api/v1");
        const me = await getMe();
        if (cancelled) return;
        if (me.authenticated && me.user) {
          window.location.href = getDashboardRoute(me.user.role);
        }
      } catch {
        // Not authenticated server-side — stay on register.
      }
    })();
    return () => { cancelled = true; };
  }, [isSignedIn]);

  const [stage, setStage] = useState<Stage>("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const bridgeToBackend = async (role: string) => {
    try {
      const clerkToken = await getToken();
      if (!clerkToken) {
        console.error("No Clerk session token available");
        return;
      }

      const csrfRes = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
      const csrfData = await csrfRes.json().catch(() => ({}));
      const csrfToken = csrfData.data?.csrfToken || "";

      const res = await fetch(`${API_BASE}/auth/clerk-session`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
          "Authorization": `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({
          role,
          name: fullName.trim(),
          enrollmentNumber: rollNumber.trim(),
          mobileNumber: phone.replace(/[\s()-]/g, ""),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.data?.bindingToken) {
        setBindingToken(data.data.bindingToken);
      }
      if (res.ok && data.data?.user) {
        setAuthCookie(data.data.user.role || role, data.data.user.name || fullName, data.data.user.email || email);
      }
    } catch (err) {
      console.error("Backend bridge failed:", err);
    }
  };

  const isTestEmail = (e: string) => e.toLowerCase().includes("+clerk_test");

  const sendCode = async () => {
    setError("");
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (!signUp) return;
    setIsSending(true);
    try {
      const normalized = email.trim().toLowerCase();

      // If there's a stale sign-up from a previous attempt, Clerk may
      // reject create() or sendEmailCode() with a 400. Try to recover
      // by setting the email address again to reset the sign-up state.
      let createError: { longMessage?: string; message?: string; code?: string } | null = null;
      const createResult = await signUp.create({
        emailAddress: normalized,
      });
      createError = createResult.error || null;

      if (createError) {
        if (createError.code === "form_identifier_exists") {
          setError("This email is already registered. Please sign in instead.");
          setIsSending(false);
          return;
        }
        // For other create errors, try to reset by setting email again.
        try {
          await signUp.update({ emailAddress: normalized });
          createError = null;
        } catch {
          setError(createError?.longMessage || createError?.message || "Could not start registration. Please try again.");
          setIsSending(false);
          return;
        }
      }

      let { error: sendError } = await signUp.verifications.sendEmailCode();

      if (sendError) {
        try {
          await signUp.update({ emailAddress: normalized });
          const retry = await signUp.verifications.sendEmailCode();
          if (retry.error) {
            setError(retry.error.longMessage || retry.error.message || "Could not send verification code. Please try again.");
            setIsSending(false);
            return;
          }
        } catch {
          setError(sendError.longMessage || sendError.message || "Could not send verification code. Please try again.");
          setIsSending(false);
          return;
        }
      }

      // For test emails (+clerk_test), no email is sent — auto-verify with 424242.
      if (isTestEmail(email)) {
        const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code: "424242" });
        if (!verifyErr) {
          setStage("info");
          setIsSending(false);
          return;
        }
        // If auto-verify fails, fall through to manual code entry.
      }

      setStage("code");
      setIsSending(false);
    } catch (err) {
      console.error("sendCode threw:", err);
      setError("Something went wrong. Please try again.");
      setIsSending(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    if (!code || code.trim().length < 4) {
      setError("Enter the code you received by email.");
      return;
    }
    if (!signUp) return;
    setIsVerifying(true);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });

      if (error) {
        if (error.code === "form_identifier_not_found") {
          setError("This email is already registered. Please sign in instead.");
          setIsVerifying(false);
          return;
        }
        setError(error.longMessage || error.message || "Invalid or expired code. Please try again.");
        setIsVerifying(false);
        return;
      }

      // Email code verified successfully — proceed to info form regardless
      // of signUp.status. Clerk may show "complete" or an intermediate status
      // depending on required fields; we collect the remaining info ourselves.
      setStage("info");
      setIsVerifying(false);
    } catch (err) {
      console.error("verifyCode threw:", err);
      setError("Something went wrong. Please try again.");
      setIsVerifying(false);
    }
  };

  const submitInfo = async () => {
    setError("");
    if (fullName.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!rollNumber.trim()) {
      setError("Enter your roll / enrollment number.");
      return;
    }
    const phoneDigits = phone.replace(/[\s()-]/g, "");
    if (phoneDigits && !/^\+?[0-9]{10,15}$/.test(phoneDigits)) {
      setError("Enter a valid phone number (10-15 digits).");
      return;
    }

    setIsSubmitting(true);
    try {
      const backendRole = selectedRole.toUpperCase();
      await bridgeToBackend(backendRole);

      const dest =
        backendRole === "STUDENT" && rollNumber.trim() ? "/candidate/apply" : getDashboardRoute(backendRole);

      window.location.href = dest;
    } catch (err) {
      console.error("submitInfo threw:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    setCode("");
    setError("");
    if (!signUp) return;
    try {
      await signUp.verifications.sendEmailCode();
    } catch (err) {
      console.error("Resend failed:", err);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center mb-6">
          <AuthHeader
            title={PORTAL_TITLES[portal]}
            subtitle={
              stage === "email"
                ? "Enter your email to get started"
                : stage === "code"
                  ? "Verify your email with the code we sent"
                  : "Complete your profile to finish registration"
            }
          />
        </div>

        {notice && (
          <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-primary-800 text-sm break-words">
            {notice}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/login" className="font-medium underline">
                Sign in instead
              </Link>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm break-words">
            {error}
          </div>
        )}

        {/* Stage 1: Email */}
        {stage === "email" && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 text-center flex items-center justify-center gap-2">
              <Mic className="w-4 h-4 shrink-0" />
              <span>
                Registering as <strong>Candidate</strong>
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="register-email" className="text-xs font-medium text-text-secondary">
                Email address
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendCode();
                  }}
                  className="flex-1 min-w-0 px-4 py-2.5 text-sm bg-white dark:bg-[#252540] border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <Button
                  onClick={sendCode}
                  disabled={isSending}
                  isLoading={isSending}
                  className="w-full sm:w-auto shrink-0"
                >
                  {!isSending && "Send code"}
                </Button>
              </div>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-[#1a1a2e] px-2 text-text-muted">or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (!signUp) return;
                const { error } = await signUp.sso({
                  strategy: "oauth_google",
                  redirectUrl: `${window.location.origin}/auth/clerk-callback?redirect=/register`,
                  redirectCallbackUrl: `${window.location.origin}/auth/clerk-callback?redirect=/register`,
                });
                if (error) {
                  setError(error.message || "Google sign-up failed. Please try again.");
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-primary bg-white dark:bg-[#252540] hover:bg-gray-50 dark:hover:bg-[#2a2a4a] transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign up with Google
            </button>

            <p className="text-xs text-text-secondary text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Stage 2: OTP Code */}
        {stage === "code" && (
          <div className="space-y-4">
            <div className="p-3 bg-primary-50 border border-primary-100 rounded-lg text-sm text-primary-800 flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                We sent a one-time code to <strong>{email}</strong>. Enter it below.
              </span>
            </div>
            <Input
              id="register-code"
              label="One-time code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") verifyCode();
              }}
            />
            <Button
              onClick={verifyCode}
              disabled={isVerifying}
              isLoading={isVerifying}
              className="w-full"
            >
              {!isVerifying && "Verify code"}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-text-secondary">
              <button
                type="button"
                onClick={resendCode}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => {
                  setStage("email");
                  setCode("");
                  setError("");
                }}
                className="text-text-muted hover:text-text-secondary font-medium"
              >
                Use a different email
              </button>
            </div>
          </div>
        )}

        {/* Stage 3: Info Form (after email verified) */}
        {stage === "info" && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>{email}</strong> verified. Now complete your profile.
              </span>
            </div>

            <Input
              id="register-name"
              label="Full name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitInfo();
              }}
            />
            <div className="relative">
              <Input
                id="register-roll"
                label="Roll / enrollment number"
                type="text"
                autoComplete="off"
                placeholder="e.g. 0221IT211045"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
              />
              <Hash className="w-3.5 h-3.5 text-text-muted absolute right-3 top-9" />
            </div>
            <div className="relative">
              <Input
                id="register-phone"
                label="Phone number (optional)"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Phone className="w-3.5 h-3.5 text-text-muted absolute right-3 top-9" />
            </div>
            <Button
              onClick={submitInfo}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full"
            >
              {!isSubmitting && (
                <>
                  <UserPlus className="w-4 h-4" />
                  Complete Registration
                </>
              )}
            </Button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border text-xs text-text-secondary text-center flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 leading-relaxed px-1">
          {isVerifying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : (
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>
            {stage === "email"
              ? "Enter your email to receive a one-time verification code"
              : stage === "code"
                ? "Enter the 6-digit code sent to your email"
                : "Your email is verified — complete your profile to finish"}
          </span>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
