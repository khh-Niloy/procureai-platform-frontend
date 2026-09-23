import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000",
  credentials: "include",
});

let refreshRequest: Promise<boolean> | undefined;

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401 || isAuthRequest(args)) {
    return result;
  }

  // A single shared refresh prevents a burst of expired requests from rotating
  // the refresh cookie multiple times and invalidating one another.
  refreshRequest ??= (async () => {
    const refreshResult = await rawBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions,
    );
    return !refreshResult.error;
  })();

  const refreshed = await refreshRequest;
  refreshRequest = undefined;

  if (refreshed) {
    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};

function isAuthRequest(args: string | FetchArgs) {
  const url = typeof args === "string" ? args : args.url;
  return url.startsWith("/auth/");
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "PurchaseRequest", "OrganizationUsers", "Vendor", "Document"],
  endpoints: () => ({}),
});
