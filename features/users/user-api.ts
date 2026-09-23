import { baseApi } from "@/lib/api/base-api";
import type { User, UserRole } from "@/lib/auth/types";

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    userById: builder.query<User, string>({
      query: (id) => `/user/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),
    updateUser: builder.mutation<User, { id: string; body: UpdateUserInput }>({
      query: ({ id, body }) => ({
        url: `/user/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "User",
        "OrganizationUsers",
        { type: "User", id },
      ],
    }),
  }),
});

export const { useLazyUserByIdQuery, useUpdateUserMutation } = userApi;
