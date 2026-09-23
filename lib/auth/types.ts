export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "TEAM_LEADER"
  | "PROCUREMENT_OFFICER"
  | "FINANCE_OFFICER"
  | "CFO"
  | "VENDOR";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
  updatedAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
  organizationName: string;
}

export interface RegisterInvitedInput extends LoginInput {
  name: string;
}
