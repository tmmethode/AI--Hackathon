"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { getStoredAuth, login, persistAuth } from "@/lib/auth";

function resolveNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath === "/login") {
    return "/dashboard";
  }

  return nextPath;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextPath = resolveNextPath(searchParams.get("next"));

  useEffect(() => {
    if (getStoredAuth()?.token) {
      router.replace(nextPath);
    }
  }, [nextPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = await login({ email: email.trim(), password });
      persistAuth(session);
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7ebfe_0%,#eef5fb_38%,#f9fafb_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-8 lg:px-10 lg:py-10">
        <section className="flex w-full items-center justify-center">
          <Card className="w-full max-w-xl rounded-[32px] border border-line/80 bg-surface/90 p-8 shadow-soft backdrop-blur md:p-10">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-card">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Secure access</p>
                <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Welcome back</h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-ink-muted">
              Use your recruiter credentials to access dashboards, screening history, and shortlist workflows.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <Field label="Work email">
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="recruiter@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field>

              <Field
                label="Password"
                hint="Your password is verified against the backend auth service."
              >
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </Field>

              {error && (
                <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                fullWidth
                disabled={isSubmitting}
                rightIcon={
                  isSubmitting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )
                }
              >
                {isSubmitting ? "Signing you in" : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 rounded-3xl border border-brand/10 bg-brand-soft/40 p-4">
              <p className="text-sm font-semibold text-ink">Need access to the workspace?</p>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                Ask an admin to create your account first, then return here to sign in with the same email.
              </p>
            </div>

            <div className="mt-6 text-sm text-ink-muted">
              <p>Backend endpoint: `/auth/login` on `NEXT_PUBLIC_API_URL`.</p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
