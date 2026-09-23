"use client";

import { FormEvent, useState } from "react";
import { useCreateQuoteMutation } from "@/features/quotes/quote-api";
import { useVendorQuoteRequestsQuery } from "@/features/vendors/vendor-api";

interface QuoteLine {
  productName: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
}

export function VendorQuoteForm({ userId }: { userId: string }) {
  const requestsState = useVendorQuoteRequestsQuery();
  const [createQuote, quoteState] = useCreateQuoteMutation();
  const [requestId, setRequestId] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [message, setMessage] = useState<string>();

  const requests = (requestsState.data ?? []).filter((request) => request.vendorQuoteRequest === "PENDING" && request.purchaseRequest.status === "QUOTE_COLLECTION");
  function setPurchaseRequestId(nextRequestId: string) {
    setRequestId(nextRequestId);
    const request = requests.find((candidate) => candidate.purchaseRequest.id === nextRequestId);
    setLines(request?.purchaseRequest.items.map((item) => ({
      productName: item.name,
      description: item.description ?? "",
      quantity: String(item.quantity),
      unit: "",
      unitPrice: "",
      totalPrice: "",
    })) ?? []);
  }

  function updateLine(index: number, patch: Partial<QuoteLine>) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);
    const data = new FormData(event.currentTarget);
    const totalAmount = String(data.get("totalAmount") ?? "").trim();
    if (!requestId) return setMessage("Enter a purchase request ID.");
    if (!requests.some((request) => request.purchaseRequest.id === requestId)) return setMessage("No open quote request matches that ID. Check the Quote requests tab and try again.");
    if (!/^\d+(\.\d+)?$/.test(totalAmount)) return setMessage("Enter a valid total amount.");
    if (lines.length === 0 || lines.some((line) => !line.unitPrice || !line.totalPrice || !/^\d+(\.\d+)?$/.test(line.unitPrice) || !/^\d+(\.\d+)?$/.test(line.totalPrice))) return setMessage("Enter valid unit and total prices for every item.");

    const optionalNumber = (name: string) => {
      const value = String(data.get(name) ?? "").trim();
      return value ? Number(value) : undefined;
    };
    try {
      const result = await createQuote({
        userId,
        purchaseRequestId: requestId,
        subtotal: value(data, "subtotal"),
        discount: value(data, "discount"),
        tax: value(data, "tax"),
        shippingCost: value(data, "shippingCost"),
        totalAmount,
        currency: String(data.get("currency") ?? "USD") as "USD" | "EUR" | "GBP" | "BDT",
        deliveryDays: optionalNumber("deliveryDays"),
        deliveryTerms: value(data, "deliveryTerms"),
        paymentTerms: value(data, "paymentTerms"),
        warrantyMonths: optionalNumber("warrantyMonths"),
        validityDays: optionalNumber("validityDays"),
        notes: value(data, "notes"),
        items: lines.map(({ productName, description, quantity, unit, unitPrice, totalPrice }) => ({ productName, description: description || undefined, quantity, unit: unit || undefined, unitPrice, totalPrice })),
      }).unwrap();
      setMessage(`Quote submitted. Your generated document is ${result.document.fileName}.`);
      event.currentTarget.reset();
      setRequestId("");
      setLines([]);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return <section id="quote-submission" className="scroll-mt-20 mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
    <p className="text-sm font-semibold text-[#168778]">VENDOR QUOTE</p>
    <h2 className="mt-2 text-xl font-semibold">Submit a quote</h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Enter an open request ID from the Quote requests tab, add your pricing, and submit. The backend will generate the quotation PDF automatically.</p>
    {requestsState.error && <p className="mt-4 text-sm text-red-700" role="alert">Could not load quote requests.</p>}
    {!requestsState.isLoading && !requestsState.error && requests.length === 0 && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">There are no requests currently open for quote collection.</p>}
    <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700">Purchase request ID<input value={requestId} onChange={(event) => setPurchaseRequestId(event.target.value.trim())} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-mono text-sm" placeholder="Paste the request ID" autoComplete="off" disabled={requestsState.isLoading} /></label>
      {requestId && !lines.length && !requestsState.isLoading && !requestsState.error && <p className="-mt-4 text-sm text-amber-700">No open quote request matches this ID. Find the ID in the Quote requests tab.</p>}
      {lines.length > 0 && <div><h3 className="font-semibold">Items and pricing</h3><div className="mt-3 space-y-3">{lines.map((line, index) => <div key={`${line.productName}-${index}`} className="rounded-xl border border-slate-200 p-4"><p className="font-medium text-slate-800">{line.productName} <span className="text-sm font-normal text-slate-500">× {line.quantity}</span></p><div className="mt-3 grid gap-3 sm:grid-cols-3"><Input label="Unit" value={line.unit} onChange={(value) => updateLine(index, { unit: value })} placeholder="pcs" /><Input label="Unit price" value={line.unitPrice} onChange={(value) => updateLine(index, { unitPrice: value })} placeholder="0.00" /><Input label="Total price" value={line.totalPrice} onChange={(value) => updateLine(index, { totalPrice: value })} placeholder="0.00" /></div></div>)}</div></div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Input label="Subtotal" name="subtotal" placeholder="Optional" /><Input label="Discount" name="discount" placeholder="Optional" /><Input label="Tax" name="tax" placeholder="Optional" /><Input label="Shipping" name="shippingCost" placeholder="Optional" /></div>
      <div className="grid gap-4 sm:grid-cols-2"><Input label="Total amount" name="totalAmount" placeholder="0.00" required /><label className="block text-sm font-medium text-slate-700">Currency<select name="currency" defaultValue="USD" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3"><option>USD</option><option>EUR</option><option>GBP</option><option>BDT</option></select></label></div>
      <div className="grid gap-4 sm:grid-cols-3"><Input label="Delivery days" name="deliveryDays" type="number" placeholder="Optional" /><Input label="Warranty months" name="warrantyMonths" type="number" placeholder="Optional" /><Input label="Validity days" name="validityDays" type="number" placeholder="Optional" /></div>
      <div className="grid gap-4 sm:grid-cols-2"><Input label="Delivery terms" name="deliveryTerms" placeholder="Optional" /><Input label="Payment terms" name="paymentTerms" placeholder="Optional" /></div>
      <label className="block text-sm font-medium text-slate-700">Notes<textarea name="notes" className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3.5 py-3" placeholder="Optional notes for the procurement team" /></label>
      {message && <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-700" role="status">{message}</p>}
      <button type="submit" disabled={quoteState.isLoading || !requestId || lines.length === 0} className="rounded-xl bg-[#168778] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{quoteState.isLoading ? "Submitting quote…" : "Submit quote"}</button>
    </form>
  </section>;
}

function Input({ label, name, value, onChange, placeholder, type = "text", required = false }: { label: string; name?: string; value?: string; onChange?: (value: string) => void; placeholder: string; type?: string; required?: boolean }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<input name={name} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} type={type} min={type === "number" ? "0" : undefined} placeholder={placeholder} required={required} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3" /></label>;
}

function value(data: FormData, name: string) {
  const result = String(data.get(name) ?? "").trim();
  return result || undefined;
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const message = (error as { data?: { message?: string | string[] } }).data?.message;
    if (Array.isArray(message)) return message[0];
    if (message) return message;
  }
  return "Could not submit the quote. Please check the details and try again.";
}
