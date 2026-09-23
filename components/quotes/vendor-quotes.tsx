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
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review quotes you have submitted and open their generated PDF documents.</p>

      {isLoading && <p className="mt-6 text-sm text-slate-500">Loading your quotes…</p>}
      {error && <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">We couldn’t load your quotes. <button type="button" className="font-semibold underline" onClick={() => refetch()}>Try again</button></div>}
      {!isLoading && !error && quotes.length === 0 && <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">You haven’t submitted any quotes yet.</p>}
      {downloadError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{downloadError}</p>}

      {!isLoading && !error && quotes.length > 0 && <div className="mt-6 space-y-4">{quotes.map((quote) => {
        const document = quote.documents[0];
        const download = downloadLinks[quote.id];
        return <article key={quote.id} className="rounded-xl border border-slate-200 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h3 className="font-semibold text-slate-900">{quote.purchaseRequest?.title ?? "Purchase request"}</h3>
              <p className="mt-1 text-sm text-slate-500">Submitted {formatDate(quote.submittedAt)} · Quote ID <span className="font-mono text-xs">{quote.id}</span></p>
            </div>
            <p className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">{quote.currency} {quote.totalAmount}</p>
          </div>

          {quote.items.length > 0 && <ul className="mt-4 divide-y divide-slate-100 rounded-lg bg-slate-50 px-4">
            {quote.items.map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3 text-sm">
              <span className="font-medium text-slate-700">{item.productName} <span className="font-normal text-slate-500">× {item.quantity}{item.unit ? ` ${item.unit}` : ""}</span></span>
              <span className="text-slate-600">{quote.currency} {item.totalPrice}</span>
            </li>)}
          </ul>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!document && <span className="text-sm text-amber-700">PDF document is not available yet.</span>}
            {document?.status === "PROCESSING" && <span className="text-sm text-amber-700">PDF is being generated…</span>}
            {document?.status === "FAILED" && <span className="text-sm text-red-700">PDF generation failed. {document.failureReason}</span>}
            {document?.status === "DONE" && !download && <button type="button" onClick={() => loadPdf(quote.id)} disabled={downloadState.isFetching} className="rounded-lg bg-[#168778] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{downloadState.isFetching ? "Getting PDF link…" : `Get ${document.fileName}`}</button>}
            {download && <a href={download.url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#168778] px-4 py-2 text-sm font-semibold text-white">Open {download.fileName}</a>}
          </div>
        </article>;
      })}</div>}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
