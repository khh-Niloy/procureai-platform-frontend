import { baseApi } from "@/lib/api/base-api";

export type PurchaseRequestStatus =
  | "PENDING_MANAGER_APPROVAL"
  | "INITIAL_APPROVED"
  | "QUOTE_COLLECTION"
  | "AI_ANALYSIS_SUCCESS"
  | "AI_ANALYSIS_FAILED"
  | "PENDING_FINANCE_APPROVAL"
  | "PENDING_CFO_APPROVAL"
  | "CFO_APPROVED"
  | "PURCHASED"
  | "REJECTED";

export interface PurchaseRequestItemInput {
  name: string;
  description?: string;
  quantity: number;
}

export interface CreatePurchaseRequestInput {
  title: string;
  description: string;
  budget?: string;
  currency?: "USD" | "EUR" | "GBP" | "BDT";
  requiredBy?: string;
  items: PurchaseRequestItemInput[];
}

export interface PurchaseRequest {
  id: string;
  title: string;
  description: string;
  budget: string | null;
  currency: string;
  requiredBy: string | null;
  status: PurchaseRequestStatus;
  createdAt: string;
  requester: { id: string; name: string; email: string };
  items: PurchaseRequestItemInput[];
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
    purchaseRequests: builder.query<PurchaseRequest[], void>({
      query: () => "/purchase-requests",
      providesTags: ["PurchaseRequest"],
    }),
    pendingInitialApprovals: builder.query<PurchaseRequest[], void>({
      query: () => "/purchase-requests/pending-initial-approval",
      providesTags: ["PurchaseRequest"],
    }),
    pendingQuoteCollection: builder.query<PurchaseRequest[], void>({
      query: () => "/purchase-requests/pending-quote-collection",
      providesTags: ["PurchaseRequest"],
    }),
    decideInitialApproval: builder.mutation<
      PurchaseRequest,
      { id: string; status: "INITIAL_APPROVED" | "REJECTED"; comment?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/purchase-requests/${id}/initial-approval`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PurchaseRequest"],
    }),
    startQuoteCollection: builder.mutation<PurchaseRequest, string>({
      query: (id) => ({
        url: `/purchase-requests/${id}/start-quote-collection`,
        method: "POST",
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
  usePendingInitialApprovalsQuery,
  usePendingQuoteCollectionQuery,
  useDecideInitialApprovalMutation,
  useStartQuoteCollectionMutation,
  useAnalyzeQuotesMutation,
} = purchaseRequestApi;
