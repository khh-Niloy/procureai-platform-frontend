import { baseApi } from "@/lib/api/base-api";

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  isActive: boolean;
}

export interface VendorDocument {
  quoteId: string | null;
  organizationId: string;
  vendorId: string | null;
  fileName: string;
}

export interface VendorQuoteRequest {
  id: string;
  vendorQuoteRequest: "PENDING" | "QOUTE_SUBMITTED";
  createdAt: string;
  purchaseRequest: {
    id: string;
    title: string;
    description: string;
    budget: string | null;
    currency: string;
    requiredBy: string | null;
    status: string;
    items: { id: string; name: string; description: string | null; quantity: number }[];
    organization: { id: string; name: string };
  };
}

export const vendorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    vendors: builder.query<Vendor[], void>({
      query: () => "/vendors",
      providesTags: ["Vendor"],
    }),
    vendorQuoteRequests: builder.query<VendorQuoteRequest[], void>({
      query: () => "/vendors/quote-requests",
    }),
    vendorDocuments: builder.query<VendorDocument[], string>({
      query: (vendorId) => ({
        url: "/documents",
        params: { vendorId },
      }),
      providesTags: (_result, _error, vendorId) => [{ type: "Document", id: vendorId }],
    }),
  }),
});

export const {
  useVendorsQuery,
  useLazyVendorDocumentsQuery,
  useVendorQuoteRequestsQuery,
} = vendorApi;
