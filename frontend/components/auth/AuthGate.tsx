"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { Activity } from "lucide-react";
import { getStoredAuth } from "@/lib/auth";

function buildNextPath(pathname: string, searchParams: ReadonlyURLSearchParams) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getStoredAuth();

    if (!session?.token) {
      const nextPath = buildNextPath(pathname || "/dashboard", searchParams);
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    setReady(true);
  }, [pathname, router, searchParams]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#d7ebfe_0%,#eff5fb_40%,#f9fafb_100%)] px-6">
        <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Checking your session</p>
            <p className="text-xs text-ink-muted">Taking you to the right place now.</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
