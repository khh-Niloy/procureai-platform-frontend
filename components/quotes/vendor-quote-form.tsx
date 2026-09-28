"use client";

import { FormEvent, useEffect, useState } from "react";
import { useCreateQuoteMutation } from "@/features/quotes/quote-api";
import { useVendorRequestsQuery } from "@/features/vendors/vendor-api";

interface QuoteLine {
  productName: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
}

interface QuoteToast {
  message: string;
  type: "success" | "error" | "warning";
}

export function VendorQuoteForm() {
  const requestsState = useVendorRequestsQuery();
  const [createQuote, quoteState] = useCreateQuoteMutation();
  const [requestId, setRequestId] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [fees, setFees] = useState({ discount: "", tax: "", shippingCost: "" });
  const [toast, setToast] = useState<QuoteToast>();

  const requests = (requestsState.data?.data ?? []).filter((request) => !request.isSubmitted);
  const subtotalCents = lines.reduce(
    (total, line) => total + (parseMoneyCents(line.totalPrice) ?? 0),
    0,
  );
  const totalCents = subtotalCents
    - (parseMoneyCents(fees.discount) ?? 0)
    + (parseMoneyCents(fees.tax) ?? 0)
    + (parseMoneyCents(fees.shippingCost) ?? 0);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(undefined), 6000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function resetForm(form: HTMLFormElement) {
    form.reset();
    setRequestId("");
    setLines([]);
    setFees({ discount: "", tax: "", shippingCost: "" });
  }

  function setPurchaseRequestId(nextRequestId: string) {
    setRequestId(nextRequestId);
    const request = requests.find((candidate) => candidate.id === nextRequestId);
    setLines(request?.items.map((item) => ({
      productName: item.name,
      description: item.description ?? "",
      quantity: String(item.quantity),
      unit: "",
      unitPrice: "",
      totalPrice: "",
    })) ?? []);
  }

  function updateLine(index: number, patch: Partial<QuoteLine>) {
    setLines((current) => current.map((line, lineIndex) => {
      if (lineIndex !== index) return line;
      const nextLine = { ...line, ...patch };
      const unitPriceCents = parseMoneyCents(nextLine.unitPrice);
      const totalPrice = unitPriceCents === null
        ? ""
        : formatMoneyCents(unitPriceCents * Number(nextLine.quantity));
      return { ...nextLine, totalPrice };
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToast(undefined);
    const form = event.currentTarget;
    const data = new FormData(form);

    if (!requestId) {
      setToast({ message: "Choose a purchase request before submitting.", type: "error" });
      return;
    }
    if (!requests.some((request) => request.id === requestId)) {
      setToast({ message: "This request is no longer open for quotes. Refresh the request list and try again.", type: "error" });
      return;
    }
    if (lines.length === 0 || lines.some((line) => parseMoneyCents(line.unitPrice) === null || parseMoneyCents(line.totalPrice) === null)) {
      setToast({ message: "Enter a valid unit price for every requested item.", type: "error" });
      return;
    }
    if ([fees.discount, fees.tax, fees.shippingCost].some((amount) => amount && parseMoneyCents(amount) === null)) {
      setToast({ message: "Enter valid amounts with no more than two decimal places.", type: "error" });
      return;
    }
    if (totalCents < 0) {
      setToast({ message: "The discount cannot exceed the subtotal plus tax and shipping.", type: "error" });
      return;
    }

    const optionalNumber = (name: string) => {
      const value = String(data.get(name) ?? "").trim();
      return value ? Number(value) : undefined;
    };

    try {
      const result = await createQuote({
        purchaseRequestId: requestId,
        subtotal: formatMoneyCents(subtotalCents),
        discount: fees.discount || undefined,
        tax: fees.tax || undefined,
        shippingCost: fees.shippingCost || undefined,
        totalAmount: formatMoneyCents(totalCents),
        currency: "BDT",
        deliveryDays: optionalNumber("deliveryDays"),
        deliveryTerms: value(data, "deliveryTerms"),
        paymentTerms: value(data, "paymentTerms"),
        warrantyMonths: optionalNumber("warrantyMonths"),
        validityDays: optionalNumber("validityDays"),
        notes: value(data, "notes"),
        items: lines.map(({ productName, description, quantity, unit, unitPrice, totalPrice }) => ({
          productName,
          description: description || undefined,
          quantity,
          unit: unit || undefined,
          unitPrice,
          totalPrice,
        })),
      }).unwrap();
      resetForm(form);
      setToast({
        message: result.document.status === "PROCESSING"
          ? "Quote submitted successfully. Your PDF is being generated and will appear in My Quotes."
          : "Quote submitted successfully. You can review it in My Quotes.",
        type: "success",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.startsWith("Quote was saved but PDF generation could not be queued")) {
        resetForm(form);
        setToast({
          message: "Your quote was submitted successfully, but PDF generation could not be queued. You can still find the quote in My Quotes.",
          type: "warning",
        });
        return;
      }
      setToast({ message: errorMessage, type: "error" });
    }
  }

  return <section id="quote-submission" className="scroll-mt-20 mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
    <p className="text-sm font-semibold text-[#168778]">VENDOR QUOTE</p>
    <h2 className="mt-2 text-xl font-semibold">Submit a quote</h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Enter an open request ID from the Quote requests table. Prices are in BDT, and the totals are calculated from your item prices.</p>
    {requestsState.error && <p className="mt-4 text-sm text-red-700" role="alert">Could not load quote requests.</p>}
    {!requestsState.isLoading && !requestsState.error && requests.length === 0 && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">There are no requests currently open for quote collection.</p>}
    <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700">Purchase request ID<input value={requestId} onChange={(event) => setPurchaseRequestId(event.target.value.trim())} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-mono text-sm" placeholder="Paste the request ID" autoComplete="off" disabled={requestsState.isLoading} /></label>
      {requestId && !lines.length && !requestsState.isLoading && !requestsState.error && <p className="-mt-4 text-sm text-amber-700">No open quote request matches this ID. Find the ID in the Quote requests table.</p>}
      {lines.length > 0 && <div><h3 className="font-semibold">Items and pricing (BDT)</h3><div className="mt-3 space-y-3">{lines.map((line, index) => <div key={`${line.productName}-${index}`} className="rounded-xl border border-slate-200 p-4"><p className="font-medium text-slate-800">{line.productName} <span className="text-sm font-normal text-slate-500">× {line.quantity}</span></p>{line.description && <p className="mt-1 text-sm text-slate-500">{line.description}</p>}<div className="mt-3 grid gap-3 sm:grid-cols-3"><Input label="Unit" value={line.unit} onChange={(value) => updateLine(index, { unit: value })} placeholder="pcs" /><Input label="Unit price (BDT)" inputMode="decimal" value={line.unitPrice} onChange={(value) => updateLine(index, { unitPrice: value })} placeholder="0.00" /><Input label="Line total (BDT)" value={line.totalPrice} placeholder="Calculated" readOnly /></div></div>)}</div></div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="Subtotal (BDT)" value={formatMoneyCents(subtotalCents)} placeholder="0.00" readOnly />
        <Input label="Discount (BDT)" name="discount" inputMode="decimal" value={fees.discount} onChange={(discount) => setFees((current) => ({ ...current, discount }))} placeholder="Optional" />
        <Input label="Tax (BDT)" name="tax" inputMode="decimal" value={fees.tax} onChange={(tax) => setFees((current) => ({ ...current, tax }))} placeholder="Optional" />
        <Input label="Shipping (BDT)" name="shippingCost" inputMode="decimal" value={fees.shippingCost} onChange={(shippingCost) => setFees((current) => ({ ...current, shippingCost }))} placeholder="Optional" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Total amount (BDT)" value={formatMoneyCents(totalCents)} placeholder="Calculated" readOnly />
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm"><p className="font-medium text-slate-700">Currency</p><p className="mt-2 font-semibold text-slate-900">BDT</p></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3"><Input label="Delivery days" name="deliveryDays" type="number" placeholder="Optional" /><Input label="Warranty months" name="warrantyMonths" type="number" placeholder="Optional" /><Input label="Validity days" name="validityDays" type="number" placeholder="Optional" /></div>
      <div className="grid gap-4 sm:grid-cols-2"><Input label="Delivery terms" name="deliveryTerms" placeholder="Optional" /><Input label="Payment terms" name="paymentTerms" placeholder="Optional" /></div>
      <label className="block text-sm font-medium text-slate-700">Notes<textarea name="notes" className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3.5 py-3" placeholder="Optional notes for the procurement team" /></label>
      <button type="submit" disabled={quoteState.isLoading || !requestId || lines.length === 0} className="rounded-xl bg-[#168778] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{quoteState.isLoading ? "Submitting quote…" : "Submit quote"}</button>
    </form>
    {toast && <div className={`fixed right-4 top-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : toast.type === "warning" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-red-200 bg-red-50 text-red-700"}`} role={toast.type === "error" ? "alert" : "status"} aria-live={toast.type === "error" ? "assertive" : "polite"}>{toast.message}<button className="ml-4 font-semibold" type="button" aria-label="Dismiss notification" onClick={() => setToast(undefined)}>×</button></div>}
  </section>;
}

function Input({ label, name, value, onChange, placeholder, type = "text", readOnly = false, inputMode }: { label: string; name?: string; value?: string; onChange?: (value: string) => void; placeholder: string; type?: string; readOnly?: boolean; inputMode?: "decimal" | "numeric" }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<input name={name} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} type={type} inputMode={inputMode} min={type === "number" ? "0" : undefined} placeholder={placeholder} readOnly={readOnly} className={`mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 ${readOnly ? "bg-slate-50 text-slate-600" : "bg-white"}`} /></label>;
}

function parseMoneyCents(value: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) return null;
  const [whole, fraction = ""] = normalizedValue.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function formatMoneyCents(cents: number) {
  return (cents / 100).toFixed(2);
}

function value(data: FormData, name: string) {
  const result = String(data.get(name) ?? "").trim();
  return result || undefined;
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const message = (error as { data?: { message?: string | string[] } }).data?.message;
    if (Array.isArray(message)) return message[0] ?? "Could not submit the quote.";
    if (message) return message;
  }
  return "Could not submit the quote. Please check the details and try again.";
}
