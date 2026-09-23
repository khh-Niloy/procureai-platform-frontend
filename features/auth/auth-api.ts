import { baseApi } from "@/lib/api/base-api";
import type {
  LoginInput,
  RegisterInput,
  RegisterInvitedInput,
  User,
} from "@/lib/auth/types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<User, LoginInput>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    register: builder.mutation<User, RegisterInput>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    registerInvited: builder.mutation<
      User,
      { token: string; body: RegisterInvitedInput }
    >({
      query: ({ token, body }) => ({
        url: `/auth/register-invited?token=${encodeURIComponent(token)}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    profile: builder.query<User, void>({
      query: () => "/user/profile",
      providesTags: ["User"],
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["User"],
    }),
    refresh: builder.mutation<{ message: string }, void>({
      query: () => ({ url: "/auth/refresh", method: "POST" }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRegisterInvitedMutation,
  useProfileQuery,
  useLogoutMutation,
  useRefreshMutation,
} = authApi;
