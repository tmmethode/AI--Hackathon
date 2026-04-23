import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login | Umurava Screening",
  description: "Sign in to access the Umurava Screening recruiter workspace.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7ebfe_0%,#eef5fb_36%,#f9fafb_100%)]">
          <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="w-full max-w-md rounded-3xl border border-line/80 bg-surface/95 p-6 shadow-soft backdrop-blur">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Loading login</h1>
              <p className="mt-3 text-sm text-ink-muted">
                Preparing the sign-in form. If this takes too long, refresh the page.
              </p>
            </div>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
