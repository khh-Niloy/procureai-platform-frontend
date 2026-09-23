"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLogoutMutation, useProfileQuery } from "@/features/auth/auth-api";
import { InviteTeamForm } from "@/components/organization/invite-team-form";
import { CreateRequestForm } from "@/components/purchase-requests/create-request-form";
import { InitialApprovalList } from "@/components/purchase-requests/initial-approval-list";
import { QuoteCollectionList } from "@/components/purchase-requests/quote-collection-list";
import { QuoteAnalysisPanel } from "@/components/purchase-requests/quote-analysis-panel";
import { VendorQuoteForm } from "@/components/quotes/vendor-quote-form";
import { VendorQuoteRequests } from "@/components/quotes/vendor-quote-requests";
import { VendorQuotes } from "@/components/quotes/vendor-quotes";
import { OrganizationMembers } from "@/components/users/organization-members";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";

export default function Home() {
  const router = useRouter();
  const { data: user, error, isLoading } = useProfileQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const unauthenticated = isUnauthorized(error);

  useEffect(() => {
    if (unauthenticated) router.replace("/login");
  }, [router, unauthenticated]);

  async function handleLogout() {
    try {
      await logout().unwrap();
    } finally {
      router.replace("/login");
    }
  }

  if (isLoading || unauthenticated) return <LoadingScreen />;
  if (error || !user) return <main className="grid min-h-screen place-items-center bg-[#f7f8fa] p-6"><div className="max-w-md text-center"><h1 className="text-xl font-semibold">We couldn’t load your workspace</h1><p className="mt-2 text-slate-500">Check your connection and refresh the page.</p><button className="mt-5 rounded-lg bg-[#168778] px-4 py-2 text-sm font-semibold text-white" onClick={() => window.location.reload()}>Try again</button></div></main>;

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#17212b] lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      <WorkspaceSidebar user={user} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
      <div className="min-w-0">
        <header className="hidden h-16 items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
          <p className="text-sm font-medium text-slate-500">Workspace / <span className="text-slate-800">Overview</span></p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </header>
        <main id="overview" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold tracking-wide text-[#168778]">YOUR WORKSPACE</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Good to see you, {user.name.split(" ")[0]}.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Your procurement workspace, team, and next steps in one place.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Account {user.isActive ? "active" : "inactive"}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card label="Your role" value={formatRole(user.role)} detail="Workspace access level" />
            <Card label="Work email" value={user.email} detail="Signed in account" />
          </div>

          {user.role === "TEAM_LEADER" && <CreateRequestForm />}
          {user.role === "MANAGER" && <InitialApprovalList />}
          {user.role === "PROCUREMENT_OFFICER" && <QuoteCollectionList />}
          {user.role === "PROCUREMENT_OFFICER" && <QuoteAnalysisPanel />}
          {user.role === "VENDOR" && <VendorQuoteForm userId={user.id} />}
          {user.role === "VENDOR" && <VendorQuoteRequests />}
          {user.role === "VENDOR" && <VendorQuotes />}
          {canInvite(user.role) && <InviteTeamForm />}
          <OrganizationMembers canEdit={user.role === "ADMIN"} />

          {!hasDashboardAction(user.role) && <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8"><h2 className="text-lg font-semibold">Workspace ready</h2><p className="mt-2 max-w-xl leading-6 text-slate-500">Your account is connected. Workspace updates and procurement workflows will appear here as they become available to your role.</p></div>}
        </main>
      </div>
    </div>
  );
}

function Card({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 truncate font-semibold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>;
}

function LoadingScreen() {
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fa]"><div className="flex items-center gap-3 text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-[#168778] border-t-transparent" />Loading workspace…</div></main>;
}

function isUnauthorized(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && (error as { status?: number }).status === 401;
}

function formatRole(role: string) {
  return role.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function canInvite(role: string) { return role === "ADMIN" || role === "PROCUREMENT_OFFICER"; }
function hasDashboardAction(role: string) { return canInvite(role) || role === "TEAM_LEADER" || role === "MANAGER" || role === "VENDOR"; }
