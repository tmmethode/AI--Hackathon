import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login | Umurava Screening",
  description: "Sign in to access the Umurava Screening recruiter workspace.",
};

export default function LoginPage() {
  return <LoginForm />;
}
