"use client";

import { useState } from "react";
import {
  usePendingQuoteCollectionQuery,
  useStartQuoteCollectionMutation,
  type PurchaseRequest,
} from "@/features/purchase-requests/purchase-request-api";

export function QuoteCollectionList({ organizationId }: { organizationId: string }) {
  const { data: requests, error, isLoading, refetch } = usePendingQuoteCollectionQuery();
  const [startCollection, { isLoading: isStarting }] = useStartQuoteCollectionMutation();
  const [feedback, setFeedback] = useState<string>();
  const [note, setNote] = useState("");
  const approvedRequests = requests ?? [];

  async function begin(request: PurchaseRequest) {
    setFeedback(undefined);
    try {
      const currentLog = request.logs[request.logs.length - 1];
      if (!currentLog) throw new Error("This request has no workflow log.");
      await startCollection({
        purchaseRequestId: request.id,
        purchaseRequestLogId: currentLog.id,
        organizationId,
        note: note.trim() || undefined,
      }).unwrap();
      setNote("");
      setFeedback(`Quote collection started for “${request.title}”.`);
    } catch (caught) {
      setFeedback(getErrorMessage(caught));
    }
  }

  return <section id="quote-collection" className="scroll-mt-20 mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><p className="text-sm font-semibold text-[#168778]">PROCUREMENT QUEUE</p><h2 className="mt-2 text-xl font-semibold">Requests ready for procurement</h2><p className="mt-2 text-sm leading-6 text-slate-500">Start quote collection for manager-approved requests so vendors can submit quotes.</p>{isLoading ? <p className="mt-6 text-sm text-slate-500">Loading requests…</p> : error ? <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">We couldn’t load requests. <button className="font-semibold underline" onClick={() => refetch()}>Try again</button></div> : approvedRequests.length === 0 ? <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No requests are waiting for procurement.</p> : <div className="mt-6 space-y-4">{approvedRequests.map((request) => <article className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-5 sm:flex-row sm:items-center" key={request.id}><div><h3 className="font-semibold">{request.title}</h3><p className="mt-1 text-sm text-slate-500">Requested by {request.requester.name} · {request.items.length} item{request.items.length === 1 ? "" : "s"}</p><p className="mt-2 text-sm leading-6 text-slate-600">{request.description}</p></div><div className="w-full shrink-0 sm:w-64"><label className="block"><span className="sr-only">Quote collection comment</span><textarea className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs placeholder:text-slate-400" maxLength={2000} rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a comment (optional)" /></label><button className="mt-2 w-full rounded-lg bg-[#168778] px-3.5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={isStarting} onClick={() => begin(request)}>{isStarting ? "Starting…" : "Start quote collection"}</button></div></article>)}</div>}{feedback && <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-700" role="status">{feedback}</p>}</section>;
}

function getErrorMessage(error: unknown) { if (typeof error === "object" && error && "data" in error) { const message = (error as { data?: { message?: string | string[] } }).data?.message; return Array.isArray(message) ? message[0] : message || "We couldn’t start quote collection."; } return "We couldn’t start quote collection."; }
