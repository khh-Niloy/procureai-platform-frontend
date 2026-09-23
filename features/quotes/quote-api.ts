import { baseApi } from "@/lib/api/base-api";

export interface CreateQuoteItemInput {
  productName: string;
  description?: string;
  quantity: string;
  unit?: string;
  unitPrice: string;
  totalPrice: string;
}

export interface CreateQuoteInput {
  userId: string;
  vendorId?: string;
  purchaseRequestId: string;
  subtotal?: string;
  discount?: string;
  tax?: string;
  shippingCost?: string;
  totalAmount: string;
  currency: "USD" | "EUR" | "GBP" | "BDT";
  deliveryDays?: number;
  deliveryTerms?: string;
  paymentTerms?: string;
  warrantyMonths?: number;
  validityDays?: number;
  notes?: string;
  items: CreateQuoteItemInput[];
}

export interface CreatedQuote {
  id: string;
  document: { id: string; status: string; fileName: string };
}

export interface VendorQuote {
  id: string;
  totalAmount: string;
  currency: string;
  submittedAt: string;
  purchaseRequest: { id: string; title: string } | null;
  items: {
    id: string;
    productName: string;
    description: string | null;
    quantity: string;
    unit: string | null;
    unitPrice: string;
    totalPrice: string;
  }[];
  documents: {
    id: string;
    fileName: string;
    status: "PROCESSING" | "DONE" | "FAILED";
    failureReason: string | null;
  }[];
}

export interface QuoteDownloadUrl {
  fileName: string;
  url: string;
}

export const quoteApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    vendorQuotes: builder.query<VendorQuote[], void>({
      query: () => "/quotes/mine",
      providesTags: ["Document"],
    }),
    quoteDownloadUrl: builder.query<QuoteDownloadUrl, string>({
      query: (quoteId) => `/quotes/${quoteId}/document/download-url`,
    }),
    createQuote: builder.mutation<CreatedQuote, CreateQuoteInput>({
      query: (body) => ({ url: "/quotes", method: "POST", body }),
      invalidatesTags: ["PurchaseRequest", "Document"],
    }),
  }),
});

export const {
  useCreateQuoteMutation,
  useVendorQuotesQuery,
  useLazyQuoteDownloadUrlQuery,
} = quoteApi;
