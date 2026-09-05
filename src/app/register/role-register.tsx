"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSignIn, useSignUp, useAuth, useClerk } from "@clerk/nextjs";
import {
  HelpCircle,
  Loader2,
  Mail,
  UserPlus,
  KeyRound,
  Hash,
  Mic,
} from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { setBindingToken } from "@/lib/session-binding";
import { setAuthCookie } from "@/lib/mock-auth";
import { saveRollNumber } from "@/lib/roll-number";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const DASHBOARDS: Record<string, string> = {
  STUDENT: "/student/dashboard",
  CANDIDATE: "/candidate/dashboard",
  ADMIN: "/admin/dashboard",
  CAD: "/cad/dashboard",
};

type Stage = "email" | "code" | "details";
export type RegisterPortal = "any" | "candidate" | "student";

const PORTAL_TITLES: Record<RegisterPortal, string> = {
  any: "Create your account",
  candidate: "Candidate Registration",
  student: "Student Registration",
};

/**
 * Shared registration portal used by /register and /register/candidate.
 *
 * PORTAL STATUS (for now): only CANDIDATE registration is open. Student
 * registration is closed (/register/student shows the closed notice) and
 * admin accounts are never self-registered (/login/admin only).
 *
 * A candidate registration creates a STUDENT-backed login for the candidate
 * application flow: email → one-time code (sent by Clerk) → password →
 * dashboard → apply as candidate. Candidacy itself is granted when an admin
 * approves the application, never at signup.
 */
