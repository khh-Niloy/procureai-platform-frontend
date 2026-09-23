"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@/lib/auth/types";

type Section = "overview" | "create-request" | "initial-approvals" | "quote-collection" | "quote-analysis" | "quote-submission" | "quote-requests" | "vendor-quotes" | "invite-team" | "organization-members";
type IconName = "home" | "request" | "check" | "quote" | "users" | "plus";
interface NavItem { label: string; href: Section; icon: IconName }

export function WorkspaceSidebar({ user, onLogout, isLoggingOut }: {
  user: User;
  onLogout: () => void;
  isLoggingOut: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Section>("overview");
  const items = useMemo<NavItem[]>(() => [
    { label: "Overview", href: "overview", icon: "home" },
    ...(user.role === "TEAM_LEADER" ? [{ label: "New purchase request", href: "create-request", icon: "request" } as const] : []),
    ...(user.role === "MANAGER" ? [{ label: "Initial approvals", href: "initial-approvals", icon: "check" } as const] : []),
    ...(user.role === "PROCUREMENT_OFFICER" ? [{ label: "Quote collection", href: "quote-collection", icon: "quote" } as const] : []),
    ...(user.role === "PROCUREMENT_OFFICER" ? [{ label: "Quote analysis", href: "quote-analysis", icon: "check" } as const] : []),
    ...(user.role === "VENDOR" ? [{ label: "Submit quote", href: "quote-submission", icon: "quote" } as const] : []),
    ...(user.role === "VENDOR" ? [{ label: "Quote requests", href: "quote-requests", icon: "request" } as const] : []),
    ...(user.role === "VENDOR" ? [{ label: "My quotes", href: "vendor-quotes", icon: "quote" } as const] : []),
    ...(user.role === "ADMIN" || user.role === "PROCUREMENT_OFFICER" ? [{ label: "Invite team", href: "invite-team", icon: "plus" } as const] : []),
    { label: "Organization members", href: "organization-members", icon: "users" },
  ], [user.role]);

  useEffect(() => {
    const syncHash = () => {
      const section = window.location.hash.slice(1) as Section;
      if (items.some((item) => item.href === section)) setActive(section);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [items]);

  const navigation = (mobile = false) => (
    <nav aria-label="Workspace navigation" className="space-y-1">
      <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
      {items.map((item) => (
        <Link key={item.href} href={`/#${item.href}`} onClick={() => { setActive(item.href); if (mobile) setOpen(false); }} aria-current={active === item.href ? "page" : undefined} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active === item.href ? "bg-[#e9f5f2] text-[#12786c]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
          <Icon name={item.icon} className={active === item.href ? "text-[#168778]" : "text-slate-400 group-hover:text-slate-600"} />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return <>
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
      <Brand />
      {navigation()}
      <Account user={user} onLogout={onLogout} isLoggingOut={isLoggingOut} />
    </aside>
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <Brand />
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close navigation" : "Open navigation"} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
          <span className="text-xl leading-none">{open ? "×" : "☰"}</span>
        </button>
      </div>
      {open && <>
        <button aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 top-16 z-30 bg-slate-950/20" />
        <div className="absolute inset-x-0 top-16 z-40 border-b border-slate-200 bg-white px-4 pb-4 shadow-lg">
          {navigation(true)}
          <Account user={user} onLogout={onLogout} isLoggingOut={isLoggingOut} compact />
        </div>
      </>}
    </div>
  </>;
}

function Brand() {
  return <Link href="/#overview" className="flex items-center gap-3 px-2">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#168778] text-lg font-bold text-white shadow-sm">P</span>
    <span className="text-[15px] font-semibold tracking-tight text-slate-900">ProcureAI</span>
  </Link>;
}

function Account({ user, onLogout, isLoggingOut, compact = false }: {
  user: User; onLogout: () => void; isLoggingOut: boolean; compact?: boolean;
}) {
  return <div className={compact ? "mt-4 border-t border-slate-100 pt-4" : "mt-auto border-t border-slate-200 pt-4"}>
    <div className="flex min-w-0 items-center gap-3 px-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e9f5f2] text-sm font-semibold text-[#12786c]">{user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{user.name}</p><p className="truncate text-xs text-slate-500">{formatRole(user.role)}</p></div>
    </div>
    <button onClick={onLogout} disabled={isLoggingOut} className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">{isLoggingOut ? "Signing out…" : "Sign out"}</button>
  </div>;
}

function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    request: <><path d="M8 4h8a2 2 0 0 1 2 2v14H6V6a2 2 0 0 1 2-2Z" /><path d="M9 4.5h6M9 10h6M9 14h6M9 18h3" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    quote: <><path d="m12 3-9 5 9 5 9-5-9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`h-[18px] w-[18px] shrink-0 ${className ?? ""}`}>{paths[name]}</svg>;
}

function formatRole(role: string) {
  return role.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}
