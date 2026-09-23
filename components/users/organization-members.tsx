"use client";

import { FormEvent, useState } from "react";
import type { UserRole } from "@/lib/auth/types";
import {
  useLazyUserByIdQuery,
  useUpdateUserMutation,
} from "@/features/users/user-api";
import type { UpdateUserInput } from "@/features/users/user-api";
import { useOrganizationUsersQuery } from "@/features/organization/organization-api";

const roles: UserRole[] = [
  "ADMIN",
  "MANAGER",
  "TEAM_LEADER",
  "PROCUREMENT_OFFICER",
  "FINANCE_OFFICER",
  "CFO",
  "VENDOR",
];

export function OrganizationMembers({ canEdit }: { canEdit: boolean }) {
  const [loadedId, setLoadedId] = useState("");
  const [notice, setNotice] = useState("");
  const membersState = useOrganizationUsersQuery();
  const [lookupUser, userState] = useLazyUserByIdQuery();
  const [updateUser, updateState] = useUpdateUserMutation();

  async function handleEdit(id: string) {
    setNotice("");
    setLoadedId(id);
    try {
      const user = await lookupUser(id).unwrap();
      setLoadedId(user.id);
    } catch {
      setNotice("Could not load this user. Please try again.");
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: UpdateUserInput = {
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim().toLowerCase(),
      role: String(form.get("role") ?? "") as UserRole,
      isActive: form.get("isActive") === "on",
    };
    const password = String(form.get("password") ?? "");
    if (password) body.password = password;
    try {
      const user = await updateUser({ id: loadedId, body }).unwrap();
      setNotice(`Updated ${user.name}.`);
      setLoadedId(user.id);
    } catch (error) {
      setNotice(getErrorMessage(error));
    }
  }

  const user = userState.data;

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="mb-5">
        <p className="text-sm font-semibold text-[#168778]">ADMINISTRATION</p>
        <h2 className="mt-1 text-xl font-semibold">Organization members</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Review your organization’s members and edit their account details.
        </p>
      </div>
      {membersState.isLoading && <p className="text-sm text-slate-500">Loading members…</p>}
      {membersState.isError && <p className="text-sm text-red-700" role="alert">Could not load organization members. Refresh the page to try again.</p>}
      {membersState.data && membersState.data.length === 0 && <p className="text-sm text-slate-500">No members found in this organization.</p>}
      {membersState.data && membersState.data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 font-semibold">Member</th><th className="px-4 py-3 font-semibold">Role</th><th className="px-4 py-3 font-semibold">Status</th>{canEdit && <th className="px-4 py-3"><span className="sr-only">Actions</span></th>}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {membersState.data.map((member) => <tr key={member.id} className="bg-white">
                <td className="px-4 py-3"><p className="font-medium text-slate-800">{member.name}</p><p className="mt-0.5 text-slate-500">{member.email}</p></td>
                <td className="px-4 py-3 text-slate-600">{formatRole(member.role)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${member.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{member.isActive ? "Active" : "Inactive"}</span></td>
                {canEdit && <td className="px-4 py-3 text-right"><button type="button" disabled={userState.isFetching} onClick={() => handleEdit(member.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-[#168778] hover:text-[#168778] disabled:opacity-60">{userState.isFetching && loadedId === member.id ? "Loading…" : "Edit"}</button></td>}
              </tr>)}
            </tbody>
          </table>
        </div>
      )}
      {notice && <p className="mt-4 text-sm text-slate-600" role="status">{notice}</p>}
      {canEdit && user && loadedId === user.id && (
        <form key={`${user.id}-${user.updatedAt}`} className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2" onSubmit={handleUpdate}>
          <Field label="Full name" name="name" defaultValue={user.name} />
          <Field label="Email" name="email" type="email" defaultValue={user.email} />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="user-role">Role</label>
            <select id="user-role" name="role" defaultValue={user.role} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3">
              {roles.map((role) => <option key={role} value={role}>{formatRole(role)}</option>)}
            </select>
          </div>
          <Field label="Set a new password (optional)" name="password" type="password" minLength={6} />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <input type="checkbox" name="isActive" defaultChecked={user.isActive} className="h-4 w-4 accent-[#168778]" /> Account is active
          </label>
          <div className="sm:col-span-2">
            <button disabled={updateState.isLoading} className="rounded-xl bg-[#168778] px-5 py-3 font-semibold text-white disabled:opacity-60">{updateState.isLoading ? "Saving…" : "Save user changes"}</button>
          </div>
        </form>
      )}
    </section>
  );
}

function Field({ label, name, type = "text", defaultValue, minLength }: { label: string; name: string; type?: string; defaultValue?: string; minLength?: number }) {
  return <div>
    <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={`admin-${name}`}>{label}</label>
    <input id={`admin-${name}`} name={name} type={type} defaultValue={defaultValue} minLength={minLength} required={name !== "password"} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 outline-none focus:border-[#168778]" />
  </div>;
}

function formatRole(role: string) {
  return role.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const message = (error as { data?: { message?: string | string[] } }).data?.message;
    if (Array.isArray(message)) return message[0];
    if (message) return message;
  }
  return "Could not save changes. Check the information and try again.";
}
