"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy } from "lucide-react";
import {
  usePurchaseRequestsQuery,
  useTransitionPurchaseRequestMutation,
  type PurchaseRequest,
  type PurchaseRequestAction,
  type PurchaseRequestLog,
  type PurchaseRequestStatus,
} from "@/features/purchase-requests/purchase-request-api";

type WorkflowStage = {
  title: string;
  statuses: PurchaseRequestStatus[];
};

const workflowStages: WorkflowStage[] = [
  { title: "Team Leader Request", statuses: ["PENDING_MANAGER_APPROVAL"] },
  { title: "Manager Approval", statuses: ["REQUEST_APPROVED", "REJECTED"] },
  { title: "Procurement", statuses: ["QUOTE_COLLECTION"] },
  {
    title: "AI Analysis",
    statuses: ["AI_ANALYSIS_SUCCESS", "AI_ANALYSIS_FAILED"],
  },
  {
    title: "Finance Approval",
    statuses: ["PENDING_FINANCE_APPROVAL", "PENDING_CFO_APPROVAL"],
  },
  {
    title: "CFO Approval",
    statuses: ["PENDING_CFO_APPROVAL", "CFO_APPROVED"],
  },
  { title: "Vendor Received", statuses: ["RECEIVED_BY_VENDOR"] },
];

