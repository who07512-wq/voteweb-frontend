"use client";

import React, { useEffect, useState } from "react";
import { useSignIn, useSignUp, useAuth, useClerk } from "@clerk/nextjs";
import { HelpCircle, Loader2, ShieldAlert, Mail, KeyRound } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { setBindingToken } from "@/lib/session-binding";
import { setAuthCookie } from "@/lib/mock-auth";
import type { UserRole } from "@/lib/auth-types";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const PORTAL_ROLE_KEY: Record<string, string> = {
  any: "",
  student: "student",
  cad: "cad",
  admin: "administrator",
};

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  candidate: "Candidate",
  cad: "CAD",
  administrator: "Administrator",
};

/**
 * Shared login portal used by /login, /login/student, /login/cad and
 * /login/admin. The `portal` prop preselects (and for non-student portals
 * locks) the role; the backend still verifies the DB role after sign-in.
 *
 * Two sign-in methods:
 *
 * 1. EMAIL CODE (student / candidate / CAD portals, and the "any" main page
 *    for non-administrator roles). The user enters their email and Clerk
 *    emails a one-time code. Accounts are created on the fly for new emails
 *    (the CAD portal is open), so there is no invite gate for these portals.
 *
 * 2. FIXED EMAIL + PASSWORD (Admin portal). The email must be in ADMIN_EMAILS
 *    and the password must match ADMIN_PORTAL_PASSWORD (checked server-side).
 *    No Clerk involvement.
 */
