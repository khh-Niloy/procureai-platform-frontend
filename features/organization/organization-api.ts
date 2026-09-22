import { baseApi } from "@/lib/api/base-api";
import type { UserRole } from "@/lib/auth/types";

export interface InvitePersonInput {
  email: string;
  role: UserRole;
}

export const organizationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    invitePeople: builder.mutation<{ message: string }, InvitePersonInput[]>({
      query: (body) => ({
        url: "/organization/invite",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useInvitePeopleMutation } = organizationApi;