export function PurchaseRequestProgressTable({
  organizationId,
  role,
}: {
  organizationId: string;
  role: string;
}) {
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = usePurchaseRequestsQuery(organizationId);
  const [transition, { isLoading: isTransitioning }] =
    useTransitionPurchaseRequestMutation();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string>();
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest>();
  const [copiedRequestId, setCopiedRequestId] = useState<string>();
  const requests = response?.data ?? [];

  async function copyRequestId(requestId: string) {
    try {
      await navigator.clipboard.writeText(requestId);
      setCopiedRequestId(requestId);
      window.setTimeout(() => {
        setCopiedRequestId((current) => current === requestId ? undefined : current);
      }, 1800);
    } catch {
      setFeedback("Could not copy the purchase request ID. Please copy it from the details dialog.");
    }
  }

  async function performAction(
    request: PurchaseRequest,
    type: PurchaseRequestAction,
  ) {
    const currentLog = request.logs[request.logs.length - 1];
    if (!currentLog) {
      setFeedback("This request has no workflow log to update.");
      return;
    }
    setFeedback(undefined);
    try {
      await transition({
        purchaseRequestId: request.id,
        purchaseRequestLogId: currentLog.id,
        organizationId,
        type,
        note: notes[request.id]?.trim() || undefined,
      }).unwrap();
      setNotes((current) => ({ ...current, [request.id]: "" }));
      setFeedback(`Workflow updated for “${request.title}”.`);
    } catch (caught) {
      setFeedback(getErrorMessage(caught));
    }
  }

  return (
    <section
      id="request-progress"
      className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
    >
      <p className="text-sm font-semibold text-[#168778]">
        ORGANIZATION WORKFLOW
      </p>
      <h2 className="mt-2 text-xl font-semibold">Purchase request progress</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Follow each request through review, procurement, analysis, and delivery.
      </p>

      {feedback && (
        <p
          className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
          role="status"
        >
          {feedback}
        </p>
      )}
      {isLoading ? (
        <p className="mt-6 text-sm text-slate-500">
          Loading purchase requests…
        </p>
      ) : error ? (
        <div
          className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          We couldn’t load purchase requests.{" "}
          <button className="font-semibold underline" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : requests.length === 0 ? (
        <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          No purchase requests have been submitted yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[1500px] border-collapse text-left text-sm">
            <caption className="sr-only">
              Purchase requests by workflow stage
            </caption>
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="sticky left-0 z-10 min-w-64 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  Request
                </th>
                {workflowStages.map((stage) => (
                  <th
                    className="min-w-48 border-b border-slate-200 px-4 py-3"
                    key={stage.title}
                  >
                    {stage.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((request) => (
                <tr className="align-top" key={request.id}>
                  <th className="sticky left-0 z-[1] min-w-64 bg-white px-4 py-4 text-left font-normal">
                    <p className="font-semibold text-slate-900">
                      {request.title}
                    </p>
                    <Button
                      className="mt-2"
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => void copyRequestId(request.id)}
                      aria-label={`Copy ID for ${request.title}`}
                    >
                      {copiedRequestId === request.id ? (
                        <Check data-icon="inline-start" />
                      ) : (
                        <Copy data-icon="inline-start" />
                      )}
                      {copiedRequestId === request.id ? "Copied" : "Copy ID"}
                    </Button>
                    <Button
                      className="mt-3"
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye data-icon="inline-start" />
                      View details
                    </Button>
                    <p className="mt-1 text-xs text-slate-500">
                      {request.requester.name} · {request.quantity} item
                      {request.quantity === 1 ? "" : "s"}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-600">
                      {request.budget === null
                        ? "No budget set"
                        : `${request.currency} ${Number(request.budget).toLocaleString()}`}
                    </p>
                  </th>
                  {workflowStages.map((stage, stageIndex) => (
                    <td className="px-4 py-4" key={stage.title}>
                      <StageCell
                        request={request}
                        stage={stage}
                        stageIndex={stageIndex}
                        role={role}
                        note={notes[request.id] ?? ""}
                        isTransitioning={isTransitioning}
                        onNoteChange={(value) =>
                          setNotes((current) => ({
                            ...current,
                            [request.id]: value,
                          }))
                        }
                        onAction={performAction}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={Boolean(selectedRequest)}
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(undefined);
        }}
      >
        {selectedRequest && (
          <DialogContent
            className="max-h-[85vh] max-w-5xl grid-rows-[auto_1fr] overflow-
         y-auto"
          >
            <DialogHeader>
              <DialogTitle>{selectedRequest.title}</DialogTitle>
              <DialogDescription className="break-all font-mono text-xs">
                Purchase request ID: {selectedRequest.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 overflow-y-auto pr-1">
              <section>
                <h3 className="text-sm font-semibold text-slate-900">
                  Request information
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedRequest.description}
                </p>
                <dl className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  <DetailField
                    label="Requester"
                    value={selectedRequest.requester.name}
                  />
                  <DetailField
                    label="Email"
                    value={selectedRequest.requester.email}
                  />
                  <DetailField
                    label="Current status"
                    value={
                      selectedRequest.status
                        ? (statusLabels[selectedRequest.status] ??
                          statusLabelsFallback(selectedRequest.status))
                        : "Unknown"
                    }
                  />
                  <DetailField
                    label="Submitted"
                    value={formatDateTime(selectedRequest.createdAt)}
                  />
                  <DetailField
                    label="Budget"
                    value={
                      selectedRequest.budget === null
                        ? "No budget set"
                        : `${selectedRequest.currency} ${Number(selectedRequest.budget).toLocaleString()}`
                    }
                  />
                  <DetailField
                    label="Required by"
                    value={
                      selectedRequest.requiredBy
                        ? formatDate(selectedRequest.requiredBy)
                        : "Not specified"
                    }
                  />
                </dl>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900">
                  Requested items ({selectedRequest.items.length})
                </h3>
                <div className="mt-3 space-y-3">
                  {selectedRequest.items.map((item, index) => (
                    <article
                      className="rounded-xl border border-slate-200 p-4"
                      key={item.id || `${item.name}-${index}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4 className="font-medium text-slate-900">
                          {item.name}
                        </h4>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          Quantity: {item.quantity}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-2 text-sm leading-5 text-slate-600">
                          {item.description}
                        </p>
                      )}
                      {item.specifications != null && (
                        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                          {JSON.stringify(item.specifications, null, 2)}
                        </pre>
                      )}
                    </article>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900">
                  Workflow history
                </h3>
                {selectedRequest.logs.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    No workflow activity has been recorded.
                  </p>
                ) : (
                  <ol className="mt-3 space-y-4 border-l border-slate-200 pl-4">
                    {selectedRequest.logs.map((log) => (
                      <li className="relative" key={log.id}>
                        <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#168778] ring-4 ring-white" />
                        <p className="text-sm font-medium text-slate-900">
                          {statusLabels[log.status] ??
                            statusLabelsFallback(log.status)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(log.createdAt)} ·{" "}
                          {log.performedByName ?? log.performedBy}
                        </p>
                        {log.note && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-slate-600">
                            {log.note}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-slate-800">{value}</dd>
    </div>
  );
}

function StageCell({
  request,
  stage,
  stageIndex,
  role,
  note,
  isTransitioning,
  onNoteChange,
  onAction,
}: {
  request: PurchaseRequest;
  stage: WorkflowStage;
  stageIndex: number;
  role: string;
  note: string;
  isTransitioning: boolean;
  onNoteChange: (value: string) => void;
  onAction: (request: PurchaseRequest, type: PurchaseRequestAction) => void;
}) {
  const stageLogs = request.logs.filter((log) => {
    if (log.status === "REJECTED") {
      const rejectStageByRole: Record<string, number> = {
        MANAGER: 1,
        FINANCE_OFFICER: 4,
        CFO: 5,
      };
      return rejectStageByRole[log.performedByRole ?? ""] === stageIndex;
    }
    return stage.statuses.includes(log.status);
  });
  const stageLog = stageLogs[stageLogs.length - 1];
  const isPendingManager = request.status === "PENDING_MANAGER_APPROVAL";
  const isManagerAction =
    stageIndex === 1 && role === "MANAGER" && isPendingManager;
  const isQuoteAction =
    stageIndex === 2 &&
    role === "PROCUREMENT_OFFICER" &&
    request.status === "REQUEST_APPROVED";
  const isFinanceAction =
    stageIndex === 4 &&
    role === "FINANCE_OFFICER" &&
    request.status === "PENDING_FINANCE_APPROVAL";
  const isCfoAction =
    stageIndex === 5 &&
    role === "CFO" &&
    request.status === "PENDING_CFO_APPROVAL";
  const isReceivedAction =
    stageIndex === 6 &&
    role === "PROCUREMENT_OFFICER" &&
    request.status === "CFO_APPROVED";
  const canAct =
    isManagerAction ||
    isQuoteAction ||
    isFinanceAction ||
    isCfoAction ||
    isReceivedAction;

  return (
    <div className="min-h-20">
      {stageLog ? (
        <StageActivity log={stageLog} stageIndex={stageIndex} />
      ) : (
        <p className="text-xs text-slate-400">
          {stageIndex === 0 ? "Request not sent" : "Waiting"}
        </p>
      )}
      {canAct && (
        <div className="mt-3 space-y-2">
          <label className="block">
            <span className="sr-only">Comment for {stage.title}</span>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs placeholder:text-slate-400"
              rows={2}
              maxLength={2000}
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Add a comment (optional)"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {isManagerAction || isFinanceAction || isCfoAction ? (
              <>
                <button
                  className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
                  disabled={isTransitioning}
                  onClick={() => onAction(request, "reject")}
                >
                  Reject
                </button>
                <button
                  className="rounded-md bg-[#168778] px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  disabled={isTransitioning}
                  onClick={() => onAction(request, "approve")}
                >
                  Approve
                </button>
              </>
            ) : isQuoteAction ? (
              <button
                className="rounded-md bg-[#168778] px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                disabled={isTransitioning}
                onClick={() => onAction(request, "quote")}
              >
                Start quote collection
              </button>
            ) : (
              <button
                className="rounded-md bg-[#168778] px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                disabled={isTransitioning}
                onClick={() => onAction(request, "received")}
              >
                Confirm vendor received
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: PurchaseRequestStatus) {
  if (status.includes("REJECTED") || status.includes("FAILED")) {
    return "text-red-700 bg-red-50 border-red-200";
  }
  if (status.includes("PENDING") || status === "QUOTE_COLLECTION") {
    return "text-amber-700 bg-amber-50 border-amber-200";
  }
  if (
    status.includes("APPROVED") ||
    status.includes("SUCCESS") ||
    status === "RECEIVED_BY_VENDOR"
  ) {
    return "text-emerald-700 bg-emerald-50 border-emerald-200";
  }
  return "text-slate-700 bg-slate-50 border-slate-200";
}

function StageActivity({
  log,
  stageIndex,
}: {
  log: PurchaseRequestLog;
  stageIndex: number;
}) {
  let label = statusLabels[log.status] ?? statusLabelsFallback(log.status);
  if (stageIndex === 4 && log.status === "PENDING_CFO_APPROVAL") {
    label = "Finance approved";
  }
  if (stageIndex === 5 && log.status === "PENDING_CFO_APPROVAL") {
    label = "Awaiting CFO approval";
  }

  return (
    <div>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${getStatusColor(log.status)}`}
      >
        {label}
      </span>
      <p className="mt-2 text-xs text-slate-500">
        {formatDateTime(log.createdAt)}
      </p>
      <p className="mt-1 text-[11px] text-slate-400">
        By {log.performedByName ?? log.performedBy}
      </p>
      {log.note && (
        <p className="mt-2 text-xs leading-5 text-slate-600">{log.note}</p>
      )}
    </div>
  );
}

const statusLabels: Partial<Record<PurchaseRequestStatus, string>> = {
  PENDING_MANAGER_APPROVAL: "Request sent",
  REQUEST_APPROVED: "Approved",
  QUOTE_COLLECTION: "Quote collection started",
  AI_ANALYSIS_SUCCESS: "Analysis complete",
  AI_ANALYSIS_FAILED: "Analysis failed",
  PENDING_FINANCE_APPROVAL: "Finance approval pending",
  PENDING_CFO_APPROVAL: "CFO approval pending",
  CFO_APPROVED: "Approved",
  RECEIVED_BY_VENDOR: "Received by vendor",
  REJECTED: "Rejected",
};

function statusLabelsFallback(status: PurchaseRequestStatus) {
  return status.replaceAll("_", " ").toLowerCase();
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const message = (error as { data?: { message?: string | string[] } }).data
      ?.message;
    return Array.isArray(message)
      ? message[0]
      : message || "Could not update the request workflow.";
  }
  return "Could not update the request workflow.";
}