export function RoleRegisterPage({ portal }: { portal: RegisterPortal }) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { getToken, isLoaded: authLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();

  // Candidate is the only registrable role for now.
  const [selectedRole] = useState<"candidate" | "student">("candidate");

  // Set when a "send code" click had to sign out of an active Clerk session
  // first; the effect below retries the send once Clerk reports signed-out.
  const [pendingSend, setPendingSend] = useState(false);

  const [stage, setStage] = useState<Stage>("email");
  const [flow, setFlow] = useState<"signin" | "signup" | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
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
    const message = String((err as { message?: string } | null)?.message || "").toLowerCase();
    return message.includes("already signed in") || message.includes("session already");
  };

  // After clicking "Send code" while a stale Clerk session was active, retry
  // the send automatically once the sign-out completes.
  useEffect(() => {
    if (!pendingSend || !authLoaded) return;
    if (!isSignedIn) {
      setPendingSend(false);
      sendCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSend, authLoaded, isSignedIn]);

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
    // session first; the effect above retries the send once signed out.
    if (authLoaded && isSignedIn) {
      setPendingSend(true);
      setIsSending(true);
      clerk.signOut().catch(() => {});
      return;
    }
    setIsSending(true);
    try {
      const normalized = email.trim().toLowerCase();
      // Existing Clerk account → sign in path. Brand-new email → sign up.
      const res = await signIn.emailCode.sendCode({ emailAddress: normalized });
      if (!res?.error) {
        setFlow("signin");
        setStage("code");
        setIsSending(false);
        return;
      }
      if (isNotFoundError(res.error)) {
        const up = await signUp.create({ emailAddress: normalized });
        if (up?.error) {
          setError(`We couldn't start registration for that email${describe(up.error)}`);
          setIsSending(false);
          return;
        }
        const sent = await signUp.verifications.sendEmailCode();
        if (sent?.error) {
          setError(`We couldn't send the code to that email${describe(sent.error)}`);
          setIsSending(false);
          return;
        }
        setFlow("signup");
        setStage("code");
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
      console.error("register sendCode:", err);
      setError("We couldn't send the code. Please check your connection and try again.");
      setIsSending(false);
    }
  };

  // ---- Stage 2: verify the code → Clerk session becomes active ----
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
        if (signUp.status === "complete") {
          const fin = await signUp.finalize();
          if (fin?.error) {
            setError(`Verification could not be completed${describe(fin.error)}`);
            setIsVerifying(false);
            return false;
          }
        }
      } else if (signIn) {
        const res = await signIn.emailCode.verifyCode({ code: trimmed });
        if (res?.error) {
          setError(`The code was not accepted${describe(res.error)}`);
          setIsVerifying(false);
          return false;
        }
        if (signIn.status === "complete") {
          const fin = await signIn.finalize();
          if (fin?.error) {
            setError(`Verification could not be completed${describe(fin.error)}`);
            setIsVerifying(false);
            return false;
          }
        }
      }

      setStage("details");
      setIsVerifying(false);
      return true;
    } catch (err) {
      console.error("register verifyCode:", err);
      setError("Something went wrong verifying the code. Please try again.");
      setIsVerifying(false);
      return false;
    }
  };

  // ---- Stage 3: set password → backend account → dashboard ----
  const completeRegistration = async () => {
    setError("");
    if (password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Enter your full name — it will be used on your application and profile.");
      return;
    }
    setIsSubmitting(true);
    try {
      // The Clerk session token proves the email was verified by code.
      const token = await getToken();
      if (!token) {
        setError("Your verification session expired. Please start again.");
        setIsSubmitting(false);
        return;
      }

      const csrfRes = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.data?.csrfToken || "";

      const res = await fetch(`${API_BASE}/auth/register/clerk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          rollNumber: rollNumber.trim(),
          fullName: fullName.trim(),
          role: "CANDIDATE",
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.error?.code === "EMAIL_EXISTS") {
          setNotice(data.error.message || "An account with this email already exists. Please sign in.");
          setError("");
          setIsSubmitting(false);
          return;
        }
        setError(data.error?.message || "Registration failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Success: persist the session artifacts + roll number (skips the
      // roll-number prompt after sign-in) and go to the dashboard.
      if (data.data?.bindingToken) setBindingToken(data.data.bindingToken);
      const user = data.data?.user;
      if (user?.name) setAuthCookie("student", user.name, user.email || email);
      if (rollNumber.trim()) {
        saveRollNumber("student", email.trim().toLowerCase(), rollNumber.trim());
      }

      const role = String(user?.role || "STUDENT").toUpperCase();
      // New candidates land on the application form (they are STUDENT-backed
      // until an admin approves their application).
      const dest =
        role === "STUDENT" && rollNumber.trim() ? "/candidate/apply" : DASHBOARDS[role] || "/student/dashboard";
      window.location.href = dest;
    } catch (err) {
      console.error("register complete:", err);
      setError("Unable to reach the server. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center mb-6">
          <AuthHeader
            title={PORTAL_TITLES[portal]}
            subtitle="Register to apply as a candidate — email, one-time code and a password"
          />
        </div>

        {notice && (
          <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-primary-800 text-sm break-words">
            {notice}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/login" className="font-medium underline">
                Sign in instead
              </Link>
              <Link href="/forgot-password" className="font-medium underline">
                Forgot password?
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
            <p className="text-xs text-text-secondary text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-xs text-text-muted text-center">
              Student registration is temporarily closed. Administrator accounts are not
              self-registered — sign in at{" "}
              <Link href="/login/admin" className="text-primary-600 hover:text-primary-700 font-medium">
                /login/admin
              </Link>
            </p>
            {/* Clerk renders its invisible bot-protection CAPTCHA here when
                creating brand-new accounts. */}
            <div id="clerk-captcha" />
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

        {stage === "details" && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800 flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>{email}</strong> verified. Now enter your name and choose a password.
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
            />
            <div className="relative">
              <Input
                id="register-roll"
                label="Roll / enrollment number (optional)"
                type="text"
                autoComplete="off"
                placeholder="e.g. 0221IT211045"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
              />
              <Hash className="w-3.5 h-3.5 text-text-muted absolute right-3 top-9" />
            </div>
            <Input
              id="register-password"
              label="Password (min 12 characters)"
              type="password"
              autoComplete="new-password"
              placeholder="Choose a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              id="register-confirm"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") completeRegistration();
              }}
            />
            <Button
              onClick={completeRegistration}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full"
            >
              {!isSubmitting && (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create account
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
            Your email is verified by a one-time code. You&apos;ll sign in with your email and
            password afterwards — and can reset it anytime with{" "}
            <Link href="/forgot-password" className="underline">
              forgot password
            </Link>
            .
          </span>
          <KeyRound className="w-3 h-3 opacity-50 shrink-0" />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