export function RoleLoginPage({
  portal,
  initialRole,
}: {
  portal: "any" | "student" | "cad" | "admin";
  initialRole?: UserRole;
}) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();

  // Set when a "send code" click had to sign out of an active Clerk session
  // first; the effect below retries the send once Clerk reports signed-out.
  const [pendingSend, setPendingSend] = useState(false);

  // Effective role: locked by the portal, or chosen on the "any" page.
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    initialRole ||
      (portal === "student"
        ? "student"
        : portal === "cad"
          ? "cad"
          : portal === "admin"
            ? "administrator"
            : "student")
  );

  // Admin password login uses a separate credential path (no Clerk).
  const isAdminFlow =
    portal === "admin" || selectedRole === "administrator";

  // Email-code flow state
  const [stage, setStage] = useState<"email" | "code">("email");
  const [flow, setFlow] = useState<"signin" | "signup" | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [notice, setNotice] = useState(
    portal === "admin"
      ? "Administrator access only — only listed administrator emails can sign in."
      : portal === "cad"
        ? "Election monitor portal — anyone with an email address can sign in with a one-time code. Only the Admin portal is restricted."
        : ""
  );
  const [error, setError] = useState("");

  // Password login (primary method for registered accounts).
  const [loginMethod, setLoginMethod] = useState<"password" | "code">("password");
  const [loginPassword, setLoginPassword] = useState("");
  const [isPasswordLoggingIn, setIsPasswordLoggingIn] = useState(false);

  // Admin password fields
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  useEffect(() => {
    // Surface role-mismatch rejections relayed by the callback page
    const flagged = sessionStorage.getItem("campusvote_role_mismatch");
    if (flagged) {
      setNotice("");
      setError(
        "This account is not authorized for this portal. Sign in from the correct portal for your role."
      );
      sessionStorage.removeItem("campusvote_role_mismatch");
    }
  }, []);

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

  const setRoleFlags = () => {
    const roleKey = selectedRole;
    sessionStorage.setItem("campusvote_login_role", roleKey);
    sessionStorage.setItem("campusvote_oauth_started", "1");
    sessionStorage.removeItem("campusvote_bridged");
    sessionStorage.removeItem("campusvote_dest");
  };

  const goToCallback = () => {
    window.location.href = `${window.location.origin}/auth/clerk-callback`;
  };

  // If a Clerk session is ALREADY active (signed in earlier but landed back on
  // /login), skip the round-trip and bridge straight to the backend session.
  const bounceExistingSession = () => {
    if (isAdminFlow) return false;
    if (authLoaded && isSignedIn) {
      setRoleFlags();
      goToCallback();
      return true;
    }
    return false;
  };

  // After clicking "Send code" while a stale Clerk session was active, retry
  // the send automatically once the sign-out completes.
  useEffect(() => {
    if (!pendingSend || !authLoaded) return;
    if (!isSignedIn) {
      setPendingSend(false);
      sendEmailCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSend, authLoaded, isSignedIn]);

  const sendEmailCode = async () => {
    setError("");
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address to continue.");
      return;
    }
    if (!signIn || !signUp) {
      setError("Sign-in is still loading. Please try again in a moment.");
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
      setRoleFlags();
      const normalized = email.trim().toLowerCase();

      // Attempt 1: the email belongs to an existing Clerk account → sign in.
      const res = await signIn.emailCode.sendCode({ emailAddress: normalized });
      if (!res?.error) {
        setFlow("signin");
        setStage("code");
        setIsSending(false);
        return;
      }

      // Attempt 2: brand-new email → create the account (email-code sign-up).
      if (isNotFoundError(res.error)) {
        const up = await signUp.create({ emailAddress: normalized });
        if (up?.error) {
          console.error("Email code (sign-up create) failed:", up.error);
          setError(
            `We couldn't start sign-in for that email${describe(up.error)}`
          );
          setIsSending(false);
          return;
        }
        const sent = await signUp.verifications.sendEmailCode();
        if (sent?.error) {
          console.error("Email code (send, sign-up) failed:", sent.error);
          setError(
            `We couldn't send the code to that email${describe(sent.error)}`
          );
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

      // Any other error (rate limit, blocked address, etc.)
      console.error("Email code (sign-in) failed:", res.error);
      setError(
        `We couldn't send the code to that email${describe(res.error)}`
      );
      setIsSending(false);
    } catch (err) {
      console.error("sendEmailCode threw:", err);
      setError(
        "We couldn't send the code. Please check your connection and try again."
      );
      setIsSending(false);
    }
  };

  const verifyEmailCode = async () => {
    setError("");
    if (!code || code.trim().length < 4) {
      setError("Enter the code you received by email.");
      return;
    }
    setIsVerifying(true);
    try {
      const trimmed = code.trim();

      if (flow === "signup" && signUp) {
        const res = await signUp.verifications.verifyEmailCode({
          code: trimmed,
        });
        if (res?.error) {
          setError(`The code was not accepted${describe(res.error)}`);
          setIsVerifying(false);
          return;
        }
        if (signUp.status === "complete") {
          const fin = await signUp.finalize();
          if (fin?.error) {
            setError(`Sign-in could not be completed${describe(fin.error)}`);
            setIsVerifying(false);
            return;
          }
          goToCallback();
          return;
        }
        setError("Verification is not complete. Please try again.");
        setIsVerifying(false);
        return;
      }

      if (signIn) {
        const res = await signIn.emailCode.verifyCode({ code: trimmed });
        if (res?.error) {
          const message = String(
            (res.error as { message?: string } | null)?.message || ""
          ).toLowerCase();
          // Codes are single-use and expire (~10 min), and resending
          // invalidates older ones — a rejected attempt is almost always a
          // stale code. Restart the flow so a fresh code goes out.
          if (
            message.includes("incorrect") ||
            message.includes("expired") ||
            message.includes("already used")
          ) {
            setNotice("");
            setCode("");
            setStage("email");
            setFlow(null);
            setError(
              "That code is no longer valid (codes expire and resending voids older ones). We've restarted the process — enter your email again and use the newest code."
            );
            setIsVerifying(false);
            return;
          }
          setError(`The code was not accepted${describe(res.error)}`);
          setIsVerifying(false);
          return;
        }
        if (signIn.status === "complete") {
          const fin = await signIn.finalize();
          if (fin?.error) {
            setError(`Sign-in could not be completed${describe(fin.error)}`);
            setIsVerifying(false);
            return;
          }
          goToCallback();
          return;
        }
        setError("Verification is not complete. Please try again.");
        setIsVerifying(false);
        return;
      }

      setError("Sign-in is still loading. Please try again.");
      setIsVerifying(false);
    } catch (err) {
      console.error("verifyEmailCode threw:", err);
      setError("Something went wrong verifying the code. Please try again.");
      setIsVerifying(false);
    }
  };

  const resendCode = () => {
    if (flow === "signup" && signUp) {
      signUp.verifications.sendEmailCode().catch(() => {});
    } else if (signIn) {
      signIn.emailCode.sendCode({}).catch(() => {});
    }
    setCode("");
    setError("");
    setNotice("A new code has been sent to your email.");
  };

  // ---- Admin fixed email + password ----
  const adminLogin = async () => {
    setError("");
    if (!adminEmail || !adminEmail.includes("@") || !adminPassword) {
      setError("Enter both your administrator email and password.");
      return;
    }
    setIsAdminLoggingIn(true);
    try {
      const csrfRes = await fetch(`${API_BASE}/auth/csrf`, {
        credentials: "include",
      });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.data?.csrfToken || "";

      const res = await fetch(`${API_BASE}/auth/admin-portal-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          email: adminEmail.trim().toLowerCase(),
          password: adminPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          data.error?.message ||
            "Sign-in failed. Check your email and password."
        );
        setIsAdminLoggingIn(false);
        return;
      }

      if (data.data?.bindingToken) {
        setBindingToken(data.data.bindingToken);
      }
      const user = data.data?.user;
      if (user?.name) {
        setAuthCookie("administrator", user.name, user.email || adminEmail);
      }
      sessionStorage.removeItem("campusvote_bridged");
      sessionStorage.setItem("campusvote_dest", "/admin/dashboard");
      window.location.href = "/admin/dashboard";
    } catch (err) {
      console.error("Admin login failed:", err);
      setError(
        "Unable to reach the server. Please check your connection and try again."
      );
      setIsAdminLoggingIn(false);
    }
  };

  // If we land here with an existing Clerk session on a non-admin portal, just
  // re-bridge (don't force the user through a new code round-trip).
  useEffect(() => {
    if (!authLoaded || isAdminFlow) return;
    // A just-completed sign-out must never be bounced straight back into a
    // portal — show the clean login form instead.
    const signedOut = window.sessionStorage.getItem("campusvote_signed_out") === "1";
    window.sessionStorage.removeItem("campusvote_signed_out");
    if (signedOut) return;
    if (isSignedIn) {
      setRoleFlags();
      goToCallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, isSignedIn, isAdminFlow]);

  // ---- Password login (registered accounts) ----
  const passwordLogin = async () => {
    setError("");
    if (!email || !email.includes("@") || !loginPassword) {
      setError("Enter your email and password to sign in.");
      return;
    }
    setIsPasswordLoggingIn(true);
    try {
      const csrfRes = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.data?.csrfToken || "";

      // No role hint: the backend uses the account's DB role and we route
      // to the matching dashboard (same behavior as the main portal).
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          userIdentifier: email.trim().toLowerCase(),
          password: loginPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.error?.code === "ACCOUNT_NOT_FOUND") {
          setError("No account exists with this email. Create one from the Register page.");
        } else if (res.status === 401) {
          setError("Incorrect email or password. Try again or reset your password.");
        } else {
          setError(data.error?.message || "Sign-in failed. Please try again.");
        }
        setIsPasswordLoggingIn(false);
        return;
      }

      if (data.data?.bindingToken) {
        setBindingToken(data.data.bindingToken);
      }
      const user = data.data?.user;
      if (user?.name) {
        setAuthCookie("student", user.name, user.email || email);
      }

      // Route by the DATABASE role — server-side truth.
      const dbRole = String(user?.role || "").toUpperCase();
      const dashboards: Record<string, string> = {
        STUDENT: "/student/dashboard",
        CANDIDATE: "/candidate/dashboard",
        ADMIN: "/admin/dashboard",
        CAD: "/cad/dashboard",
      };
      sessionStorage.removeItem("campusvote_bridged");
      sessionStorage.setItem("campusvote_dest", dashboards[dbRole] || "/student/dashboard");
      window.location.href = dashboards[dbRole] || "/student/dashboard";
    } catch (err) {
      console.error("Password login failed:", err);
      setError("Unable to reach the server. Please check your connection and try again.");
      setIsPasswordLoggingIn(false);
    }
  };

  const roleKey = isAdminFlow ? "administrator" : selectedRole;

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center mb-6">            <AuthHeader
              title={
                portal === "admin"
                  ? "Admin Portal"
                  : portal === "cad"
                    ? "CAD Portal"
                    : portal === "student"
                      ? "Student Portal"
                      : "Sign In"
              }
              subtitle={
                isAdminFlow
                  ? "Administrator sign in with your institute email and password"
                  : loginMethod === "password"
                    ? "Sign in with your email and password"
                    : "Enter your email and we will send you a one-time code"
              }
            />
        </div>

        {notice && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm break-words">
            {notice}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm break-words">
            {error}
          </div>
        )}

        {isAdminFlow ? (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 text-center">
              Signing in as <strong>Administrator</strong>
            </div>

            <Input
              id="admin-email"
              label="Administrator email"
              type="email"
              autoComplete="username"
              placeholder="admin@example.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
            <Input
              id="admin-password"
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") adminLogin();
              }}
            />

            <Button
              onClick={adminLogin}
              disabled={isAdminLoggingIn}
              isLoading={isAdminLoggingIn}
              className="w-full"
            >
              {!isAdminLoggingIn && (
                <>
                  <KeyRound className="w-4 h-4" />
                  Sign in to Admin
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {portal === "any" && selectedRole !== "cad" ? (
              <RoleSelector
                selectedRole={selectedRole}
                onSelect={(role) => {
                  setSelectedRole(role);
                  setError("");
                  setNotice("");
                }}
              />
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 text-center">
                Signing in as <strong>{ROLE_LABEL[roleKey] || selectedRole}</strong>
              </div>
            )}

            {stage === "email" ? (
              loginMethod === "password" ? (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="login-email"
                      className="text-xs font-medium text-text-secondary"
                    >
                      Email address
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full min-w-0 px-4 py-2.5 text-sm bg-white dark:bg-[#252540] border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <Input
                    id="login-password"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") passwordLogin();
                    }}
                  />
                  <Button
                    onClick={passwordLogin}
                    disabled={isPasswordLoggingIn}
                    isLoading={isPasswordLoggingIn}
                    className="w-full"
                  >
                    {!isPasswordLoggingIn && (
                      <>
                        <KeyRound className="w-4 h-4" />
                        Sign in
                      </>
                    )}
                  </Button>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-text-secondary">
                    <a
                      href="/forgot-password"
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Forgot password?
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod("code");
                        setError("");
                        setNotice("");
                      }}
                      className="text-text-muted hover:text-text-secondary font-medium"
                    >
                      Sign in with a code instead
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email-code-email"
                      className="text-xs font-medium text-text-secondary"
                    >
                      Email address
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        id="email-code-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") sendEmailCode();
                        }}
                        className="flex-1 min-w-0 px-4 py-2.5 text-sm bg-white dark:bg-[#252540] border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <Button
                        onClick={sendEmailCode}
                        disabled={isSending}
                        isLoading={isSending}
                        className="w-full sm:w-auto shrink-0"
                      >
                        {!isSending && "Send code"}
                      </Button>
                    </div>
                  </div>
                  <div className="text-center text-xs text-text-secondary">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod("password");
                        setError("");
                        setNotice("");
                      }}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Sign in with a password instead
                    </button>
                  </div>
                  {/* Clerk renders its invisible bot-protection CAPTCHA here
                      when creating brand-new accounts. */}
                  <div id="clerk-captcha" />
                </>
              )
            ) : (
              <>
                <div className="p-3 bg-primary-50 border border-primary-100 rounded-lg text-sm text-primary-800 flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    We sent a one-time code to{" "}
                    <strong>{email}</strong>. Enter it below to continue.
                  </span>
                </div>
                <Input
                  id="email-code-input"
                  label="One-time code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") verifyEmailCode();
                  }}
                />
                <Button
                  onClick={verifyEmailCode}
                  disabled={isVerifying}
                  isLoading={isVerifying}
                  className="w-full"
                >
                  {!isVerifying && "Verify & Sign In"}
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
                      setFlow(null);
                      setError("");
                      setNotice("");
                    }}
                    className="text-text-muted hover:text-text-secondary font-medium"
                  >
                    Use a different email
                  </button>
                </div>
              </>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-text-secondary pt-1">
              <a
                href="/register"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                New here? Register as a candidate
              </a>
              <a
                href="/email-recovery"
                className="hover:text-primary-600 transition-colors"
              >
                Can&apos;t access your registered email?
              </a>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border text-xs text-text-secondary text-center flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 leading-relaxed px-1">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isAdminFlow
              ? "Admin sign-in is protected — only listed administrators can access this portal"
              : "Secured by Clerk — passwords and codes are verified server-side and never shared with CampusVote"}
          </span>
          <HelpCircle className="w-3 h-3 opacity-50 shrink-0" />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
