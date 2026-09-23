"use client";

import { useState } from "react";
import {
  usePurchaseRequestsQuery,
  useStartQuoteCollectionMutation,
  type PurchaseRequest,
} from "@/features/purchase-requests/purchase-request-api";

export function QuoteCollectionList() {
  const { data: requests, error, isLoading, refetch } = usePurchaseRequestsQuery();
  const [startCollection, { isLoading: isStarting }] = useStartQuoteCollectionMutation();
  const [feedback, setFeedback] = useState<string>();
  const approvedRequests = requests?.filter((request) => request.status === "INITIAL_APPROVED") ?? [];

  async function begin(request: PurchaseRequest) {
    setFeedback(undefined);
    try {
      await startCollection(request.id).unwrap();
      setFeedback(`Quote collection started for “${request.title}”.`);
    } catch (caught) {
      setFeedback(getErrorMessage(caught));
    }
  }

  return <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><p className="text-sm font-semibold text-[#168778]">PROCUREMENT QUEUE</p><h2 className="mt-2 text-xl font-semibold">Initially approved requests</h2><p className="mt-2 text-sm leading-6 text-slate-500">Move an approved request into quote collection so vendor quotes can be gathered and analyzed.</p>{isLoading ? <p className="mt-6 text-sm text-slate-500">Loading requests…</p> : error ? <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">We couldn’t load requests. <button className="font-semibold underline" onClick={() => refetch()}>Try again</button></div> : approvedRequests.length === 0 ? <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No initially approved requests are waiting.</p> : <div className="mt-6 space-y-4">{approvedRequests.map((request) => <article className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-5 sm:flex-row sm:items-center" key={request.id}><div><h3 className="font-semibold">{request.title}</h3><p className="mt-1 text-sm text-slate-500">Requested by {request.requester.name} · {request.items.length} item{request.items.length === 1 ? "" : "s"}</p><p className="mt-2 text-sm leading-6 text-slate-600">{request.description}</p></div><button className="shrink-0 rounded-lg bg-[#168778] px-3.5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={isStarting} onClick={() => begin(request)}>{isStarting ? "Starting…" : "Start quote collection"}</button></article>)}</div>}{feedback && <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-700" role="status">{feedback}</p>}</section>;
}

function getErrorMessage(error: unknown) { if (typeof error === "object" && error && "data" in error) { const message = (error as { data?: { message?: string | string[] } }).data?.message; return Array.isArray(message) ? message[0] : message || "We couldn’t start quote collection."; } return "We couldn’t start quote collection."; }
