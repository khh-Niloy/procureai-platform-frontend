"use client";

import { useState } from "react";
import { useLazyQuoteDownloadUrlQuery, useVendorQuotesQuery } from "@/features/quotes/quote-api";

export function VendorQuotes() {
  const { data: quotes = [], isLoading, error, refetch } = useVendorQuotesQuery();
  const [getDownloadUrl, downloadState] = useLazyQuoteDownloadUrlQuery();
  const [downloadLinks, setDownloadLinks] = useState<Record<string, { fileName: string; url: string }>>({});
  const [downloadError, setDownloadError] = useState<string>();

  async function loadPdf(quoteId: string) {
    setDownloadError(undefined);
    try {
      const result = await getDownloadUrl(quoteId).unwrap();
      setDownloadLinks((current) => ({ ...current, [quoteId]: result }));
    } catch (error) {
      const message = typeof error === "object" && error !== null && "data" in error
        ? (error as { data?: { message?: string | string[] } }).data?.message
        : undefined;
      setDownloadError(Array.isArray(message) ? message[0] : message || "Could not get the PDF link. Please try again.");
    }
  }

  return (
    <section id="vendor-quotes" className="mt-10 scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-sm font-semibold text-[#168778]">QUOTE HISTORY</p>
      <h2 className="mt-2 text-xl font-semibold">My quotes</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review your submitted quotes and open their generated PDF documents.</p>

      {isLoading && <p className="mt-6 text-sm text-slate-500">Loading your quotes…</p>}
      {error && <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">We couldn’t load your quotes. <button type="button" className="font-semibold underline" onClick={() => refetch()}>Try again</button></div>}
      {!isLoading && !error && quotes.length === 0 && <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">You haven’t submitted any quotes yet.</p>}
      {downloadError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{downloadError}</p>}

      {!isLoading && !error && quotes.length > 0 && <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[850px] divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Purchase request</th>
              <th className="px-4 py-3 font-semibold">Quote ID</th>
              <th className="px-4 py-3 font-semibold">Submitted</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Quotation PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {quotes.map((quote) => {
              const document = quote.documents[0];
              const download = downloadLinks[quote.id];
              return (
                <tr key={quote.id}>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{quote.purchaseRequest?.title ?? "Purchase request"}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{quote.purchaseRequest?.id ?? "Request unavailable"}</p>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-600">{quote.id}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-600">{formatDate(quote.submittedAt)}</td>
                  <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-700">{quote.currency} {quote.totalAmount}</td>
                  <td className="px-4 py-4">
                    {!document && <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">Not available</span>}
                    {document?.status === "PROCESSING" && <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-amber-200 bg-amber-50 text-xs font-medium text-amber-700">Generating…</span>}
                    {document?.status === "FAILED" && <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-red-200 bg-red-50 text-xs font-medium text-red-700">Failed: {document.failureReason || "PDF generation error"}</span>}
                    {document?.status === "DONE" && !download && <button type="button" onClick={() => loadPdf(quote.id)} disabled={downloadState.isFetching} className="rounded-lg bg-[#168778] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{downloadState.isFetching ? "Loading…" : "Get PDF"}</button>}
                    {download && <a href={download.url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#168778] px-3 py-2 text-xs font-semibold text-white">Open PDF</a>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
