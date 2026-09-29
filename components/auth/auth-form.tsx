"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  useLoginMutation,
  useRegisterInvitedMutation,
  useRegisterMutation,
} from "@/features/auth/auth-api";
import { Logo } from "@/components/ui/logo";

type Mode = "login" | "register" | "invite";

const copy = {
  login: {
    eyebrow: "Welcome back",
    title: "Sign in to ProcureAI",
    subtitle: "Manage purchasing decisions with clarity and confidence.",
    submit: "Sign in",
  },
  register: {
    eyebrow: "Get started",
    title: "Create your workspace",
    subtitle: "Set up your organization and bring procurement into one place.",
    submit: "Create workspace",
  },
  invite: {
    eyebrow: "You’re invited",
    title: "Join your team",
    subtitle: "Finish your profile to access your organization’s workspace.",
    submit: "Accept invitation",
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [login, loginState] = useLoginMutation();
  const [register, registerState] = useRegisterMutation();
  const [registerInvited, invitationState] = useRegisterInvitedMutation();
  const [error, setError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);
  const content = copy[mode];
  const pending =
    loginState.isLoading ||
    registerState.isLoading ||
    invitationState.isLoading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(data.get("password") ?? "");
    const organizationName = String(data.get("organizationName") ?? "").trim();

    if (!email || !/^\S+@\S+\.\S+$/.test(email))
      return setError("Enter a valid email address.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters long.");
    if (mode !== "login" && name.length < 2)
      return setError("Enter your full name.");
    if (mode === "register" && organizationName.length < 2)
      return setError("Enter your organization name.");

    try {
      if (mode === "login") await login({ email, password }).unwrap();
      if (mode === "register")
        await register({ name, email, password, organizationName }).unwrap();
      if (mode === "invite") {
        const token = searchParams.get("token");
        if (!token)
          return setError(
            "This invitation link is incomplete. Ask your administrator for a new link.",
          );
        await registerInvited({
          token,
          body: { name, email, password },
        }).unwrap();
      }
      router.replace("/");
      router.refresh();
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  const imageSrc =
    mode === "login"
      ? "/manager-analyzing-financial-growth-report-with-coworker.jpg"
      : "/working-together-report.jpg";

  return (
    <main className="min-h-screen bg-white sm:grid sm:grid-cols-2">
      <aside className="relative hidden overflow-hidden sm:block">
        <img
          src={imageSrc}
          alt="ProcureAI Team"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#152d3d]/90 via-[#152d3d]/40 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo light />
          <div>
            <p className="mb-5 text-sm font-medium tracking-[0.18em] text-[#8ee1d3] uppercase drop-shadow-md">
              Procurement, simplified
            </p>
            <h2 className="max-w-sm text-4xl font-semibold leading-tight drop-shadow-md">
              Decisions that move work forward.
            </h2>
            <p className="mt-5 max-w-sm leading-7 text-slate-200 drop-shadow-md">
              Bring requests, quotes, approvals, and vendors together in one
              thoughtful workflow.
            </p>
          </div>
        </div>
      </aside>
      <div className="flex flex-col justify-center px-6 py-10 sm:px-14 xl:px-24">
        <div className="mb-12 sm:hidden">
          <Logo />
        </div>
        <p className="text-sm font-semibold tracking-wide text-[#168778]">
          {content.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17212b]">
          {content.title}
        </h1>
        <p className="mt-3 max-w-md leading-6 text-slate-500">
          {content.subtitle}
        </p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          {mode !== "login" && (
            <Field
              label="Full name"
              name="name"
              autoComplete="name"
              placeholder="Alex Morgan"
            />
          )}
          {mode === "register" && (
            <Field
              label="Organization name"
              name="organizationName"
              autoComplete="organization"
              placeholder="Acme Inc."
            />
          )}
          <Field
            label="Work email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
          />
          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-700"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 pr-16 text-[#17212b] outline-none transition focus:border-[#168778] focus:ring-4 focus:ring-[#168778]/10"
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
              <button
                className="absolute inset-y-0 right-3 flex items-center justify-center text-slate-400 hover:text-[#168778] focus:outline-none"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          {error && (
            <p
              className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}
          <button
            className="flex w-full items-center justify-center rounded-xl bg-[#168778] px-4 py-3.5 font-semibold text-white transition hover:bg-[#116b60] focus:outline-none focus:ring-4 focus:ring-[#168778]/20 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={pending}
          >
            {pending ? "Please wait…" : content.submit}
          </button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500">
          {mode === "login" ? (
            <>
              New to ProcureAI?{" "}
              <Link
                className="font-semibold text-[#168778] hover:underline"
                href="/register"
              >
                Create a workspace
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                className="font-semibold text-[#168778] hover:underline"
                href="/login"
              >
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <div>
      <label
        className="mb-2 block text-sm font-medium text-slate-700"
        htmlFor={name}
      >
        {label}
      </label>
      <input
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[#17212b] outline-none transition focus:border-[#168778] focus:ring-4 focus:ring-[#168778]/10"
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
      />
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: { message?: string | string[] } }).data;
    if (Array.isArray(data?.message)) return data.message[0];
    if (data?.message) return data.message;
  }
  return "We couldn’t complete that request. Please try again.";
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}
