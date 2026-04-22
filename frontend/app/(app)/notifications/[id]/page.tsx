"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Zap, Briefcase, FileDown, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getNotification,
  markNotificationAsRead,
  toDateTimeLabel,
  toRelativeTime,
  type Notification,
  type NotificationType,
} from "@/lib/notifications";

const typeIcon: Record<NotificationType, React.ReactNode> = {
  screening: <Zap className="h-5 w-5 text-brand" />,
  job: <Briefcase className="h-5 w-5 text-success" />,
  export: <FileDown className="h-5 w-5 text-info-deep" />,
  system: <AlertCircle className="h-5 w-5 text-amber-500" />,
};

const typeTone: Record<NotificationType, React.ComponentProps<typeof Badge>["tone"]> = {
  screening: "brand", job: "success", export: "info", system: "warning",
};

export default function NotificationDetailPage() {
  const params = useParams<{ id?: string }>();
  const notificationId = useMemo(() => {
    if (!params?.id || typeof params.id !== "string") {
      return "";
    }

    return decodeURIComponent(params.id);
  }, [params]);

  const [notif, setNotif] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNotification() {
      if (!notificationId) {
        setNotif(null);
        setError("Notification ID is missing or invalid.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        const response = await getNotification(notificationId);

        if (cancelled) {
          return;
        }

        setNotif(response.data);

        if (!response.data.read) {
          await markNotificationAsRead(notificationId).catch(() => null);
          window.dispatchEvent(new Event("umurava-notifications-changed"));
        }
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        setNotif(null);
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load notification.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadNotification();

    return () => {
      cancelled = true;
    };
  }, [notificationId]);

  if (isLoading) {
    return (
      <div className="w-full px-6 py-5">
        <Card className="p-12 text-center text-sm text-ink-muted">Loading notification...</Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-6 py-5">
        <Link href="/notifications" className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to Notifications
        </Link>
        <Card className="p-12 text-center text-sm text-danger">{error}</Card>
      </div>
    );
  }

  if (!notif) {
    return (
      <div className="w-full px-6 py-5">
        <Link href="/notifications" className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to Notifications
        </Link>
        <Card className="p-12 text-center text-sm text-ink-muted">Notification not found.</Card>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-5">
      <Link href="/notifications" className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Notifications
      </Link>

      <div className="w-full">
        <div className={`mb-4 rounded-xl p-6 ${
          notif.type === "screening" ? "bg-brand-soft" :
          notif.type === "job" ? "bg-success/10" :
          notif.type === "export" ? "bg-brand/5" : "bg-amber-50"
        }`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
              notif.type === "screening" ? "bg-brand/10" :
              notif.type === "job" ? "bg-success/20" :
              notif.type === "export" ? "bg-brand/10" : "bg-amber-100"
            }`}>
              <span className="scale-125">{typeIcon[notif.type]}</span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={typeTone[notif.type]} pill className="capitalize">{notif.type}</Badge>
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">{notif.title}</h1>
              <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                <Clock className="h-3.5 w-3.5" />
                <span>{toDateTimeLabel(notif.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-3 rounded-md border border-line bg-surface-soft/40 px-4 py-3">
            <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
            <p className="text-sm font-medium text-ink">{notif.body}</p>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Full Details</p>
            <p className="text-sm leading-7 text-ink">{notif.detail}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-xs text-ink-muted">Received {toRelativeTime(notif.createdAt)}</p>
            <div className="flex gap-2">
              {notif.type === "screening" && <Link href="/shortlists"><Button>View Shortlist</Button></Link>}
              {notif.type === "job" && <Link href="/jobs"><Button>View Jobs</Button></Link>}
              {notif.type === "export" && <Link href="/exports"><Button>Go to Exports</Button></Link>}
              {notif.type === "system" && <Link href="/profile?tab=preferences"><Button>Manage Settings</Button></Link>}
              <Link href="/notifications"><Button variant="secondary">Back to All</Button></Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
