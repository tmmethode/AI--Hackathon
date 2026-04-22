"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Check, X, Search, Zap, Briefcase, FileDown, AlertCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { listNotifications, markAllNotificationsAsRead, markNotificationAsRead, toRelativeTime, type Notification, type NotificationType } from "@/lib/notifications";

const typeIcon: Record<NotificationType, React.ReactNode> = {
  screening: <Zap className="h-4 w-4 text-brand" />,
  job: <Briefcase className="h-4 w-4 text-success" />,
  export: <FileDown className="h-4 w-4 text-info-deep" />,
  system: <AlertCircle className="h-4 w-4 text-warning" />,
};

const typeTone: Record<NotificationType, React.ComponentProps<typeof Badge>["tone"]> = {
  screening: "brand", job: "success", export: "info", system: "warning",
};

type Tab = "all" | "unread";
const PAGE_SIZE = 6;

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const unreadCount = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    async function loadNotifications() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await listNotifications(120);
        setNotifs(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notifications.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadNotifications();
  }, []);

  const filtered = useMemo(() => {
    return notifs.filter((n) => {
      const matchesTab = tab === "all" || !n.read;
      const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.body.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [notifs, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function markRead(id: string) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

    try {
      await markNotificationAsRead(id);
      window.dispatchEvent(new Event("umurava-notifications-changed"));
    } catch {
      const response = await listNotifications(120).catch(() => null);
      if (response?.data) {
        setNotifs(response.data);
      }
    }
  }

  async function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await markAllNotificationsAsRead();
      window.dispatchEvent(new Event("umurava-notifications-changed"));
    } catch {
      const response = await listNotifications(120).catch(() => null);
      if (response?.data) {
        setNotifs(response.data);
      }
    }
  }

  function dismiss(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleTab(t: Tab) {
    setTab(t);
    setPage(1);
  }

  return (
    <div className="w-full px-6 py-5">
      <PageHeader
        title="Notifications"
        description="Stay up to date with your screening pipeline activity."
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" leftIcon={<Check className="h-4 w-4" />} onClick={() => void markAllRead()}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-0 rounded-md border border-line bg-white shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                placeholder="Search notifications…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 border-l border-line px-2">
              {(["all", "unread"] as Tab[]).map((t) => (
                <button key={t} onClick={() => handleTab(t)}
                  className={`h-7 rounded px-3 text-xs font-medium transition-colors capitalize ${
                    tab === t ? "bg-brand text-white" : "text-ink-muted hover:bg-surface-soft hover:text-ink"
                  }`}>
                  {t === "unread" ? `Unread (${unreadCount})` : `All (${notifs.length})`}
                </button>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center py-16 text-ink-muted">
                <Bell className="mb-3 h-8 w-8 animate-pulse opacity-30" />
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center py-16 text-danger">
                <AlertCircle className="mb-3 h-8 w-8" />
                <p className="text-sm">{error}</p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-ink-muted">
                <Bell className="mb-3 h-8 w-8 opacity-30" />
                <p className="text-sm">No notifications found.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {paginated.map((n) => (
                  <li key={n.id}
                    className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-soft/40 ${!n.read ? "bg-brand-soft/20" : ""}`}>
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-soft">
                      {typeIcon[n.type]}
                    </div>
                    <Link href={`/notifications/${encodeURIComponent(n.id)}`} onClick={() => void markRead(n.id)} className="flex-1 min-w-0 cursor-pointer text-inherit no-underline">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-sm ${!n.read ? "font-semibold text-ink" : "font-medium text-ink"}`}>{n.title}</p>
                        <Badge tone={typeTone[n.type]} pill className="capitalize">{n.type}</Badge>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-brand" />}
                        <span className="ml-auto text-xs text-ink-muted">{toRelativeTime(n.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-ink-muted">{n.body}</p>
                    </Link>
                    <div className="flex shrink-0 items-center gap-1">
                      {!n.read && (
                        <button onClick={() => void markRead(n.id)} title="Mark as read"
                          className="rounded p-1 text-ink-muted hover:bg-surface-soft hover:text-brand">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => dismiss(n.id)} title="Dismiss"
                        className="rounded p-1 text-ink-muted hover:bg-surface-soft hover:text-danger">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {filtered.length > 0 && (
              <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-ink-muted">
                <p>Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
                <nav className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`h-8 w-8 rounded-md border text-xs transition-colors ${
                        p === page ? "border-brand bg-brand text-white" : "border-line text-ink hover:bg-surface-soft"
                      }`}>
                      {p}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">Summary</h3>
            <dl className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <dt className="text-ink-muted">Total</dt>
                <dd className="font-semibold text-ink">{notifs.length}</dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-ink-muted">Unread</dt>
                <dd className="font-semibold text-brand">{unreadCount}</dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-ink-muted">Read</dt>
                <dd className="font-semibold text-ink">{notifs.length - unreadCount}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink">By Type</h3>
            {(["screening", "job", "export", "system"] as NotificationType[]).map((t) => {
              const count = notifs.filter((n) => n.type === t).length;
              return (
                <div key={t} className="flex items-center justify-between py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    {typeIcon[t]}
                    <span className="capitalize text-ink">{t}</span>
                  </div>
                  <Badge tone={typeTone[t]}>{count}</Badge>
                </div>
              );
            })}
          </Card>

          <Card className="bg-brand-soft/60 p-5">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-info-deep" />
              <h4 className="text-sm font-semibold text-info-deep">Tip</h4>
            </div>
            <p className="mt-2 text-xs leading-5 text-info-deep/80">
              Click any notification to mark it as read. Use the Unread tab to focus on what needs your attention.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
