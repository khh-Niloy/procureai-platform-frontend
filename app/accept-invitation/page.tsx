import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function AcceptInvitationPage() {
  return <Suspense fallback={null}><AuthForm mode="invite" /></Suspense>;
}
