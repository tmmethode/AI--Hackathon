"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Bell, CircleHelp, Search, Check, Settings, LogOut, User, Shield, X, Menu } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

const notifications = [
  { id: 1, title: "New applicants detected", body: "14 new candidates matched Senior Full Stack Engineer.", time: "2m ago", read: false },
  { id: 2, title: "Screening completed", body: "AI screening for QA Automation Lead finished with 91% avg match.", time: "1h ago", read: false },
  { id: 3, title: "Shortlist ready", body: "20 candidates shortlisted for Product Designer role.", time: "3h ago", read: true },
  { id: 4, title: "Export downloaded", body: "Your shortlist CSV export was generated successfully.", time: "Yesterday", read: true },
];

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifs, setNotifs] = useState(notifications);
  const [notifTab, setNotifTab] = useState<"all" | "unread">("all");
  const [viewAll, setViewAll] = useState(false);

  const unread = notifs.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: number) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  function dismiss(id: number) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  function closeAll() {
    setShowNotif(false);
    setShowProfile(false);
    setViewAll(false);
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-line bg-surface px-4 md:px-8">
        {/* Hamburger — mobile only */}
        <button type="button" aria-label="Open menu" onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:bg-surface-soft md:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand" aria-hidden>
            <Activity className="h-5 w-5 text-white" />
          </span>
          <span className="hidden text-[20px] font-bold text-brand md:inline">Umurava Screening</span>
        </div>

        <div className="relative ml-4 hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            type="search"
            aria-label="Search jobs or candidates"
            placeholder="Search job ID / candidate name..."
            className="h-9 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Help */}
          <button type="button" aria-label="Help"
            className="flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:bg-surface-soft">
            <CircleHelp className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button type="button" aria-label="Notifications"
              onClick={() => { setShowNotif((v) => !v); setShowProfile(false); }}
              className="relative flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:bg-surface-soft">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="fixed left-2 right-2 top-16 z-30 rounded-xl border border-line bg-surface shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <h3 className="text-sm font-semibold text-ink">Notifications</h3>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-brand hover:underline">
                      <Check className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-line">
                  {(["all", "unread"] as const).map((t) => (
                    <button key={t} onClick={() => setNotifTab(t)}
                      className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                        notifTab === t ? "border-b-2 border-brand text-brand" : "text-ink-muted hover:text-ink"
                      }`}>
                      {t === "unread" ? `Unread (${unread})` : `All (${notifs.length})`}
                    </button>
                  ))}
                </div>

                {/* List */}
                <ul className={`divide-y divide-line overflow-y-auto ${viewAll ? "max-h-[420px]" : "max-h-64"}`}>
                  {(() => {
                    const list = notifTab === "unread" ? notifs.filter((n) => !n.read) : notifs;
                    if (list.length === 0) return (
                      <li className="px-4 py-8 text-center text-sm text-ink-muted">
                        {notifTab === "unread" ? "No unread notifications" : "No notifications"}
                      </li>
                    );
                    return list.map((n) => (
                      <li key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-soft/50 ${!n.read ? "bg-brand-soft/20" : ""}`}>
                        <Link href={`/notifications/${n.id}`} onClick={() => { markRead(n.id); closeAll(); }} className="mt-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
                            <p className={`text-sm ${!n.read ? "font-semibold text-ink" : "font-medium text-ink"}`}>{n.title}</p>
                          </div>
                          <p className="mt-0.5 text-xs text-ink-muted">{n.body}</p>
                          <p className="mt-1 text-[10px] text-ink-muted">{n.time}</p>
                        </Link>
                        <button onClick={() => dismiss(n.id)} className="mt-0.5 rounded p-0.5 text-ink-muted hover:bg-surface-soft hover:text-ink">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ));
                  })()}
                </ul>

                <div className="border-t border-line px-4 py-2 text-center">
                  <Link href="/notifications" onClick={closeAll} className="text-xs text-brand hover:underline">
                    {viewAll ? "Show less" : "View all notifications"}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="mx-2 h-8 w-px bg-line" aria-hidden />

          {/* Profile menu */}
          <div className="relative flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm text-ink">Recruiter Pro</p>
              <p className="text-xs text-ink-muted">Admin Access</p>
            </div>
            <button onClick={() => { setShowProfile((v) => !v); setShowNotif(false); }}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
              <Avatar name="Recruiter Pro" online />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 z-30 w-56 rounded-xl border border-line bg-surface shadow-xl">
                <div className="border-b border-line px-4 py-3">
                  <p className="text-sm font-semibold text-ink">Recruiter Pro</p>
                  <p className="text-xs text-ink-muted">recruiter@umurava.com</p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-brand">Admin Access</p>
                </div>
                <ul className="py-1">
                  {[
                    { icon: User, label: "My Profile", href: "/profile?tab=profile" },
                    { icon: Settings, label: "Settings", href: "/profile?tab=preferences" },
                    { icon: Shield, label: "Security", href: "/profile?tab=security" },
                  ].map(({ icon: Icon, label, href }) => (
                    <li key={label}>
                      <Link href={href} onClick={closeAll}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-surface-soft">
                        <Icon className="h-4 w-4 text-ink-muted" /> {label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-line py-1">
                  <Link href="/" onClick={closeAll} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/5">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop to close dropdowns */}
      {(showNotif || showProfile) && (
        <div className="fixed inset-0 z-[19]" onClick={closeAll} />
      )}
    </>
  );
}
