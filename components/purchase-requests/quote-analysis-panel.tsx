"use client";

import { useMemo, useState } from "react";
import {
  useAnalyzeQuotesMutation,
  usePurchaseRequestsQuery,
} from "@/features/purchase-requests/purchase-request-api";
import {
  useLazyVendorDocumentsQuery,
  useVendorsQuery,
} from "@/features/vendors/vendor-api";

export function QuoteAnalysisPanel() {
  const requestsState = usePurchaseRequestsQuery();
  const vendorsState = useVendorsQuery();
  const [loadDocuments, documentsState] = useLazyVendorDocumentsQuery();
  const [analyzeQuotes, analysisState] = useAnalyzeQuotesMutation();
  const [requestId, setRequestId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string>();

  const analyzableRequests = useMemo(
    () => (requestsState.data ?? []).filter((request) => request.status === "QUOTE_COLLECTION"),
    [requestsState.data],
  );
  const documents = documentsState.data ?? [];
  const quoteDocuments = documents.filter(
    (document): document is typeof document & { quoteId: string } => Boolean(document.quoteId),
  );

  function selectVendor(nextVendorId: string) {
    setVendorId(nextVendorId);
    setSelectedQuoteIds([]);
    setMessage(undefined);
    if (nextVendorId) void loadDocuments(nextVendorId);
  }

  function toggleQuote(quoteId: string) {
    setSelectedQuoteIds((current) =>
      current.includes(quoteId)
        ? current.filter((id) => id !== quoteId)
        : [...current, quoteId],
    );
  }

  async function handleAnalyze() {
    if (!requestId || selectedQuoteIds.length === 0) {
      setMessage("Select a purchase request and at least one quote.");
      return;
    }
    setMessage(undefined);
    try {
      await analyzeQuotes({ id: requestId, quoteIds: selectedQuoteIds }).unwrap();
      setMessage("Quotes submitted for analysis. The request is now waiting for manager review.");
      setSelectedQuoteIds([]);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <section id="quote-analysis" className="scroll-mt-20 mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-sm font-semibold text-[#168778]">QUOTE ANALYSIS</p>
      <h2 className="mt-2 text-xl font-semibold">Compare vendor quotes</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review vendor quote documents first, choose a request in quote collection, then submit quote IDs for analysis.</p>

      <div className="mt-6">
        <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Step 1</p><h3 className="mt-1 font-semibold">Vendors and quote documents</h3></div>{vendorsState.isLoading && <span className="text-sm text-slate-500">Loading vendors…</span>}</div>
        {vendorsState.error && <p className="mt-4 text-sm text-red-700" role="alert">Could not load vendors.</p>}
        {!vendorsState.isLoading && (vendorsState.data ?? []).length === 0 && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No vendors are available.</p>}
        <div className="mt-4 space-y-3">{(vendorsState.data ?? []).filter((vendor) => vendor.isActive).map((vendor) => <div key={vendor.id} className={`rounded-xl border p-4 transition ${vendorId === vendor.id ? "border-[#168778] bg-[#f4fbf9]" : "border-slate-200 bg-white"}`}>
          <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => selectVendor(vendor.id)}><div><p className="font-semibold text-slate-800">{vendor.name}</p><p className="mt-1 text-sm text-slate-500">{vendor.email}</p></div><span className="text-sm font-medium text-[#168778]">{vendorId === vendor.id ? "Selected" : "View quotes"}</span></button>
          {vendorId === vendor.id && <div className="mt-4 border-t border-slate-200 pt-4"><p className="text-sm font-medium text-slate-700">Quote documents</p>{documentsState.isFetching && <p className="mt-2 text-sm text-slate-500">Loading documents…</p>}{!documentsState.isFetching && quoteDocuments.length === 0 && <p className="mt-2 text-sm text-slate-500">No quote documents found for this vendor.</p>}<div className="mt-2 space-y-2">{quoteDocuments.map((document) => <label key={document.quoteId} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-3 hover:bg-slate-50"><input type="checkbox" checked={selectedQuoteIds.includes(document.quoteId)} onChange={() => toggleQuote(document.quoteId)} className="h-4 w-4 accent-[#168778]" /><span className="min-w-0 flex-1 truncate text-sm text-slate-700">{document.fileName}</span><span className="text-xs text-slate-400">Quote ID available</span></label>)}</div></div>}
        </div>)}</div>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Step 2</p><h3 className="mt-1 font-semibold">Requests ready for analysis</h3>
        {requestsState.error && <p className="mt-4 text-sm text-red-700" role="alert">Could not load purchase requests.</p>}
        {!requestsState.isLoading && analyzableRequests.length === 0 && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No requests are currently in quote collection.</p>}
        {requestsState.isLoading ? <p className="mt-4 text-sm text-slate-500">Loading requests…</p> : <div className="mt-4 space-y-2">{analyzableRequests.map((request) => <label key={request.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${requestId === request.id ? "border-[#168778] bg-[#f4fbf9]" : "border-slate-200"}`}><input type="radio" name="analysis-request" value={request.id} checked={requestId === request.id} onChange={(event) => setRequestId(event.target.value)} className="h-4 w-4 accent-[#168778]" /><span className="min-w-0 flex-1"><span className="block font-medium text-slate-800">{request.title}</span><span className="mt-1 block text-xs text-slate-500">{request.items.length} item{request.items.length === 1 ? "" : "s"} · {formatStatus(request.status)}</span></span></label>)}</div>}
      </div>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Step 3</p><h3 className="mt-1 font-semibold">Analysis fields</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Purchase request ID<input readOnly value={requestId} placeholder="Select a request above" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-mono text-xs" /></label><label className="block text-sm font-medium text-slate-700">Quote IDs<input readOnly value={selectedQuoteIds.join(", ")} placeholder="Select quote documents above" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-mono text-xs" /></label></div>
      </div>

      {message && <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-700" role="status">{message}</p>}
      <button type="button" onClick={handleAnalyze} disabled={analysisState.isLoading || !requestId || selectedQuoteIds.length === 0} className="mt-5 rounded-xl bg-[#168778] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{analysisState.isLoading ? "Analyzing quotes…" : "Analyze selected quotes"}</button>
    </section>
  );
}

function formatStatus(status: string) {
  return status.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const message = (error as { data?: { message?: string | string[] } }).data?.message;
    if (Array.isArray(message)) return message[0];
    if (message) return message;
  }
  return "Could not analyze the selected quotes. Please try again.";
}
