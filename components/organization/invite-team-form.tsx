"use client";

import { FormEvent, useState } from "react";
import { useInvitePeopleMutation } from "@/features/organization/organization-api";
import type { UserRole } from "@/lib/auth/types";

const roles: { value: UserRole; label: string }[] = [
  { value: "PROCUREMENT_OFFICER", label: "Procurement officer" },
  { value: "MANAGER", label: "Manager" },
  { value: "TEAM_LEADER", label: "Team leader" },
  { value: "FINANCE_OFFICER", label: "Finance officer" },
  { value: "ADMIN", label: "Administrator" },
];

export function InviteTeamForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("PROCUREMENT_OFFICER");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [invitePeople, { isLoading }] = useInvitePeopleMutation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setMessage(undefined);
    setError(undefined);

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    try {
      const response = await invitePeople([{ email: normalizedEmail, role }]).unwrap();
      setEmail("");
      setMessage(response.message || "Invitation sent successfully.");
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="max-w-xl">
        <p className="text-sm font-semibold text-[#168778]">TEAM ACCESS</p>
        <h2 className="mt-2 text-xl font-semibold">Invite a teammate</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">They’ll receive an email with a secure link that expires after 72 hours.</p>
      </div>
      <form className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_190px_auto] sm:items-end" onSubmit={handleSubmit} noValidate>
        <label className="block text-sm font-medium text-slate-700" htmlFor="invite-email">
          Email address
          <input className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-[#17212b] outline-none transition focus:border-[#168778] focus:ring-4 focus:ring-[#168778]/10" id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@company.com" autoComplete="email" required disabled={isLoading} />
        </label>
        <label className="block text-sm font-medium text-slate-700" htmlFor="invite-role">
          Role
          <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[#17212b] outline-none transition focus:border-[#168778] focus:ring-4 focus:ring-[#168778]/10" id="invite-role" value={role} onChange={(event) => setRole(event.target.value as UserRole)} disabled={isLoading}>
            {roles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <button className="rounded-xl bg-[#168778] px-5 py-3 font-semibold text-white transition hover:bg-[#116b60] focus:outline-none focus:ring-4 focus:ring-[#168778]/20 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isLoading}>{isLoading ? "Sending…" : "Send invite"}</button>
      </form>
      {message && <p className="mt-4 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800" role="status">{message}</p>}
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700" role="alert">{error}</p>}
    </section>
  );
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: { message?: string | string[] } }).data;
    if (Array.isArray(data?.message)) return data.message[0];
    if (data?.message) return data.message;
  }
  return "We couldn’t send the invitation. Please try again.";
}
