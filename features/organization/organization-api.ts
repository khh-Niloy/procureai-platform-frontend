import { baseApi } from "@/lib/api/base-api";
import type { UserRole } from "@/lib/auth/types";

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  updatedAt: string;
}

export interface InvitePersonInput {
  email: string;
  role: UserRole;
}

export const organizationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    organizationUsers: builder.query<OrganizationMember[], void>({
      query: () => "/organization/users",
      providesTags: ["OrganizationUsers"],
    }),
    invitePeople: builder.mutation<{ message: string }, InvitePersonInput[]>({
      query: (body) => ({
        url: "/organization/invite",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useInvitePeopleMutation, useOrganizationUsersQuery } = organizationApi;
