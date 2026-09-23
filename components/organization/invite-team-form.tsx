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
  { value: "CFO", label: "CFO" },
  { value: "VENDOR", label: "Vendor" },
];

interface InviteDraft {
  id: number;
  email: string;
  role: UserRole;
}

export function InviteTeamForm() {
  const [invites, setInvites] = useState<InviteDraft[]>([
    { id: 0, email: "", role: "PROCUREMENT_OFFICER" },
  ]);
  const [nextId, setNextId] = useState(1);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [invitePeople, { isLoading }] = useInvitePeopleMutation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);
    setError(undefined);

    const normalizedInvites = invites.map(({ email, role }) => ({
      email: email.trim().toLowerCase(),
      role,
    }));
    if (normalizedInvites.some(({ email }) => !/^\S+@\S+\.\S+$/.test(email))) {
      setError("Enter a valid email address for each teammate.");
      return;
    }

    try {
      const response = await invitePeople(normalizedInvites).unwrap();
      setInvites([{ id: nextId, email: "", role: "PROCUREMENT_OFFICER" }]);
      setNextId((id) => id + 1);
      setMessage(response.message || "Invitation sent successfully.");
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="max-w-xl">
        <p className="text-sm font-semibold text-[#168778]">TEAM ACCESS</p>
        <h2 className="mt-2 text-xl font-semibold">Invite teammates</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Each person will receive an email with a secure link that expires after 72 hours.</p>
      </div>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        {invites.map((invite, index) => (
          <div key={invite.id} className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
            <label className="block text-sm font-medium text-slate-700" htmlFor={`invite-email-${invite.id}`}>
              Email address
              <input className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-[#17212b] outline-none transition focus:border-[#168778] focus:ring-4 focus:ring-[#168778]/10" id={`invite-email-${invite.id}`} type="email" value={invite.email} onChange={(event) => updateInvite(invite.id, { email: event.target.value })} placeholder="teammate@company.com" autoComplete="email" required disabled={isLoading} />
            </label>
            <label className="block text-sm font-medium text-slate-700" htmlFor={`invite-role-${invite.id}`}>
              Role
              <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[#17212b] outline-none transition focus:border-[#168778] focus:ring-4 focus:ring-[#168778]/10" id={`invite-role-${invite.id}`} value={invite.role} onChange={(event) => updateInvite(invite.id, { role: event.target.value as UserRole })} disabled={isLoading}>
                {roles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            {invites.length > 1 && <button type="button" className="rounded-xl px-3 py-3 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-700" disabled={isLoading} onClick={() => setInvites((current) => current.filter(({ id }) => id !== invite.id))} aria-label={`Remove invite ${index + 1}`}>Remove</button>}
          </div>
        ))}
        <div className="flex flex-wrap gap-3">
          <button type="button" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60" disabled={isLoading} onClick={() => { setInvites((current) => [...current, { id: nextId, email: "", role: "PROCUREMENT_OFFICER" }]); setNextId((id) => id + 1); }}>Add another person</button>
          <button className="rounded-xl bg-[#168778] px-5 py-3 font-semibold text-white transition hover:bg-[#116b60] focus:outline-none focus:ring-4 focus:ring-[#168778]/20 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isLoading}>{isLoading ? "Sending…" : `Send ${invites.length === 1 ? "invite" : `${invites.length} invites`}`}</button>
        </div>
      </form>
      {message && <p className="mt-4 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800" role="status">{message}</p>}
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700" role="alert">{error}</p>}
    </section>
  );

  function updateInvite(id: number, updates: Partial<InviteDraft>) {
    setInvites((current) => current.map((invite) => invite.id === id ? { ...invite, ...updates } : invite));
  }
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: { message?: string | string[] } }).data;
    if (Array.isArray(data?.message)) return data.message[0];
    if (data?.message) return data.message;
  }
  return "We couldn’t send the invitation. Please try again.";
}
