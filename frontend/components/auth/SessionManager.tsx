"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { AUTH_SYNC_EVENT, clearStoredAuth, getStoredAuth, refreshAuthToken } from "@/lib/auth";
import {
  AUTH_RUNTIME_STORAGE_KEY,
  getAuthRuntimeState,
  persistAuthRuntimeState,
  SESSION_ABSOLUTE_LIFETIME_MS,
  SESSION_ACTIVITY_WRITE_THROTTLE_MS,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_WARNING_BEFORE_EXPIRY_MS,
} from "@/lib/auth-session";

const AUTH_WARNING_EVENT = "umurava-auth-warning";

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function safeGetAuthRuntimeState() {
  if (typeof getAuthRuntimeState !== "function") {
    return null;
  }

  return getAuthRuntimeState();
}

export function SessionManager() {
  const router = useRouter();
  const pathname = usePathname();
  const [now, setNow] = useState(() => Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastActivityWriteRef = useRef(0);
  const refreshInFlightRef = useRef<Promise<void> | null>(null);

  const session = getStoredAuth();
  const runtime = safeGetAuthRuntimeState();

  const timing = useMemo(() => {
    if (!session || !runtime) {
      return null;
    }

    const idleExpiresAt = runtime.lastActivityAt + SESSION_IDLE_TIMEOUT_MS;
    const absoluteExpiresAt = runtime.sessionStartedAt + SESSION_ABSOLUTE_LIFETIME_MS;
    const expiresAt = Math.min(idleExpiresAt, absoluteExpiresAt);

    return {
      idleRemainingMs: idleExpiresAt - now,
      absoluteRemainingMs: absoluteExpiresAt - now,
      remainingMs: expiresAt - now,
      warnActive:
        expiresAt - now <= SESSION_WARNING_BEFORE_EXPIRY_MS &&
        (!runtime.warningDismissedAt || runtime.warningDismissedAt < runtime.lastActivityAt),
    };
  }, [now, runtime, session]);

  const performLogout = useCallback(
    (reason: "idle" | "absolute") => {
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(
            "umurava.logout-context",
            JSON.stringify({ reason, at: Date.now(), path: pathname || "/dashboard" })
          );
        } catch {
          // Ignore storage failures.
        }
      }

      clearStoredAuth();
      router.replace(`/login?reason=${encodeURIComponent(reason)}`);
    },
    [pathname, router]
  );

  const markActivity = useCallback(() => {
    const activeSession = getStoredAuth();
    if (!activeSession) {
      return;
    }

    const current = safeGetAuthRuntimeState();
    if (!current) {
      return;
    }

    const currentNow = Date.now();

    if (currentNow - lastActivityWriteRef.current < SESSION_ACTIVITY_WRITE_THROTTLE_MS) {
      return;
    }

    lastActivityWriteRef.current = currentNow;
    persistAuthRuntimeState({
      ...current,
      lastActivityAt: currentNow,
      warningDismissedAt: null,
    });

    try {
      window.dispatchEvent(new Event(AUTH_SYNC_EVENT));
    } catch {
      // Ignore dispatch failures.
    }
  }, []);

  const runTokenRefresh = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    refreshInFlightRef.current = (async () => {
      const current = safeGetAuthRuntimeState();
      if (!current) {
        return;
      }

      setIsRefreshing(true);
      try {
        await refreshAuthToken();
        persistAuthRuntimeState({
          ...current,
          lastRefreshAt: Date.now(),
          warningDismissedAt: null,
        });
      } finally {
        setIsRefreshing(false);
      }
    })().finally(() => {
      refreshInFlightRef.current = null;
    });

    return refreshInFlightRef.current;
  }, []);

  const dismissWarning = useCallback(() => {
    const current = safeGetAuthRuntimeState();
    if (!current) {
      return;
    }

    persistAuthRuntimeState({
      ...current,
      warningDismissedAt: Date.now(),
    });

    try {
      window.dispatchEvent(new Event(AUTH_WARNING_EVENT));
    } catch {
      // Ignore dispatch failures.
    }
  }, []);

  const continueSession = useCallback(async () => {
    markActivity();
    await runTokenRefresh();
  }, [markActivity, runTokenRefresh]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const timer = window.setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

      const currentRuntime = safeGetAuthRuntimeState();
      if (!currentRuntime) {
        return;
      }

      const idleExpiresAt = currentRuntime.lastActivityAt + SESSION_IDLE_TIMEOUT_MS;
      const absoluteExpiresAt = currentRuntime.sessionStartedAt + SESSION_ABSOLUTE_LIFETIME_MS;

      if (currentNow >= absoluteExpiresAt) {
        performLogout("absolute");
        return;
      }

      if (currentNow >= idleExpiresAt) {
        performLogout("idle");
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [performLogout, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const activityEvents: Array<keyof WindowEventMap> = ["click", "keydown", "mousemove", "scroll", "touchstart"];

    function handleVisibleActivity() {
      if (document.visibilityState === "visible") {
        markActivity();
      }
    }

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    window.addEventListener("focus", markActivity);
    document.addEventListener("visibilitychange", handleVisibleActivity);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
      window.removeEventListener("focus", markActivity);
      document.removeEventListener("visibilitychange", handleVisibleActivity);
    };
  }, [markActivity, session]);

  useEffect(() => {
    function syncAcrossTabs(event: StorageEvent) {
      if (event.key === AUTH_RUNTIME_STORAGE_KEY || event.key === "umurava.auth") {
        setNow(Date.now());
      }
    }

    function syncLocal() {
      setNow(Date.now());
    }

    window.addEventListener("storage", syncAcrossTabs);
    window.addEventListener(AUTH_SYNC_EVENT, syncLocal);
    window.addEventListener(AUTH_WARNING_EVENT, syncLocal);

    return () => {
      window.removeEventListener("storage", syncAcrossTabs);
      window.removeEventListener(AUTH_SYNC_EVENT, syncLocal);
      window.removeEventListener(AUTH_WARNING_EVENT, syncLocal);
    };
  }, []);

  useEffect(() => {
    if (!timing || !runtime || !session) {
      return;
    }

    const shouldRefreshSoon = timing.remainingMs <= 12 * 60 * 1000;
    const refreshStale = Date.now() - runtime.lastRefreshAt >= 10 * 60 * 1000;

    if (shouldRefreshSoon && refreshStale) {
      void runTokenRefresh();
    }
  }, [runTokenRefresh, runtime, session, timing]);

  if (!session || !timing) {
    return null;
  }

  const isWarningOpen = timing.warnActive;

  return (
    <Modal open={isWarningOpen} onClose={dismissWarning} size="sm">
      <ModalHeader
        title="Session expiring soon"
        subtitle="Your account will be signed out soon due to inactivity."
        onClose={dismissWarning}
      >
        <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-danger/10 text-danger">
          <AlertTriangle className="h-4 w-4" />
        </div>
      </ModalHeader>
      <ModalBody>
        <p className="text-sm text-ink-muted">
          To protect your account, inactive sessions are automatically ended. Choose <strong>Stay signed in</strong> to keep working and preserve unsaved progress.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-surface-soft px-3 py-2.5 text-sm text-ink">
          <Clock3 className="h-4 w-4 text-brand" />
          <span>Time remaining: {formatDuration(timing.remainingMs)}</span>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={dismissWarning} disabled={isRefreshing}>
          Dismiss
        </Button>
        <Button variant="danger" onClick={() => performLogout("idle")} disabled={isRefreshing}>
          Sign out now
        </Button>
        <Button onClick={() => void continueSession()} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing session..." : "Stay signed in"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
