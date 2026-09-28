"use client";

import { useState } from "react";
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
  const { data: response, isLoading, error, refetch } =
    usePurchaseRequestsQuery(organizationId);
  const [transition, { isLoading: isTransitioning }] =
    useTransitionPurchaseRequestMutation();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string>();
  const requests = response?.data ?? [];

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
      <p className="text-sm font-semibold text-[#168778]">ORGANIZATION WORKFLOW</p>
      <h2 className="mt-2 text-xl font-semibold">Purchase request progress</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Follow each request through review, procurement, analysis, and delivery.
      </p>

      {feedback && (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700" role="status">
          {feedback}
        </p>
      )}
      {isLoading ? (
        <p className="mt-6 text-sm text-slate-500">Loading purchase requests…</p>
      ) : error ? (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">
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
                    <p className="font-semibold text-slate-900">{request.title}</p>
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
    </section>
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
  const isManagerAction = stageIndex === 1 && role === "MANAGER" && isPendingManager;
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
    isManagerAction || isQuoteAction || isFinanceAction || isCfoAction || isReceivedAction;

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
      <p
        className={`font-medium ${log.status === "REJECTED" || log.status === "AI_ANALYSIS_FAILED" ? "text-red-700" : "text-emerald-800"}`}
      >
        {label}
      </p>
      <p className="mt-1 text-xs text-slate-500">{formatDateTime(log.createdAt)}</p>
      <p className="mt-1 text-[11px] text-slate-400">
        By {log.performedByName ?? log.performedBy}
      </p>
      {log.note && <p className="mt-2 text-xs leading-5 text-slate-600">{log.note}</p>}
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

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const message = (error as { data?: { message?: string | string[] } }).data?.message;
    return Array.isArray(message) ? message[0] : message || "Could not update the request workflow.";
  }
  return "Could not update the request workflow.";
}
