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
  id: string;
  quoteId: string | null;
  fileName: string;
  url: string | null;
  status: "PROCESSING" | "DONE" | "FAILED";
  failureReason: string | null;
}

export interface VendorRequest {
  id: string;
  title: string;
  description: string;
  budget: string | null;
  currency: string;
  requiredBy: string | null;
  createdAt: string;
  isSubmitted: boolean;
  items: { id: string; name: string; description: string | null; quantity: number }[];
}

export const vendorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    vendors: builder.query<Vendor[], void>({
      query: () => "/vendors",
      providesTags: ["Vendor"],
    }),
    vendorRequests: builder.query<{ data: VendorRequest[] }, void>({
      query: () => "/vendors/requests",
      providesTags: ["VendorRequest"],
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
  useVendorRequestsQuery,
} = vendorApi;
