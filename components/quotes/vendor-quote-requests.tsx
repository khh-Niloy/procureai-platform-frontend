"use client";

import { useVendorQuoteRequestsQuery } from "@/features/vendors/vendor-api";

export function VendorQuoteRequests() {
  const { data: requests = [], isLoading, error, refetch } = useVendorQuoteRequestsQuery();

  return (
    <section id="quote-requests" className="mt-10 scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-sm font-semibold text-[#168778]">REQUESTS FOR QUOTE</p>
      <h2 className="mt-2 text-xl font-semibold">Purchase requests</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review requests shared with your organization and prepare a quote for the ones you can fulfill.</p>

      {isLoading && <p className="mt-6 text-sm text-slate-500">Loading requests…</p>}
      {error && <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">We couldn’t load quote requests. <button type="button" className="font-semibold underline" onClick={() => refetch()}>Try again</button></div>}
      {!isLoading && !error && requests.length === 0 && <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">There are no quote requests for your organization yet.</p>}

      {!isLoading && !error && requests.length > 0 && <div className="mt-6 space-y-4">{requests.map(({ id, vendorQuoteRequest, createdAt, purchaseRequest }) => (
        <article key={id} className="rounded-xl border border-slate-200 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h3 className="font-semibold text-slate-900">{purchaseRequest.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{purchaseRequest.organization.name} · Requested {formatDate(createdAt)}</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-400">Request ID: {purchaseRequest.id}</p>
            </div>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${vendorQuoteRequest === "PENDING" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
              {vendorQuoteRequest === "PENDING" ? "Quote requested" : "Quote submitted"}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{purchaseRequest.description}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span>{purchaseRequest.items.length} item{purchaseRequest.items.length === 1 ? "" : "s"}</span>
            {purchaseRequest.budget && <span>Budget: {purchaseRequest.currency} {purchaseRequest.budget}</span>}
            {purchaseRequest.requiredBy && <span>Required by: {formatDate(purchaseRequest.requiredBy)}</span>}
          </div>
          {purchaseRequest.items.length > 0 && <ul className="mt-4 divide-y divide-slate-100 rounded-lg bg-slate-50 px-4">
            {purchaseRequest.items.map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
              <span className="font-medium text-slate-700">{item.name}{item.description && <span className="font-normal text-slate-500"> — {item.description}</span>}</span>
              <span className="shrink-0 text-slate-500">Qty {item.quantity}</span>
            </li>)}
          </ul>}
        </article>
      ))}</div>}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
