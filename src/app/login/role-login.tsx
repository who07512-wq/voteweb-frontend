"use client";

import React, { useEffect, useState } from "react";
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

export function RoleLoginPage({
  portal,
  initialRole,
}: {
  portal: "any" | "student" | "cad" | "admin";
  initialRole?: UserRole;
}) {
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
  const [flow, setFlow] = useState<"signin" | "signup" | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
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

  const [signInMethod, setSignInMethod] = useState<"code" | "password">("code");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const flagged = sessionStorage.getItem("campusvote_role_mismatch");
    if (flagged) {
      setNotice("");
      setError(
        "This account is not authorized for this portal. Sign in from the correct portal for your role."
      );
      sessionStorage.removeItem("campusvote_role_mismatch");
    }
  }, []);

  const setRoleFlags = () => {
    const roleKey = selectedRole;
    sessionStorage.setItem("campusvote_login_role", roleKey);
    sessionStorage.removeItem("campusvote_bridged");
    sessionStorage.removeItem("campusvote_dest");
  };

  const goToCallback = () => {
    window.location.href = `${window.location.origin}/auth/clerk-callback`;
  };

  const csrfFetch = async (url: string, opts: RequestInit = {}) => {
    const csrfRes = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
    const csrfData = await csrfRes.json().catch(() => ({}));
    const csrfToken = csrfData.data?.csrfToken || "";
    return fetch(url, {
      ...opts,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        ...(opts.headers as Record<string, string> || {}),
      },
    });
  };

  const sendEmailCode = async () => {
    setError("");
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address to continue.");
      return;
    }
    setIsSending(true);
    try {
      setRoleFlags();
      const normalized = email.trim().toLowerCase();
      const backendRole = (selectedRole === "administrator" ? "STUDENT" : selectedRole.toUpperCase());

      const res = await csrfFetch(`${API_BASE}/auth/otp/send-login`, {
        method: "POST",
        body: JSON.stringify({ email: normalized, role: backendRole }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        console.error("OTP send failed:", data.error || res.status);
        setError(data.error?.message || "We couldn't send the code. Please try again.");
        setIsSending(false);
        return;
      }

      setChallengeId(data.data?.challengeId || null);
      setFlow("signin");
      setStage("code");
      setIsSending(false);
    } catch (err) {
      console.error("sendEmailCode threw:", err);
      setError("We couldn't send the code. Please check your connection and try again.");
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
      const normalized = email.trim().toLowerCase();
      const backendRole = (selectedRole === "administrator" ? "STUDENT" : selectedRole.toUpperCase());

      const res = await csrfFetch(`${API_BASE}/auth/otp/verify-login`, {
        method: "POST",
        body: JSON.stringify({ email: normalized, otp: trimmed, role: backendRole }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        console.error("OTP verify failed:", data.error || res.status);
        const msg = data.error?.message || "Invalid or expired code. Please try again.";
        setError(msg);
        setIsVerifying(false);
        return;
      }

      const result = data.data;

      if (result.needsRegistration) {
        sessionStorage.setItem("campusvote_pending_email", normalized);
        sessionStorage.setItem("campusvote_pending_role", backendRole);
        window.location.href = "/register?from=login";
        return;
      }

      if (result.authenticated) {
        if (result.bindingToken) setBindingToken(result.bindingToken);
        if (result.user) setAuthCookie(result.user.role || backendRole, result.user.name || "", result.user.email || normalized);
        goToCallback();
        return;
      }

      setError("Something unexpected happened. Please try again.");
      setIsVerifying(false);
    } catch (err) {
      console.error("verifyEmailCode threw:", err);
      setError("Something went wrong verifying the code. Please try again.");
      setIsVerifying(false);
    }
  };

  const resendCode = () => {
    setCode("");
    setError("");
    sendEmailCode();
  };

  const passwordLogin = async () => {
    setError("");
    if (!email || !email.includes("@") || !password) {
      setError("Enter both your email and password.");
      return;
    }
    setIsSending(true);
    try {
      const normalized = email.trim().toLowerCase();
      const csrfRes = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
      const csrfData = await csrfRes.json().catch(() => ({}));
      const csrfToken = csrfData.data?.csrfToken || "";

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email: normalized, password, role: selectedRole.toUpperCase() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        setError(data.error?.message || "Incorrect email or password.");
        setIsSending(false);
        return;
      }

      if (data.data?.bindingToken) setBindingToken(data.data.bindingToken);
      if (data.data?.user) setAuthCookie(data.data.user.role || selectedRole, data.data.user.name || "", data.data.user.email || normalized);
      goToCallback();
    } catch (err) {
      console.error("passwordLogin threw:", err);
      setError("Unable to reach the server. Please check your connection and try again.");
      setIsSending(false);
    }
  };

  const switchMethod = (method: "code" | "password") => {
    setSignInMethod(method);
    setError("");
    setNotice("");
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
                : "Enter your email and sign in with a one-time code or your password"
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
                <>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-[#1d1d38] rounded-xl">
                    <button
                      type="button"
                      onClick={() => switchMethod("code")}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        signInMethod === "code"
                          ? "bg-white dark:bg-[#252540] shadow-sm text-text-primary"
                          : "text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      One-time code
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMethod("password")}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        signInMethod === "password"
                          ? "bg-white dark:bg-[#252540] shadow-sm text-text-primary"
                          : "text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      Password
                    </button>
                  </div>

                  {signInMethod === "code" ? (
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
                  ) : (
                    <div className="space-y-3">
                      <Input
                        id="password-email"
                        label="Email address"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Input
                        id="password-input"
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") passwordLogin();
                        }}
                      />
                      <Button
                        onClick={passwordLogin}
                        disabled={isSending}
                        isLoading={isSending}
                        className="w-full"
                      >
                        {!isSending && (
                          <>
                            <KeyRound className="w-4 h-4" />
                            Sign in with password
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
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
              : "Secured — passwords and codes are verified server-side"}
          </span>
          <HelpCircle className="w-3 h-3 opacity-50 shrink-0" />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
