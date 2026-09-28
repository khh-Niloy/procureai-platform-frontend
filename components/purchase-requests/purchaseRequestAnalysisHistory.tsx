"use client";

import { FormEvent, useState } from "react";
import { useLazyPurchaseRequestAnalysesQuery } from "@/features/purchase-requests/purchase-request-api";

export function PurchaseRequestAnalysisHistory() {
  const [loadAnalyses, analysesState] = useLazyPurchaseRequestAnalysesQuery();
  const [purchaseRequestId, setPurchaseRequestId] = useState("");
  const [searchedRequestId, setSearchedRequestId] = useState("");
  const [lookupError, setLookupError] = useState<string>();

  async function findAnalyses(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestId = purchaseRequestId.trim();
    if (!requestId) {
      setLookupError("Enter a purchase request ID.");
      setSearchedRequestId("");
      return;
    }

    setSearchedRequestId(requestId);
    setLookupError(undefined);
    try {
      await loadAnalyses(requestId).unwrap();
    } catch (error) {
      setLookupError(getAnalysisErrorMessage(error));
    }
  }

  const analyses = analysesState.currentData?.data ?? [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-sm font-semibold text-[#168778]">ORGANIZATION WORKFLOW</p>
      <h2 className="mt-2 text-xl font-semibold">AI analysis history</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Enter a purchase request ID to view its AI analysis results.
      </p>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={findAnalyses}>
        <label className="sr-only" htmlFor="analysis-purchase-request-id">
          Purchase request ID
        </label>
        <input
          id="analysis-purchase-request-id"
          value={purchaseRequestId}
          onChange={(event) => {
            setPurchaseRequestId(event.target.value);
            setLookupError(undefined);
          }}
          placeholder="Paste a purchase request ID"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-3 font-mono text-sm"
        />
        <button
          type="submit"
          disabled={analysesState.isFetching}
          className="rounded-xl bg-[#168778] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {analysesState.isFetching ? "Loading analyses…" : "Show analyses"}
        </button>
      </form>

      {lookupError && <p className="mt-3 text-sm text-red-700" role="alert">{lookupError}</p>}
      {searchedRequestId && analysesState.isFetching && (
        <p className="mt-4 text-sm text-slate-500">Loading analysis history…</p>
      )}
      {searchedRequestId && !analysesState.isFetching && analyses.length === 0 && !lookupError && (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          No AI analyses were found for this request.
        </p>
      )}
      {searchedRequestId && !analysesState.isFetching && analyses.length > 0 && (
        <div className="mt-5 space-y-4">
          <p className="font-mono text-xs text-slate-500">
            Request: {analysesState.currentData?.purchaseRequest.title} · {analysesState.currentData?.purchaseRequest.id}
          </p>
          {analyses.map((analysis) => (
            <article key={analysis.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">Analysis</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Created {formatDateTime(analysis.createdAt)} by {analysis.createdBy.name}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${analysis.status === "SUCCEEDED" ? "bg-emerald-50 text-emerald-800" : analysis.status === "FAILED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                  {analysis.status}
                </span>
              </div>
              {analysis.failureReason && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{analysis.failureReason}</p>
              )}
              {analysis.recommendedQuoteId && (
                <p className="mt-3 text-sm text-slate-700">
                  Recommended quote: <span className="font-mono text-xs">{analysis.recommendedQuoteId}</span>
                </p>
              )}
              <AnalysisJson label="Recommendation" value={analysis.recommendation} defaultOpen />
              <AnalysisJson label="Hard rule results" value={analysis.hardRuleResults} defaultOpen />
              <AnalysisJson label="Selected quote IDs" value={analysis.selectedQuoteIds} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function AnalysisJson({ label, value, defaultOpen = false }: { label: string; value: unknown; defaultOpen?: boolean }) {
  if (value === null || value === undefined) return null;
  return (
    <details className="mt-3 rounded-lg bg-slate-50 p-3" open={defaultOpen}>
      <summary className="cursor-pointer text-sm font-medium text-slate-700">{label}</summary>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getAnalysisErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const message = (error as { data?: { message?: string | string[] } }).data?.message;
    if (Array.isArray(message)) return message[0] ?? "Could not load analysis history.";
    if (message) return message;
  }
  return "Could not load analysis history. Check the request ID and try again.";
}
