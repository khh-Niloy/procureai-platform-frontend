"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLogoutMutation, useProfileQuery } from "@/features/auth/auth-api";
import { InviteTeamForm } from "@/components/organization/invite-team-form";
import { CreateRequestForm } from "@/components/purchase-requests/create-request-form";
import { InitialApprovalList } from "@/components/purchase-requests/initial-approval-list";
import { QuoteCollectionList } from "@/components/purchase-requests/quote-collection-list";
import { OrganizationMembers } from "@/components/users/organization-members";

export default function Home() {
  const router = useRouter();
  const { data: user, error, isLoading } = useProfileQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const unauthenticated = isUnauthorized(error);

  useEffect(() => {
    if (unauthenticated) router.replace("/login");
  }, [router, unauthenticated]);

  async function handleLogout() {
    try { await logout().unwrap(); } finally { router.replace("/login"); }
  }

  if (isLoading || unauthenticated) return <LoadingScreen />;
  if (error || !user) return <main className="grid min-h-screen place-items-center p-6"><div className="max-w-md text-center"><h1 className="text-xl font-semibold">We couldn’t load your workspace</h1><p className="mt-2 text-slate-500">Check your connection and refresh the page.</p><button className="mt-5 rounded-lg bg-[#168778] px-4 py-2 text-sm font-semibold text-white" onClick={() => window.location.reload()}>Try again</button></div></main>;

  return <main className="min-h-screen bg-[#f7f8fa] text-[#17212b]">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5"><Link className="flex items-center gap-2.5" href="/"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#24a891] text-lg font-bold text-white">P</span><span className="font-semibold tracking-tight">ProcureAI</span></Link><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-slate-500">{formatRole(user.role)}</p></div><button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60" onClick={handleLogout} disabled={isLoggingOut}>{isLoggingOut ? "Signing out…" : "Sign out"}</button></div></div></header>
    <section className="mx-auto max-w-6xl px-5 py-12"><p className="text-sm font-semibold text-[#168778]">YOUR WORKSPACE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Good to see you, {user.name.split(" ")[0]}.</h1><p className="mt-3 max-w-xl text-slate-500">Your account is connected and ready for the procurement workflows to come.</p><div className="mt-8 grid gap-4 sm:grid-cols-3"><Card label="Role" value={formatRole(user.role)} /><Card label="Account status" value={user.isActive ? "Active" : "Inactive"} /><Card label="Work email" value={user.email} /></div>{user.role === "TEAM_LEADER" && <CreateRequestForm />}{user.role === "MANAGER" && <InitialApprovalList />}{user.role === "PROCUREMENT_OFFICER" && <QuoteCollectionList />}{canInvite(user.role) && <InviteTeamForm />}<OrganizationMembers canEdit={user.role === "ADMIN"} />{!hasDashboardAction(user.role) && <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8"><h2 className="text-lg font-semibold">Workspace ready</h2><p className="mt-2 max-w-xl leading-6 text-slate-500">Authentication is active. Requests sent through RTK Query automatically include secure cookies and renew an expired access session once before retrying.</p></div>}</section>
  </main>;
}

function Card({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 font-semibold">{value}</p></div>; }
function LoadingScreen() { return <main className="grid min-h-screen place-items-center bg-[#f7f8fa]"><div className="flex items-center gap-3 text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-[#168778] border-t-transparent" />Loading workspace…</div></main>; }
function isUnauthorized(error: unknown) { return typeof error === "object" && error !== null && "status" in error && (error as { status?: number }).status === 401; }
function formatRole(role: string) { return role.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "); }
function canInvite(role: string) { return role === "ADMIN" || role === "PROCUREMENT_OFFICER"; }
function hasDashboardAction(role: string) { return canInvite(role) || role === "TEAM_LEADER" || role === "MANAGER"; }
