"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  useLoginMutation,
  useRegisterInvitedMutation,
  useRegisterMutation,
} from "@/features/auth/auth-api";

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

  return (
    <main className="min-h-screen bg-[#f7f8fa] p-5 sm:grid sm:place-items-center sm:p-8">
      <section className="mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_70px_rgba(22,33,45,0.12)] sm:min-h-[650px] sm:grid-cols-[.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-[#152d3d] p-12 text-white sm:block">
          <div className="absolute -right-24 -top-16 h-72 w-72 rounded-full bg-[#37b4a1]/25 blur-2xl" />
          <div className="relative flex h-full flex-col justify-between">
            <Brand light />
            <div>
              <p className="mb-5 text-sm font-medium tracking-[0.18em] text-[#8ee1d3] uppercase">
                Procurement, simplified
              </p>
              <h2 className="max-w-sm text-4xl font-semibold leading-tight">
                Decisions that move work forward.
              </h2>
              <p className="mt-5 max-w-sm leading-7 text-slate-300">
                Bring requests, quotes, approvals, and vendors together in one
                thoughtful workflow.
              </p>
            </div>
            <p className="text-sm text-slate-400">
              Built for teams that value clarity.
            </p>
          </div>
        </aside>
        <div className="flex flex-col justify-center px-6 py-10 sm:px-14">
          <div className="mb-12 sm:hidden">
            <Brand />
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
                  className="absolute inset-y-0 right-3 text-sm font-medium text-slate-500 hover:text-[#168778]"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? "Hide" : "Show"}
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
      </section>
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

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#24a891] text-lg font-bold text-white">
        P
      </span>
      <span
        className={`text-lg font-semibold tracking-tight ${light ? "text-white" : "text-[#17212b]"}`}
      >
        ProcureAI
      </span>
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
