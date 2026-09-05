"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSignIn, useSignUp, useAuth } from "@clerk/nextjs";
import {
  HelpCircle,
  Loader2,
  Mail,
  UserPlus,
  KeyRound,
  Hash,
  Mic,
  GraduationCap,
} from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
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
export type RegisterPortal = "any" | "student" | "cad";

const PORTAL_TITLES: Record<RegisterPortal, string> = {
  any: "Create your account",
  student: "Student Registration",
  cad: "CAD Registration",
};

/**
 * Shared registration portal used by /register, /register/student and
 * /register/cad. The `portal` prop preselects (and locks) the role the same
 * way the login portals work.
 *
 * Flow: email → one-time code (sent by Clerk) → choose a password (+ roll
 * number for students) → backend account → dashboard.
 *
 * Portal rules mirror the login portals:
 *  - CAD registration is OPEN (anyone can create a CAD account).
 *  - Student registration is DISABLED for now (the dedicated /register/student
 *    portal shows a closed notice, like /login/student).
 *  - Admin is never self-registered — admins sign in at /login/admin.
 */
export function RoleRegisterPage({ portal }: { portal: RegisterPortal }) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { getToken } = useAuth();

  // Effective role: locked by the portal, or chosen on the "any" page.
  // The main page registers CAD accounts (the open portal) and says so.
  const [selectedRole, setSelectedRole] = useState<"cad" | "student">(
    portal === "student" ? "student" : "cad"
  );

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

  // ---- Stage 3: set password + roll number → backend account ----
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
    if (selectedRole === "student" && !rollNumber.trim()) {
      setError("Enter your roll / enrollment number.");
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
          role: selectedRole.toUpperCase(),
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
      window.location.href = DASHBOARDS[role] || "/student/dashboard";
    } catch (err) {
      console.error("register complete:", err);
      setError("Unable to reach the server. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  const isCad = selectedRole === "cad";

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center mb-6">
          <AuthHeader
            title={PORTAL_TITLES[portal]}
            subtitle={
              selectedRole === "student"
                ? "Register as a student with your roll number"
                : "Register as an election monitor (CAD)"
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
            {portal === "any" ? (
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-text-primary block">
                  Register as
                </label>
                <div
                  className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2.5"
                  role="radiogroup"
                  aria-label="Register as"
                >
                  {(
                    [
                      {
                        id: "cad" as const,
                        label: "CAD",
                        description: "Election monitor",
                        icon: Mic,
                      },
                      {
                        id: "student" as const,
                        label: "Student",
                        description: "Register with roll number",
                        icon: GraduationCap,
                      },
                    ]
                  ).map((role) => {
                    const Icon = role.icon;
                    const isActive = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => {
                          setSelectedRole(role.id);
                          setError("");
                          setNotice("");
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-150 cursor-pointer text-center",
                          isActive
                            ? "border-primary-600 bg-primary-50 shadow-[0_2px_12px_rgba(248,0,0,0.12)]"
                            : "border-border bg-white hover:border-primary-300 hover:bg-primary-50/50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            isActive ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-600"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-text-primary">{role.label}</p>
                          <p className="text-xs text-text-muted">{role.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-text-secondary text-center">
                  Administrator accounts are not self-registered — sign in at{" "}
                  <Link href="/login/admin" className="text-primary-600 hover:text-primary-700 font-medium">
                    /login/admin
                  </Link>
                </p>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 text-center">
                Registering as <strong>{isCad ? "CAD (Election Monitor)" : "Student"}</strong>
              </div>
            )}

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
                <strong>{email}</strong> verified. Now choose a password
                {selectedRole === "student" ? " and enter your details." : "."}
              </span>
            </div>
            <Input
              id="register-name"
              label="Full name (optional)"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <div className="relative">
              <Input
                id="register-roll"
                label={
                  selectedRole === "student"
                    ? "Roll / enrollment number"
                    : "Roll / enrollment number (optional)"
                }
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
