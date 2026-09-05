"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSignIn, useSignUp, useAuth, useClerk } from "@clerk/nextjs";
import { HelpCircle, Loader2, Mail, KeyRound } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { setBindingToken } from "@/lib/session-binding";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const DASHBOARDS: Record<string, string> = {
  STUDENT: "/student/dashboard",
  CANDIDATE: "/candidate/dashboard",
  ADMIN: "/admin/dashboard",
  CAD: "/cad/dashboard",
};

type Stage = "email" | "code" | "new-password";

/**
 * Forgot password: email → one-time code (sent by Clerk) → choose a new
 * password. The backend verifies the Clerk session token server-side before
 * changing the password, so only whoever received the code can reset it.
 */
export default function ForgotPasswordPage() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { getToken, isLoaded: authLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();

  // Set when a "send code" click had to sign out of an active Clerk session
  // first; the effect below retries the send once Clerk reports signed-out.
  const [pendingSend, setPendingSend] = useState(false);

  const [stage, setStage] = useState<Stage>("email");
  const [flow, setFlow] = useState<"signin" | "signup" | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const describe = (err: unknown): string => {
    const anyErr = err as { code?: string; message?: string } | null;
    const code = anyErr?.code ? ` (code: ${anyErr.code})` : "";
    const message = anyErr?.message ? ` — ${anyErr.message}` : "";
    return `${code}${message}`;
  };

  const isNotFoundError = (err: unknown): boolean => {
    const anyErr = err as { code?: string; message?: string } | null;
    const code = String(anyErr?.code || "");
    const message = String(anyErr?.message || "").toLowerCase();
    return (
      code.includes("identifier_not_found") ||
      code.includes("form_identifier_not_found") ||
      code.includes("not_found") ||
      // The SDK sometimes wraps Clerk's "Couldn't find your account." error
      // in a generic api_response_error — match the human message too.
      message.includes("couldn't find") ||
      message.includes("couldnt find") ||
      message.includes("could not find") ||
      message.includes("no account")
    );
  };

  const isAlreadySignedInError = (err: unknown): boolean => {
    const anyErr = err as { code?: string; message?: string } | null;
    const message = String(anyErr?.message || "").toLowerCase();
    return message.includes("already signed in") || message.includes("session already");
  };

  // ---- Stage 1: send the one-time code ----
  const sendCode = async () => {
    setError("");
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address to continue.");
      return;
    }
    if (!signIn || !signUp) {
      setError("Still loading. Please try again in a moment.");
      return;
    }
    // An active Clerk session blocks starting a new code flow (Clerk
    // rejects with "You're already signed in."). Sign out of the stale
    // session first; the effect below retries the send once signed out.
    if (authLoaded && isSignedIn) {
      setPendingSend(true);
      setIsSending(true);
      clerk.signOut().catch(() => {});
      return;
    }
    setIsSending(true);
    try {
      const normalized = email.trim().toLowerCase();
      const res = await signIn.emailCode.sendCode({ emailAddress: normalized });
      if (!res?.error) {
        setFlow("signin");
        setStage("code");
        setIsSending(false);
        return;
      }
      if (isNotFoundError(res.error)) {
        // No account with this email — tell the user plainly (registration
        // is the right path for them) instead of creating a new account.
        setError("No account exists with this email. Create one from the Register page first.");
        setIsSending(false);
        return;
      }
      // Session appeared mid-flow (e.g. restored late) — sign out & retry.
      if (isAlreadySignedInError(res.error)) {
        setPendingSend(true);
        clerk.signOut().catch(() => {});
        return;
      }
      setError(`We couldn't send the code to that email${describe(res.error)}`);
      setIsSending(false);
    } catch (err) {
      console.error("forgot sendCode:", err);
      setError("We couldn't send the code. Please check your connection and try again.");
      setIsSending(false);
    }
  };

  // ---- Stage 2: verify the code ----
  const verifyCode = async (): Promise<boolean> => {
    setError("");
    if (!code || code.trim().length < 4) {
      setError("Enter the code you received by email.");
      return false;
    }
    setIsVerifying(true);
    try {
      const trimmed = code.trim();

      if (flow === "signup" && signUp) {
        const res = await signUp.verifications.verifyEmailCode({ code: trimmed });
        if (res?.error) {
          setError(`The code was not accepted${describe(res.error)}`);
          setIsVerifying(false);
          return false;
        }
      } else if (signIn) {
        const res = await signIn.emailCode.verifyCode({ code: trimmed });
        if (res?.error) {
          setError(`The code was not accepted${describe(res.error)}`);
          setIsVerifying(false);
          return false;
        }
        if (signIn.status === "complete") {
          // IMPORTANT: do NOT finalize the sign-in — this is a password reset,
          // not a login. Keep the pre-finalize state so the session token can
          // be used to prove the email for the reset endpoint.
          setStage("new-password");
          setIsVerifying(false);
          return true;
        }
        setError("Verification is not complete. Please try again.");
        setIsVerifying(false);
        return false;
      }

      setStage("new-password");
      setIsVerifying(false);
      return true;
    } catch (err) {
      console.error("forgot verifyCode:", err);
      setError("Something went wrong verifying the code. Please try again.");
      setIsVerifying(false);
      return false;
    }
  };

  // ---- Stage 3: set the new password ----
  const resetPassword = async () => {
    setError("");
    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        setError("Your verification session expired. Please start again.");
        setIsSubmitting(false);
        return;
      }

      const csrfRes = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.data?.csrfToken || "";

      const res = await fetch(`${API_BASE}/auth/forgot-password/clerk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          newPassword,
          confirmNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.error?.code === "ACCOUNT_NOT_FOUND") {
          setNotice(data.error.message || "No account exists for this email. Please register first.");
          setError("");
          setIsSubmitting(false);
          return;
        }
        setError(data.error?.message || "Password reset failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Success — the backend revoked old sessions and issued a fresh one.
      if (data.data?.bindingToken) setBindingToken(data.data.bindingToken);
      const user = data.data?.user;
      const role = String(user?.role || "STUDENT").toUpperCase();
      window.location.href = DASHBOARDS[role] || "/student/dashboard";
    } catch (err) {
      console.error("forgot reset:", err);
      setError("Unable to reach the server. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center mb-6">
          <AuthHeader
            title="Forgot password"
            subtitle="Verify your email with a one-time code, then choose a new password"
          />
        </div>

        {notice && (
          <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-primary-800 text-sm break-words">
            {notice}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/register" className="font-medium underline">
                Create an account
              </Link>
              <Link href="/login" className="font-medium underline">
                Back to sign in
              </Link>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm break-words">
            {error}
          </div>
        )}

        {stage === "email" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="text-xs font-medium text-text-secondary">
                Email address
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="forgot-email"
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
            <p className="text-xs text-text-secondary text-center">
              Remembered it?{" "}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {stage === "code" && (
          <div className="space-y-4">
            <div className="p-3 bg-primary-50 border border-primary-100 rounded-lg text-sm text-primary-800 flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                We sent a one-time code to <strong>{email}</strong>. Enter it below to continue.
              </span>
            </div>
            <Input
              id="forgot-code"
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
                onClick={() => {
                  if (flow === "signup" && signUp) signUp.verifications.sendEmailCode().catch(() => {});
                  else if (signIn) signIn.emailCode.sendCode({}).catch(() => {});
                  setCode("");
                  setError("");
                  setNotice("A new code has been sent to your email.");
                }}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => {
                  setStage("email");
                  setCode("");
                  setFlow(null);
                  setError("");
                  setNotice("");
                }}
                className="text-text-muted hover:text-text-secondary font-medium"
              >
                Use a different email
              </button>
            </div>
          </div>
        )}

        {stage === "new-password" && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800 flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>{email}</strong> verified. Choose a new password for your account.
              </span>
            </div>
            <Input
              id="forgot-new-password"
              label="New password (min 12 characters)"
              type="password"
              autoComplete="new-password"
              placeholder="Choose a strong password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              id="forgot-confirm"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") resetPassword();
              }}
            />
            <Button
              onClick={resetPassword}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full"
            >
              {!isSubmitting && (
                <>
                  <KeyRound className="w-4 h-4" />
                  Set new password
                </>
              )}
            </Button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border text-xs text-text-secondary text-center flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 leading-relaxed px-1">
          {isSubmitting || isVerifying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : (
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>
            For security, every other signed-in device is signed out after a password reset.
          </span>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
