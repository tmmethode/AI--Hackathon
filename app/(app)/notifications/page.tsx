"use client";

import { useState, useMemo } from "react";
import { Bell, Check, X, Search, Zap, Briefcase, FileDown, AlertCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";

type NotifType = "screening" | "job" | "export" | "system";

interface Notification {
  id: number;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const allNotifications: Notification[] = [
  { id: 1, type: "screening", title: "Screening completed", body: "AI screening for QA Automation Lead finished with 91% avg match. 20 candidates shortlisted.", time: "2 minutes ago", read: false },
  { id: 2, type: "job", title: "New applicants detected", body: "14 new candidates matched Senior Full Stack Engineer via Umurava Platform.", time: "1 hour ago", read: false },
  { id: 3, type: "export", title: "Export ready", body: "Your shortlist CSV export for Product Designer was generated successfully.", time: "3 hours ago", read: false },
  { id: 4, type: "screening", title: "Screening started", body: "AI screening for Senior Frontend Engineer has been triggered with 142 candidates.", time: "5 hours ago", read: true },
  { id: 5, type: "job", title: "Job status updated", body: "DevOps Architect (JOB-005) has been marked as Closed by Marcus Chen.", time: "Yesterday", read: true },
  { id: 6, type: "system", title: "Weekly usage alert", body: "You have used 75 of 100 screening credits this week. Consider upgrading your plan.", time: "Yesterday", read: true },
  { id: 7, type: "screening", title: "Screening completed", body: "Full Stack Engineer (L5) screening done. Top candidate: Michael Chen at 94% match.", time: "2 days ago", read: true },
  { id: 8, type: "export", title: "Export ready", body: "JSON export for Senior DevOps Engineer shortlist is available for download.", time: "2 days ago", read: true },
  { id: 9, type: "job", title: "New applicants detected", body: "8 new candidates matched UX Researcher - Mobile role.", time: "3 days ago", read: true },
  { id: 10, type: "system", title: "System maintenance", body: "Scheduled maintenance on Oct 28 from 02:00–04:00 UTC. Screenings may be delayed.", time: "4 days ago", read: true },
  { id: 11, type: "screening", title: "Screening failed", body: "Marketing Lead screening encountered an error. Please re-trigger the run.", time: "5 days ago", read: true },
  { id: 12, type: "job", title: "Job created", body: "New job requisition 'Data Scientist' (JOB-006) was created by Priya Nair.", time: "6 days ago", read: true },
];

const typeIcon: Record<NotifType, React.ReactNode> = {
  screening: <Zap className="h-4 w-4 text-brand" />,
  job: <Briefcase className="h-4 w-4 text-success" />,
  export: <FileDown className="h-4 w-4 text-info-deep" />,
  system: <AlertCircle className="h-4 w-4 text-warning" />,
};

const typeTone: Record<NotifType, React.ComponentProps<typeof Badge>["tone"]> = {
  screening: "brand", job: "success", export: "info", system: "warning",
};

type Tab = "all" | "unread";
const PAGE_SIZE = 6;

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>(allNotifications);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const unreadCount = notifs.filter((n) => !n.read).length;

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

  function markRead(id: number) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id: number) {
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
            <Button variant="secondary" leftIcon={<Check className="h-4 w-4" />} onClick={markAllRead}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-4">
          {/* Search + Tabs */}
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

          {/* List */}
          <Card className="overflow-hidden">
            {paginated.length === 0 ? (
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
                    <div className="flex-1 cursor-pointer" onClick={() => markRead(n.id)}>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-sm ${!n.read ? "font-semibold text-ink" : "font-medium text-ink"}`}>{n.title}</p>
                        <Badge tone={typeTone[n.type]} pill className="capitalize">{n.type}</Badge>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-brand" />}
                        <span className="ml-auto text-xs text-ink-muted">{n.time}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-ink-muted">{n.body}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} title="Mark as read"
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

            {/* Pagination */}
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

        {/* Summary sidebar */}
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
            {(["screening", "job", "export", "system"] as NotifType[]).map((t) => {
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
