"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLogoutMutation, useProfileQuery } from "@/features/auth/auth-api";
import { InviteTeamForm } from "@/components/organization/invite-team-form";
import { CreateRequestForm } from "@/components/purchase-requests/create-request-form";
import { PurchaseRequestProgressTable } from "@/components/purchase-requests/purchaseRequestProgressTable";
import { QuoteCollectionList } from "@/components/purchase-requests/quote-collection-list";
import { QuoteAnalysisPanel } from "@/components/purchase-requests/quote-analysis-panel";
import { VendorQuoteForm } from "@/components/quotes/vendor-quote-form";
import { VendorQuoteRequests } from "@/components/quotes/vendor-quote-requests";
import { VendorQuotes } from "@/components/quotes/vendor-quotes";
import { OrganizationMembers } from "@/components/users/organization-members";

/* ─── Types ─── */
type Role = string;

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

/* ─── Tab config per role ─── */
function getTabsForRole(role: Role): Tab[] {
  const tabs: Tab[] = [
    {
      id: "request-progress",
      label: "Request Progress",
      icon: <RequestIcon />,
    },
  ];

  if (role === "TEAM_LEADER") {
    tabs.push({
      id: "create-request",
      label: "New Request",
      icon: <RequestIcon />,
    });
  }
  if (role === "PROCUREMENT_OFFICER") {
    tabs.push({
      id: "quote-collection",
      label: "Quote Collection",
      icon: <QuoteIcon />,
    });
    tabs.push({
      id: "quote-analysis",
      label: "Quote Analysis",
      icon: <AnalysisIcon />,
    });
    tabs.push({ id: "invite-team", label: "Invite Team", icon: <PlusIcon /> });
  }
  if (role === "VENDOR") {
    tabs.push({
      id: "quote-submission",
      label: "Submit Quote",
      icon: <QuoteIcon />,
    });
    tabs.push({
      id: "quote-requests",
      label: "Quote Requests",
      icon: <RequestIcon />,
    });
    tabs.push({
      id: "vendor-quotes",
      label: "My Quotes",
      icon: <AnalysisIcon />,
    });
  }
  if (role === "ADMIN") {
    tabs.push({ id: "invite-team", label: "Invite Team", icon: <PlusIcon /> });
  }

  tabs.push({ id: "organization", label: "Organization", icon: <UsersIcon /> });
  return tabs;
}

/* ─── Tab panel content ─── */
function TabPanel({
  tabId,
  role,
  userId,
  organizationId,
}: {
  tabId: string;
  role: Role;
  userId: string;
  organizationId: string;
}) {
  switch (tabId) {
    case "request-progress":
      return <PurchaseRequestProgressTable organizationId={organizationId} role={role} />;
    case "create-request":
      return <CreateRequestForm />;
    case "quote-collection":
      return <QuoteCollectionList organizationId={organizationId} />;
    case "quote-analysis":
      return <QuoteAnalysisPanel organizationId={organizationId} />;
    case "quote-submission":
      return <VendorQuoteForm userId={userId} />;
    case "quote-requests":
      return <VendorQuoteRequests />;
    case "vendor-quotes":
      return <VendorQuotes />;
    case "invite-team":
      return <InviteTeamForm />;
    case "organization":
      return <OrganizationMembers canEdit={role === "ADMIN"} />;
    default:
      return null;
  }
}

/* ─── Main page ─── */
export default function Home() {
  const router = useRouter();
  const { data: user, error, isLoading } = useProfileQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const unauthenticated = isUnauthorized(error);

  useEffect(() => {
    if (unauthenticated) router.replace("/login");
  }, [router, unauthenticated]);

  // Set default tab once user loads
  useEffect(() => {
    if (user && activeTab === null) {
      const tabs = getTabsForRole(user.role);
      if (tabs.length > 0) setActiveTab(tabs[0].id);
    }
  }, [user, activeTab]);

  async function handleLogout() {
    try {
      await logout().unwrap();
    } finally {
      router.replace("/login");
    }
  }

  if (isLoading || unauthenticated) return <LoadingScreen />;
  if (error || !user)
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8fa] p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">
            We couldn&apos;t load your workspace
          </h1>
          <p className="mt-2 text-slate-500">
            Check your connection and refresh the page.
          </p>
          <button
            className="mt-5 rounded-lg bg-[#168778] px-4 py-2 text-sm font-semibold text-white"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </main>
    );

  const tabs = getTabsForRole(user.role);
  const currentTab = activeTab ?? tabs[0]?.id ?? null;

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#17212b]">
      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#168778] text-base font-bold text-white shadow-sm">
              P
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">
              ProcureAI
            </span>
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-medium text-slate-800 leading-tight">
                {user.email}
              </span>
              <span className="text-xs text-[#168778] font-medium leading-tight mt-0.5">
                {formatRole(user.role)}
              </span>
            </div>
            {/* Avatar */}
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e9f5f2] text-sm font-semibold text-[#12786c] select-none">
              {user.name
                .split(/\s+/)
                .slice(0, 2)
                .map((p: string) => p[0])
                .join("")
                .toUpperCase()}
            </span>
            <button
              id="logout-btn"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              <LogoutIcon />
              <span className="hidden sm:inline">
                {isLoggingOut ? "Signing out…" : "Logout"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Greeting Section ── */}
        <section className="pt-8 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#168778]">
            Your Workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Good to see you, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Your procurement workspace and next steps — all in one place.
          </p>
        </section>

        {/* ── Tab Bar ── */}
        {tabs.length > 0 && (
          <div className="border-b border-slate-200">
            <nav
              id="workspace-tabs"
              aria-label="Workspace tabs"
              className="-mb-px flex gap-1 overflow-x-auto"
            >
              {tabs.map((tab) => {
                const isActive = tab.id === currentTab;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      "inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none",
                      isActive
                        ? "border-[#168778] text-[#12786c]"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
                    ].join(" ")}
                  >
                    <span
                      className={isActive ? "text-[#168778]" : "text-slate-400"}
                    >
                      {tab.icon}
                    </span>
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* ── Tab Panel ── */}
        <div className="py-7">
          {currentTab ? (
            <TabPanel
              tabId={currentTab}
              role={user.role}
              userId={user.id}
              organizationId={user.organizationId}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold text-slate-800">
                Workspace ready
              </h2>
              <p className="mt-2 max-w-md mx-auto text-sm leading-6 text-slate-500">
                Your account is connected. Workspace updates and procurement
                workflows will appear here as they become available to your
                role.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── Helpers ─── */
function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fa]">
      <div className="flex items-center gap-3 text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#168778] border-t-transparent" />
        Loading workspace…
      </div>
    </main>
  );
}

function isUnauthorized(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 401
  );
}

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/* ─── Icons ─── */
function RequestIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M8 4h8a2 2 0 0 1 2 2v14H6V6a2 2 0 0 1 2-2Z" />
      <path d="M9 4.5h6M9 10h6M9 14h6M9 18h3" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}
function QuoteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="m12 3-9 5 9 5 9-5-9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </svg>
  );
}
function AnalysisIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M3 3v18h18" />
      <path d="m7 16 4-4 4 4 4-6" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
