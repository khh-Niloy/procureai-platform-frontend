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
  const isString = typeof value === "string";
  
  // Custom renderer for Recommendation JSON
  if (label === "Recommendation" && typeof value === "object" && value !== null && "quotes" in value && Array.isArray((value as any).quotes)) {
    const data = value as {
      quotes: Array<{
        quoteId?: string;
        price?: { score: number; explanation: string };
        delivery?: { score: number; explanation: string };
        warranty?: { score: number; explanation: string };
        strengths?: string[];
        issues?: Array<{ type: string; description: string }>;
      }>;
    };
    
    return (
      <details className="mt-4 rounded-lg bg-slate-50 p-4" open={defaultOpen}>
        <summary className="cursor-pointer text-sm font-medium text-slate-800">{label}</summary>
        <div className="mt-4 space-y-4">
          {data.quotes.map((quote, i) => (
            <div key={quote.quoteId || i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="font-semibold text-slate-900">Quote: <span className="font-mono text-sm font-normal text-slate-500">{quote.quoteId}</span></h4>
              
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {quote.price && (
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Price Score</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${quote.price.score >= 80 ? 'bg-emerald-100 text-emerald-800' : quote.price.score >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{quote.price.score}/100</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{quote.price.explanation}</p>
                  </div>
                )}
                
                {quote.delivery && (
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Delivery Score</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${quote.delivery.score >= 80 ? 'bg-emerald-100 text-emerald-800' : quote.delivery.score >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{quote.delivery.score}/100</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{quote.delivery.explanation}</p>
                  </div>
                )}
                
                {quote.warranty && (
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Warranty Score</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${quote.warranty.score >= 80 ? 'bg-emerald-100 text-emerald-800' : quote.warranty.score >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{quote.warranty.score}/100</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{quote.warranty.explanation}</p>
                  </div>
                )}
              </div>

              {(((quote.strengths?.length ?? 0) > 0) || ((quote.issues?.length ?? 0) > 0)) && (
                <div className="mt-5 grid gap-6 border-t border-slate-100 pt-5 sm:grid-cols-2">
                  {((quote.strengths?.length ?? 0) > 0) && (
                    <div>
                      <h5 className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-600">+</span>
                        Strengths
                      </h5>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        {quote.strengths?.map((s, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-emerald-500">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {((quote.issues?.length ?? 0) > 0) && (
                    <div>
                      <h5 className="flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-100 text-amber-600">!</span>
                        Issues
                      </h5>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        {quote.issues?.map((iss, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-amber-500">•</span>
                            <span><span className="font-medium text-slate-800 capitalize">{iss.type}:</span> {iss.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </details>
    );
  }

  // Custom renderer for Selected quote IDs
  if (label === "Selected quote IDs" && Array.isArray(value)) {
    return (
      <details className="mt-4 rounded-lg bg-slate-50 p-4" open={defaultOpen}>
        <summary className="cursor-pointer text-sm font-medium text-slate-800">{label}</summary>
        <div className="mt-4 flex flex-wrap gap-2">
          {value.map((id, idx) => (
            <span key={idx} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-600 shadow-sm">
              {String(id)}
            </span>
          ))}
          {value.length === 0 && <p className="text-sm text-slate-500">No quotes selected.</p>}
        </div>
      </details>
    );
  }

  // Custom renderer for Hard rule results
  if (label === "Hard rule results" && Array.isArray(value)) {
    return (
      <details className="mt-4 rounded-lg bg-slate-50 p-4" open={defaultOpen}>
        <summary className="cursor-pointer text-sm font-medium text-slate-800">{label}</summary>
        <div className="mt-4 space-y-4">
          {value.map((result, i) => (
            <div key={result.quoteId || i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="font-semibold text-slate-900">Quote: <span className="font-mono text-sm font-normal text-slate-500">{result.quoteId}</span></h4>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {["budget", "delivery", "requirements"].map((key) => {
                  const rule = result[key];
                  if (!rule) return null;
                  const passed = rule.status === "PASS";
                  return (
                    <div key={key} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-2">
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {passed ? "✓" : "✕"}
                        </span>
                        <h5 className="text-sm font-medium capitalize text-slate-800">{key}</h5>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{rule.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {value.length === 0 && <p className="text-sm text-slate-500">No hard rule results.</p>}
        </div>
      </details>
    );
  }

  return (
    <details className="mt-4 rounded-lg bg-slate-50 p-4" open={defaultOpen}>
      <summary className="cursor-pointer text-sm font-medium text-slate-800">{label}</summary>
      {isString ? (
        <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {value}
        </div>
      ) : (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
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
