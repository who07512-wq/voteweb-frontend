"use client";

import React, { useEffect, useState } from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";

import { HelpCircle, ShieldAlert, Mail, KeyRound } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { setBindingToken } from "@/lib/session-binding";
import { setAuthCookie } from "@/lib/mock-auth";
import { getDashboardRoute } from "@/lib/dashboard-route";
import type { UserRole } from "@/lib/auth-types";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  candidate: "Candidate",
  cad: "CAD",
  administrator: "Administrator",
};

export function RoleLoginPage({
  portal,
  initialRole,
}: {
  portal: "any" | "student" | "cad" | "admin";
  initialRole?: UserRole;
}) {
  const { signIn } = useSignIn();
  const { getToken, isSignedIn } = useAuth();

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

  const isAdminFlow = portal === "admin" || selectedRole === "administrator";

  const [stage, setStage] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [notice, setNotice] = useState(
    portal === "admin"
      ? "Administrator access only — only listed administrator emails can sign in."
      : portal === "cad"
        ? "Election monitor portal — anyone with an email address can sign in with a one-time code."
        : ""
  );
  const [error, setError] = useState("");

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  useEffect(() => {
    const flagged = sessionStorage.getItem("campusvote_role_mismatch");
    if (flagged) {
      setNotice("");
      setError("This account is not authorized for this portal. Sign in from the correct portal for your role.");
      sessionStorage.removeItem("campusvote_role_mismatch");
    }
  }, []);

  // If already signed in, redirect away from login page to dashboard.
  useEffect(() => {
    if (isSignedIn) {
      const roleKey = selectedRole === "administrator" ? "ADMIN" : selectedRole.toUpperCase();
      const dest = getDashboardRoute(roleKey);
      window.location.href = dest;
    }
  }, [isSignedIn, selectedRole]);

  const setRoleFlags = () => {
    sessionStorage.setItem("campusvote_login_role", selectedRole);
    sessionStorage.removeItem("campusvote_bridged");
    sessionStorage.removeItem("campusvote_dest");
  };

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
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.data?.bindingToken) {
        setBindingToken(data.data.bindingToken);
      }
      if (res.ok && data.data?.user) {
        setAuthCookie(data.data.user.role || role, data.data.user.name || "", data.data.user.email || email);
      }
    } catch (err) {
      console.error("Backend bridge failed:", err);
    }
  };

  const isTestEmail = (e: string) => e.toLowerCase().includes("+clerk_test");

  const sendEmailCode = async () => {
    setError("");
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address to continue.");
      return;
    }
    if (!signIn) return;
    setIsSending(true);
    try {
      setRoleFlags();
      const normalized = email.trim().toLowerCase();

      // If there's a stale sign-in from a previous attempt, Clerk may
      // reject create() or sendCode() with a 400. Try to recover by
      // creating again to reset the sign-in state.
      let { error: createError } = await signIn.create({ identifier: normalized });

      if (createError) {
        // Try creating again to reset stale state.
        try {
          const retryCreate = await signIn.create({ identifier: normalized });
          if (retryCreate.error) {
            setError(retryCreate.error.longMessage || retryCreate.error.message || "Could not start sign-in. Please try again.");
            setIsSending(false);
            return;
          }
        } catch {
          setError(createError.longMessage || createError.message || "Could not start sign-in. Please try again.");
          setIsSending(false);
          return;
        }
      }

      let { error: sendError } = await signIn.emailCode.sendCode();

      // If sendCode fails (stale sign-in state), try creating again.
      if (sendError) {
        try {
          const retryCreate = await signIn.create({ identifier: normalized });
          if (!retryCreate.error) {
            const retry = await signIn.emailCode.sendCode();
            if (retry.error) {
              setError(retry.error.longMessage || retry.error.message || "Could not send verification code. Please try again.");
              setIsSending(false);
              return;
            }
          } else {
            setError(retryCreate.error.longMessage || retryCreate.error.message || "Could not send verification code. Please try again.");
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
        const { error: verifyErr } = await signIn.emailCode.verifyCode({ code: "424242" });
        if (!verifyErr && signIn.status === "complete") {
          const backendRole = selectedRole === "administrator" ? "STUDENT" : selectedRole.toUpperCase();
          await bridgeToBackend(backendRole);
          const roleKey = selectedRole === "administrator" ? "ADMIN" : selectedRole.toUpperCase();
          const dest = getDashboardRoute(roleKey);
          sessionStorage.removeItem("campusvote_bridged");
          sessionStorage.setItem("campusvote_dest", dest);
          window.location.href = dest;
          return;
        }
        // If auto-verify fails, fall through to manual code entry.
      }

      setStage("code");
      setIsSending(false);
    } catch (err) {
      console.error("sendEmailCode threw:", err);
      setError("Something went wrong. Please try again.");
      setIsSending(false);
    }
  };

  const verifyEmailCode = async () => {
    setError("");
    if (!code || code.trim().length < 4) {
      setError("Enter the code you received by email.");
      return;
    }
    if (!signIn) return;
    setIsVerifying(true);
    try {
      const { error } = await signIn.emailCode.verifyCode({ code: code.trim() });

      if (error) {
        if (error.code === "form_identifier_not_found") {
          sessionStorage.setItem("campusvote_pending_email", email.trim().toLowerCase());
          sessionStorage.setItem("campusvote_pending_role", selectedRole);
          window.location.href = "/register?from=login";
          return;
        }
        setError(error.longMessage || error.message || "Invalid or expired code. Please try again.");
        setIsVerifying(false);
        return;
      }

      // Email code verified — proceed regardless of signIn.status.
      // Clerk may report an intermediate status due to bot protection
      // or missing fields; the code itself is verified, so continue.
      const backendRole = selectedRole === "administrator" ? "STUDENT" : selectedRole.toUpperCase();
      await bridgeToBackend(backendRole);

      const roleKey = selectedRole === "administrator" ? "ADMIN" : selectedRole.toUpperCase();
      const dest = getDashboardRoute(roleKey);

      sessionStorage.removeItem("campusvote_bridged");
      sessionStorage.setItem("campusvote_dest", dest);
      window.location.href = dest;
    } catch (err) {
      console.error("verifyEmailCode threw:", err);
      setError("Something went wrong. Please try again.");
      setIsVerifying(false);
    }
  };

  const resendCode = async () => {
    setCode("");
    setError("");
    if (!signIn) return;
    try {
      await signIn.emailCode.sendCode();
    } catch (err) {
      console.error("Resend failed:", err);
    }
  };

  const adminLogin = async () => {
    setError("");
    if (!adminEmail || !adminEmail.includes("@") || !adminPassword) {
      setError("Enter both your administrator email and password.");
      return;
    }
    setIsAdminLoggingIn(true);
    try {
      const csrfRes = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
      const csrfData = await csrfRes.json().catch(() => ({}));
      const csrfToken = csrfData.data?.csrfToken || "";

      const res = await fetch(`${API_BASE}/auth/admin-portal-login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          email: adminEmail.trim().toLowerCase(),
          password: adminPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setError("Incorrect email or password. Check them and try again.");
        } else if (res.status === 423) {
          setError(data.error?.message || "This account is temporarily locked. Try again later.");
        } else {
          setError(data.error?.message || "The server is having trouble right now. Please wait a moment and try again.");
        }
        setIsAdminLoggingIn(false);
        return;
      }

      if (data.data?.bindingToken) setBindingToken(data.data.bindingToken);
      const user = data.data?.user;
      if (user?.name) setAuthCookie("administrator", user.name, user.email || adminEmail);
      sessionStorage.removeItem("campusvote_bridged");
      sessionStorage.setItem("campusvote_dest", "/admin/dashboard");
      window.location.href = "/admin/dashboard";
    } catch (err) {
      console.error("Admin login failed:", err);
      setError("Unable to reach the server. Please check your connection and try again.");
      setIsAdminLoggingIn(false);
    }
  };

  const roleKey = isAdminFlow ? "administrator" : selectedRole;

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center mb-6">
          <AuthHeader
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
                : "Enter your email to receive a one-time verification code"
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
              <div className="space-y-1.5">
                <label htmlFor="email-input" className="text-xs font-medium text-text-secondary">
                  Email address
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="email-input"
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
            ) : (
              <>
                <div className="p-3 bg-primary-50 border border-primary-100 rounded-lg text-sm text-primary-800 flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    We sent a one-time code to <strong>{email}</strong>. Enter it below to continue.
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

            {!isAdminFlow && (
              <>
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
                    if (!signIn) return;
                    const { error } = await signIn.sso({
                      strategy: "oauth_google",
                      redirectUrl: `${window.location.origin}/auth/clerk-callback?redirect=/auth/clerk-callback`,
                      redirectCallbackUrl: `${window.location.origin}/auth/clerk-callback?redirect=/auth/clerk-callback`,
                    });
                    if (error) {
                      setError(error.message || "Google sign-in failed. Please try again.");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-primary bg-white dark:bg-[#252540] hover:bg-gray-50 dark:hover:bg-[#2a2a4a] transition"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Sign in with Google
                </button>
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
              : "Secured — verification codes are sent via email"}
          </span>
          <HelpCircle className="w-3 h-3 opacity-50 shrink-0" />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
