import { baseApi } from "@/lib/api/base-api";

export type PurchaseRequestStatus =
  | "PENDING_MANAGER_APPROVAL"
  | "REQUEST_APPROVED"
  | "QUOTE_COLLECTION"
  | "AI_ANALYSIS_SUCCESS"
  | "AI_ANALYSIS_FAILED"
  | "PENDING_FINANCE_APPROVAL"
  | "PENDING_CFO_APPROVAL"
  | "CFO_APPROVED"
  | "RECEIVED_BY_VENDOR"
  | "REJECTED";

export type PurchaseRequestAction = "approve" | "reject" | "quote" | "received";

export interface PurchaseRequestLog {
  id: string;
  status: PurchaseRequestStatus;
  performedBy: string;
  performedByName?: string;
  performedByRole?: string;
  createdAt: string;
  note: string | null;
}

export interface PurchaseRequestItemInput {
  name: string;
  description?: string;
  quantity: number;
}

export interface PurchaseRequestItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  specifications?: unknown;
}

export interface CreatePurchaseRequestInput {
  title: string;
  description: string;
  budget?: string;
  currency?: "BDT";
  requiredBy?: string;
  items: PurchaseRequestItemInput[];
}

export interface PurchaseRequest {
  id: string;
  title: string;
  description: string;
  budget: string | number | null;
  currency: string;
  requiredBy: string | null;
  status: PurchaseRequestStatus | null;
  createdAt: string;
  quantity: number;
  requester: { id: string; name: string; email: string };
  items: PurchaseRequestItem[];
  logs: PurchaseRequestLog[];
}

export interface PurchaseRequestListResponse {
  data: PurchaseRequest[];
}

export interface PurchaseRequestAnalysis {
  id: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  selectedQuoteIds: unknown;
  recommendation: unknown;
  hardRuleResults: unknown;
  recommendedQuoteId: string | null;
  failureReason: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
}

export interface PurchaseRequestAnalysisListResponse {
  purchaseRequest: { id: string; title: string };
  data: PurchaseRequestAnalysis[];
}

export const purchaseRequestApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createPurchaseRequest: builder.mutation<
      PurchaseRequest,
      CreatePurchaseRequestInput
    >({
      query: (body) => ({ url: "/purchase-requests", method: "POST", body }),
      invalidatesTags: ["PurchaseRequest"],
    }),
    purchaseRequests: builder.query<PurchaseRequestListResponse, string>({
      query: (organizationId) =>
        `/purchase-requests?organizationId=${encodeURIComponent(organizationId)}`,
      providesTags: ["PurchaseRequest"],
    }),
    purchaseRequestAnalyses: builder.query<PurchaseRequestAnalysisListResponse, string>({
      query: (purchaseRequestId) =>
        `/purchase-requests/${encodeURIComponent(purchaseRequestId)}/analyses`,
    }),
    pendingQuoteCollection: builder.query<PurchaseRequest[], void>({
      query: () => "/purchase-requests/pending-quote-collection",
      providesTags: ["PurchaseRequest"],
    }),
    transitionPurchaseRequest: builder.mutation<
      PurchaseRequestLog,
      {
        purchaseRequestId: string;
        purchaseRequestLogId: string;
        organizationId: string;
        type: PurchaseRequestAction;
        note?: string;
      }
    >({
      query: ({ purchaseRequestId, purchaseRequestLogId, organizationId, type, note }) => ({
        url: `/purchase-request-logs/${purchaseRequestLogId}/approveAndReject`,
        method: "POST",
        body: { purchaseRequestId, organizationId, type, note },
      }),
      invalidatesTags: ["PurchaseRequest"],
    }),
    startQuoteCollection: builder.mutation<PurchaseRequestLog, {
      purchaseRequestId: string;
      purchaseRequestLogId: string;
      organizationId: string;
      note?: string;
    }>({
      query: ({ purchaseRequestId, purchaseRequestLogId, organizationId, note }) => ({
        url: `/purchase-request-logs/${purchaseRequestLogId}/approveAndReject`,
        method: "POST",
        body: { purchaseRequestId, organizationId, type: "quote", note },
      }),
      invalidatesTags: ["PurchaseRequest"],
    }),
    analyzeQuotes: builder.mutation<
      { purchaseRequestStatus: PurchaseRequestStatus; analysis: unknown },
      { id: string; quoteIds: string[] }
    >({
      query: ({ id, quoteIds }) => ({
        url: `/purchase-requests/${id}/analyze-quotes`,
        method: "POST",
        body: { quoteIds },
      }),
      invalidatesTags: ["PurchaseRequest"],
    }),
  }),
});

export const {
  useCreatePurchaseRequestMutation,
  usePurchaseRequestsQuery,
  useLazyPurchaseRequestAnalysesQuery,
  usePendingQuoteCollectionQuery,
  useTransitionPurchaseRequestMutation,
  useStartQuoteCollectionMutation,
  useAnalyzeQuotesMutation,
} = purchaseRequestApi;
