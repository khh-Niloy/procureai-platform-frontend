"use client";

import { FormEvent, useEffect, useState } from "react";
import { useCreatePurchaseRequestMutation } from "@/features/purchase-requests/purchase-request-api";

type Item = { name: string; description: string; quantity: number };

export function CreateRequestForm() {
  const [items, setItems] = useState<Item[]>([
    { name: "", description: "", quantity: 1 },
  ]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  }>();
  const [createRequest, { isLoading }] = useCreatePurchaseRequestMutation();

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(undefined), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setToast(undefined);
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const budget = String(data.get("budget") ?? "").trim();
    const requiredBy = String(data.get("requiredBy") ?? "");

    if (title.length < 2 || description.length < 2)
      return setToast({
        message: "Add a title and description for the request.",
        type: "error",
      });
    if (items.some((item) => !item.name.trim() || item.quantity < 1))
      return setToast({
        message: "Every item needs a name and quantity of at least 1.",
        type: "error",
      });
    if (budget && (!/^\d+(\.\d{1,2})?$/.test(budget) || Number(budget) < 0))
      return setToast({
        message: "Budget must be a valid positive amount.",
        type: "error",
      });

    try {
      await createRequest({
        title,
        description,
        budget: budget || undefined,
        currency: "BDT",
        requiredBy: requiredBy || undefined,
        items: items.map((item) => ({
          name: item.name.trim(),
          description: item.description.trim() || undefined,
          quantity: item.quantity,
        })),
      }).unwrap();
      form.reset();
      setItems([{ name: "", description: "", quantity: 1 }]);
      setToast({
        message: "Request sent to your manager for initial approval.",
        type: "success",
      });
    } catch (caught) {
      setToast({ message: getErrorMessage(caught), type: "error" });
    }
  }

  return (
    <section
      id="create-request"
      className="scroll-mt-20 mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
    >
      <p className="text-sm font-semibold text-[#168778]">
        NEW PURCHASE REQUEST
      </p>
      <h2 className="mt-2 text-xl font-semibold">
        Request what your team needs
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Your manager will review this request before the procurement process
        begins.
      </p>
      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Request title"
            name="title"
            placeholder="Laptops for design team"
          />
          <label className="block text-sm font-medium text-slate-700">
            Currency
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3"
              name="currency"
              value="BDT"
              readOnly
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Description
          <textarea
            className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3.5 py-3"
            name="description"
            placeholder="Describe the business need and expected use."
            required
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Budget (optional)"
            name="budget"
            type="number"
            placeholder="5000"
          />
          <label className="block text-sm font-medium text-slate-700">
            Required by
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3"
              name="requiredBy"
              type="date"
            />
          </label>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">Items</h3>
            <button
              className="text-sm font-semibold text-[#168778] hover:underline"
              type="button"
              onClick={() =>
                setItems((current) => [
                  ...current,
                  { name: "", description: "", quantity: 1 },
                ])
              }
            >
              Add item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                className="grid gap-3 sm:grid-cols-[1.2fr_1.5fr_110px_auto]"
                key={index}
              >
                <input
                  className="rounded-xl border border-slate-200 px-3.5 py-3"
                  value={item.name}
                  onChange={(event) =>
                    updateItem(index, { name: event.target.value })
                  }
                  placeholder="Item name"
                  aria-label={`Item ${index + 1} name`}
                />
                <input
                  className="rounded-xl border border-slate-200 px-3.5 py-3"
                  value={item.description}
                  onChange={(event) =>
                    updateItem(index, { description: event.target.value })
                  }
                  placeholder="Description (optional)"
                  aria-label={`Item ${index + 1} description`}
                />
                <input
                  className="rounded-xl border border-slate-200 px-3.5 py-3"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(index, {
                      quantity: Math.max(1, Number(event.target.value)),
                    })
                  }
                  aria-label={`Item ${index + 1} quantity`}
                />
                {items.length > 1 && (
                  <button
                    className="text-sm font-medium text-red-600"
                    type="button"
                    onClick={() =>
                      setItems((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <button
          className="rounded-xl bg-[#168778] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Sending…" : "Send for approval"}
        </button>
      </form>
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}
          role={toast.type === "success" ? "status" : "alert"}
          aria-live={toast.type === "success" ? "polite" : "assertive"}
        >
          {toast.message}
          <button
            className="ml-4 font-semibold"
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToast(undefined)}
          >
            ×
          </button>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3"
        name={name}
        type={type}
        placeholder={placeholder}
        min={type === "number" ? "0" : undefined}
        required={name === "title"}
      />
    </label>
  );
}
function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const message = (error as { data?: { message?: string | string[] } }).data
      ?.message;
    return Array.isArray(message)
      ? message[0]
      : message || "We couldn’t send the request. Please try again.";
  }
  return "We couldn’t send the request. Please try again.";
}
