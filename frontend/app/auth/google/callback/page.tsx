"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { parseGoogleCallbackSession, persistAuth, resolveSafeNextPath } from "@/lib/auth";

function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => resolveSafeNextPath(searchParams.get("next")), [searchParams]);
  const sessionResult = useMemo(() => {
    try {
      return {
        session: parseGoogleCallbackSession(searchParams.get("token"), searchParams.get("user")),
        error: "",
      };
    } catch (err) {
      return {
        session: null,
        error: err instanceof Error ? err.message : "Google login failed. Please try again.",
      };
    }
  }, [searchParams]);

  useEffect(() => {
    if (!sessionResult.session) {
      return;
    }

    persistAuth(sessionResult.session);
    router.replace(nextPath);
  }, [nextPath, router, sessionResult]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7ebfe_0%,#eef5fb_38%,#f9fafb_100%)]">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-8">
        <Card className="w-full max-w-lg rounded-[32px] border border-line/80 bg-surface/90 p-8 text-center shadow-soft backdrop-blur md:p-10">
          {sessionResult.error ? (
            <>
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Google sign-in failed</h1>
              <p className="mt-4 text-sm leading-6 text-ink-muted">{sessionResult.error}</p>
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="mt-6 inline-flex items-center justify-center rounded-md bg-brand px-5 py-3 text-sm text-white shadow-card transition-colors hover:bg-brand-hover"
              >
                Return to login
              </Link>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-card">
                <LoaderCircle className="h-6 w-6 animate-spin" />
              </div>
              <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink">Finishing Google sign-in</h1>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                We&apos;re securing your session and sending you to the workspace.
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7ebfe_0%,#eef5fb_38%,#f9fafb_100%)]">
          <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-8">
            <Card className="w-full max-w-lg rounded-[32px] border border-line/80 bg-surface/90 p-8 text-center shadow-soft backdrop-blur md:p-10">
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Loading sign-in details</h1>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                Please wait while we prepare your Google sign-in callback.
              </p>
            </Card>
          </div>
        </div>
      }
    >
      <GoogleCallbackInner />
    </Suspense>
  );
}
