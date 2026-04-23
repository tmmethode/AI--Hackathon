"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { getGoogleLoginUrl, getStoredAuth, login, persistAuth, resolveSafeNextPath } from "@/lib/auth";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.4 3.62v3.01h3.88c2.27-2.09 3.56-5.18 3.56-8.66Z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.05 1.15-3.11 0-5.74-2.1-6.68-4.93H1.31v3.1A12 12 0 0 0 12 24Z"
        fill="#34A853"
      />
      <path
        d="M5.32 14.3A7.2 7.2 0 0 1 4.95 12c0-.8.14-1.58.37-2.3V6.6H1.31A12 12 0 0 0 0 12c0 1.94.46 3.78 1.31 5.4l4.01-3.1Z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.77c1.76 0 3.34.6 4.58 1.78l3.44-3.44C17.94 1.18 15.23 0 12 0A12 12 0 0 0 1.31 6.6l4.01 3.1C6.26 6.87 8.89 4.77 12 4.77Z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface LoginFormProps {
  nextPathParam?: string | null;
  serverErrorParam?: string | null;
}

export function LoginForm({ nextPathParam, serverErrorParam }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(serverErrorParam ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
  const nextPath = resolveSafeNextPath(nextPathParam);
  const serverError = serverErrorParam ?? "";

  useEffect(() => {
    if (!serverError && getStoredAuth()?.token) {
      router.replace(nextPath);
    }
  }, [nextPath, router, serverError]);

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

  function handleGoogleSignIn() {
    setError("");
    setIsGoogleRedirecting(true);
    window.location.assign(getGoogleLoginUrl(nextPath));
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7ebfe_0%,#eef5fb_36%,#f9fafb_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Card className="w-full max-w-md rounded-3xl border border-line/80 bg-surface/95 p-5 shadow-soft backdrop-blur sm:p-6">
          <header className="flex items-center gap-2.5 sm:gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-card sm:h-11 sm:w-11">
              <ShieldCheck className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand sm:text-xs">Secure access</p>
              <h1 className="mt-0.5 truncate font-display text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Welcome back</h1>
            </div>
          </header>

          <p className="mt-3.5 text-sm leading-5 text-ink-muted">
            Sign in with your recruiter account to access dashboards, screening history, and shortlist workflows.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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

            <Field label="Password" hint="Your password is verified against the backend auth service.">
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
              <div className="rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-2.5 text-sm text-danger" role="alert" aria-live="polite">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              fullWidth
              className="mt-1"
              disabled={isSubmitting || isGoogleRedirecting}
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

          <div className="mt-5">
            <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.16em] text-ink-muted/80 sm:text-xs sm:tracking-[0.18em]">
              <span className="h-px flex-1 bg-line" />
              <span>Or continue with</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <Button
              type="button"
              size="lg"
              variant="secondary"
              fullWidth
              className="mt-3"
              disabled={isSubmitting || isGoogleRedirecting}
              leftIcon={
                isGoogleRedirecting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )
              }
              onClick={handleGoogleSignIn}
            >
              {isGoogleRedirecting ? "Redirecting to Google" : "Continue with Google"}
            </Button>
          </div>

          <aside className="mt-5 rounded-2xl border border-brand/10 bg-brand-soft/40 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Need access to the workspace?</p>
            <p className="mt-1 text-sm leading-5 text-ink-muted">
              Ask an admin to create your account first, then return here to sign in with the same email.
            </p>
          </aside>
        </Card>
      </div>
    </main>
  );
}
