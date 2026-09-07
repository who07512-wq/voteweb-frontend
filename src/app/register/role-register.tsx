"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSignIn, useSignUp, useAuth, useClerk } from "@clerk/nextjs";
import {
  HelpCircle,
  Loader2,
  Mail,
  UserPlus,
  Hash,
  Mic,
  Phone,
  Lock,
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

type Stage = "form" | "code";
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
 * application flow: full details (name, email, roll no, phone, password) →
 * one-time code (sent by Clerk) → dashboard → apply as candidate. Candidacy
 * itself is granted when an admin approves the application, never at signup.
 * The password + name are supplied to the Clerk sign-up up-front so the
 * sign-up can COMPLETE once the email code is verified (the Clerk instance
 * requires first/last name and a password to finish a new sign-up).
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

  const [stage, setStage] = useState<Stage>("form");
  const [flow, setFlow] = useState<"signup" | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
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

  const validateForm = (): string | null => {
    if (fullName.trim().length < 2) return "Enter your full name.";
    if (!email || !email.includes("@")) return "Enter a valid email address.";
    if (!rollNumber.trim()) return "Enter your roll / enrollment number.";
    const phoneDigits = phone.replace(/[\s()-]/g, "");
    if (!/^\+?[0-9]{10,15}$/.test(phoneDigits))
      return "Enter a valid phone number (10-15 digits).";
    if (!password || password.length < 12)
      return "Password must be at least 12 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  // ---- Stage 1: validate details, then send the one-time code ----
  const startRegistration = async () => {
    setError("");
    const invalid = validateForm();
    if (invalid) {
      setError(invalid);
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
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts.slice(0, -1).join(" ") || parts[0];
      const lastName = parts[parts.length - 1] || "";

      // Probe: does this email already exist? signIn.create starts an attempt
      // without sending any email.
      try {
        await signIn.reset();
      } catch { /* no prior attempt to reset */ }
      const probe = await signIn.create({ identifier: normalized });
      if (!probe?.error) {
        setError("An account with this email already exists. Sign in instead.");
        setIsSending(false);
        return;
      }
      if (!isNotFoundError(probe.error)) {
        // Session appeared mid-flow (e.g. restored late) — sign out & retry.
        if (isAlreadySignedInError(probe.error)) {
          setPendingSend(true);
          clerk.signOut().catch(() => {});
          return;
        }
        setError(`We couldn't start registration for that email${describe(probe.error)}`);
        setIsSending(false);
        return;
      }

      // Brand-new email → create the Clerk sign-up. First/last name + password
      // are provided up-front so the sign-up reaches "complete" once the email
      // code verifies (the instance requires these attributes).
      const up = await signUp.create({
        emailAddress: normalized,
        firstName,
        lastName,
        password,
      });
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
    } catch (err) {
      console.error("register startRegistration:", err);
      setError("We couldn't start registration. Please check your connection and try again.");
      setIsSending(false);
    }
  };

  // After clicking "Register" while a stale Clerk session was active, retry
  // the send automatically once the sign-out completes.
  useEffect(() => {
    if (!pendingSend || !authLoaded) return;
    if (!isSignedIn) {
      setPendingSend(false);
      startRegistration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSend, authLoaded, isSignedIn]);

  // ---- Stage 2: verify the code → sign-up completes → finish the account ----
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
          // signUp.finalize() creates the session but does NOT automatically
          // make it active (sign-in finalize does). Without this, getToken()
          // below returns null → the confusing "session expired" error.
          // Activate the freshly created session explicitly, like the working
          // sign-in flow does on its own.
          const createdSessionId = (fin as { createdSessionId?: string } | null)?.createdSessionId || signUp.createdSessionId;
          if (createdSessionId) {
            try {
              await clerk.setActive({ session: createdSessionId });
              await new Promise((r) => setTimeout(r, 250));
            } catch (e) {
              console.error("register setActive:", e);
            }
          }
        } else {
          // Should not happen now that password + name ride the sign-up, but
          // surface the real state instead of a confusing "expired" message.
          setError("Your email is verified, but the account setup needs more details. Please start again.");
          setIsVerifying(false);
          return false;
        }
      } else {
        setError("Registration is still loading. Please try again.");
        setIsVerifying(false);
        return false;
      }

      setIsVerifying(false);
      return true;
    } catch (err) {
      console.error("register verifyCode:", err);
      setError("Something went wrong verifying the code. Please try again.");
      setIsVerifying(false);
      return false;
    }
  };

  // ---- Finish: create the backend account → dashboard ----
  const completeRegistration = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      // The Clerk session token proves the email was verified by code.
      // A fresh email-code signup may not have a cached token yet — skip the
      // cache and (if needed) give Clerk a moment to persist the session
      // before giving up, so a just-completed verification isn't reported as
      // "expired".
      let token = await getToken({ skipCache: true });
      if (!token) {
        await new Promise((r) => setTimeout(r, 500));
        token = await getToken({ skipCache: true });
      }
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
          rollNumber: rollNumber.trim(),
          fullName: fullName.trim(),
          mobileNumber: phone.replace(/[\s()-]/g, ""),
          password,
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

  const handleVerify = async () => {
    if (await verifyCode()) {
      completeRegistration();
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center mb-6">
          <AuthHeader
            title={PORTAL_TITLES[portal]}
            subtitle="Register to apply as a candidate — verify your email with a one-time code"
          />
        </div>

        {notice && (
          <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-primary-800 text-sm break-words">
            {notice}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/login" className="font-medium underline">
                Sign in instead
              </Link>
              <Link href="/email-recovery" className="font-medium underline">
                Can't access your email?
              </Link>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm break-words">
            {error}
          </div>
        )}

        {stage === "form" && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 text-center flex items-center justify-center gap-2">
              <Mic className="w-4 h-4 shrink-0" />
              <span>
                Registering as <strong>Candidate</strong>
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
                if (e.key === "Enter") startRegistration();
              }}
            />
            <Input
              id="register-email"
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                label="Phone number"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Phone className="w-3.5 h-3.5 text-text-muted absolute right-3 top-9" />
            </div>
            <div className="relative">
              <Input
                id="register-password"
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 12 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="w-3.5 h-3.5 text-text-muted absolute right-3 top-9" />
            </div>
            <Input
              id="register-confirm-password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") startRegistration();
              }}
            />
            <Button
              onClick={startRegistration}
              disabled={isSending}
              isLoading={isSending}
              className="w-full"
            >
              {!isSending && (
                <>
                  <UserPlus className="w-4 h-4" />
                  Register
                </>
              )}
            </Button>

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
                We sent a one-time code to <strong>{email}</strong>. Enter it below to verify your email.
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
                if (e.key === "Enter") handleVerify();
              }}
            />
            <Button
              onClick={handleVerify}
              disabled={isVerifying || isSubmitting}
              isLoading={isVerifying || isSubmitting}
              className="w-full"
            >
              {!(isVerifying || isSubmitting) && (
                <>
                  <UserPlus className="w-4 h-4" />
                  Verify & Create Account
                </>
              )}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-text-secondary">
              <button
                type="button"
                onClick={() => {
                  if (flow === "signup" && signUp) signUp.verifications.sendEmailCode().catch(() => {});
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
                  signUp.reset?.().catch(() => {});
                  signIn.reset?.().catch(() => {});
                  setStage("form");
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

        <div className="mt-6 pt-4 border-t border-border text-xs text-text-secondary text-center flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 leading-relaxed px-1">
          {isSubmitting || isVerifying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : (
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>
            Your email is verified with a one-time code. After registering, sign in with your
            password or a fresh code sent to this email.
          </span>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}