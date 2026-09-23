"use client";

import { useState } from "react";
import {
  useDecideInitialApprovalMutation,
  usePendingInitialApprovalsQuery,
  type PurchaseRequest,
} from "@/features/purchase-requests/purchase-request-api";

export function InitialApprovalList() {
  const { data: requests, error, isLoading, refetch } = usePendingInitialApprovalsQuery();
  const [decide, { isLoading: isDeciding }] = useDecideInitialApprovalMutation();
  const [feedback, setFeedback] = useState<string>();
  const pending = requests ?? [];

  async function decideRequest(request: PurchaseRequest, status: "INITIAL_APPROVED" | "REJECTED") {
    setFeedback(undefined);
    try {
      await decide({ id: request.id, status }).unwrap();
      setFeedback(status === "INITIAL_APPROVED" ? `Approved “${request.title}”.` : `Rejected “${request.title}”.`);
    } catch (caught) {
      setFeedback(getErrorMessage(caught));
    }
  }

  return <section id="initial-approvals" className="scroll-mt-20 mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><p className="text-sm font-semibold text-[#168778]">MANAGER REVIEW</p><h2 className="mt-2 text-xl font-semibold">Requests awaiting initial approval</h2><p className="mt-2 text-sm leading-6 text-slate-500">Approve a request to move it into procurement, or reject it to close the request.</p>{isLoading ? <p className="mt-6 text-sm text-slate-500">Loading requests…</p> : error ? <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">We couldn’t load requests. <button className="font-semibold underline" onClick={() => refetch()}>Try again</button></div> : pending.length === 0 ? <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No requests are waiting for your approval.</p> : <div className="mt-6 space-y-4">{pending.map((request) => <article className="rounded-xl border border-slate-200 p-5" key={request.id}><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><h3 className="font-semibold">{request.title}</h3><p className="mt-1 text-sm text-slate-500">Requested by {request.requester.name} · {formatDate(request.createdAt)}</p><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{request.description}</p><p className="mt-3 text-sm text-slate-500">{request.items.length} item{request.items.length === 1 ? "" : "s"}{request.budget ? ` · ${request.currency} ${request.budget}` : ""}</p></div><div className="flex shrink-0 items-start gap-2"><button className="rounded-lg border border-red-200 px-3.5 py-2 text-sm font-semibold text-red-700 disabled:opacity-60" disabled={isDeciding} onClick={() => decideRequest(request, "REJECTED")}>Reject</button><button className="rounded-lg bg-[#168778] px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isDeciding} onClick={() => decideRequest(request, "INITIAL_APPROVED")}>Approve</button></div></div></article>)}</div>}{feedback && <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-700" role="status">{feedback}</p>}</section>;
}

function formatDate(value: string) { return value.slice(0, 10); }
function getErrorMessage(error: unknown) { if (typeof error === "object" && error && "data" in error) { const message = (error as { data?: { message?: string | string[] } }).data?.message; return Array.isArray(message) ? message[0] : message || "We couldn’t record that decision."; } return "We couldn’t record that decision."; }
