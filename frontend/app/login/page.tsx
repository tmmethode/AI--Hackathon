import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login | Umurava Screening",
  description: "Sign in to access the Umurava Screening recruiter workspace.",
};

export const dynamic = "force-dynamic";

type LoginSearchParams = Promise<{
  next?: string | string[];
  error?: string | string[];
}>;

export default async function LoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  const resolved = await searchParams;
  const nextPathParam = Array.isArray(resolved.next) ? resolved.next[0] : resolved.next;
  const serverErrorParam = Array.isArray(resolved.error) ? resolved.error[0] : resolved.error;

  return <LoginForm nextPathParam={nextPathParam ?? null} serverErrorParam={serverErrorParam ?? null} />;
}
