"use client";

import { useVendorRequestsQuery } from "@/features/vendors/vendor-api";

export function VendorQuoteRequests() {
  const { data, isLoading, error, refetch } = useVendorRequestsQuery();
  const requests = data?.data ?? [];

  return (
    <section id="quote-requests" className="mt-10 scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-sm font-semibold text-[#168778]">REQUESTS FOR QUOTE</p>
      <h2 className="mt-2 text-xl font-semibold">Purchase requests</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review requests open for quote collection and check whether you have submitted a quote.</p>

      {isLoading && <p className="mt-6 text-sm text-slate-500">Loading requests…</p>}
      {error && <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">We couldn’t load requests. <button type="button" className="font-semibold underline" onClick={() => refetch()}>Try again</button></div>}
      {!isLoading && !error && requests.length === 0 && <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">There are no requests open for quote collection right now.</p>}

      {!isLoading && !error && requests.length > 0 && <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[850px] divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Request ID</th>
              <th className="px-4 py-3 font-semibold">Request</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 font-semibold">Budget</th>
              <th className="px-4 py-3 font-semibold">Required by</th>
              <th className="px-4 py-3 font-semibold">Your quote</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-4 font-mono text-xs text-slate-600">{request.id}</td>
                <td className="max-w-sm px-4 py-4">
                  <p className="font-semibold text-slate-900">{request.title}</p>
                  <p className="mt-1 line-clamp-2 text-slate-500">{request.description}</p>
                </td>
                <td className="px-4 py-4 text-slate-600">{request.items.length} item{request.items.length === 1 ? "" : "s"}</td>
                <td className="px-4 py-4 text-slate-600">{request.budget ? `${request.currency} ${request.budget}` : "—"}</td>
                <td className="px-4 py-4 text-slate-600">{request.requiredBy ? formatDate(request.requiredBy) : "—"}</td>
                <td className="px-4 py-4">
                  <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${request.isSubmitted ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                    {request.isSubmitted ? "Submitted" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
