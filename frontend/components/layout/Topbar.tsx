"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Bell, CircleHelp, Search, Check, Settings, LogOut, User, Shield, X, Menu } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { clearStoredAuth, getStoredAuth } from "@/lib/auth";
import { listNotifications, toRelativeTime, type Notification } from "@/lib/notifications";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [notifTab, setNotifTab] = useState<"all" | "unread">("all");
  const [viewAll, setViewAll] = useState(false);
  const [account, setAccount] = useState(() => getStoredAuth()?.user ?? null);

  const unread = notifs.filter((n) => !n.read).length;
  const displayName = account
    ? [account.firstName, account.lastName].filter(Boolean).join(" ").trim() || account.email
    : "Signed-in user";
  const accountEmail = account?.email ?? "Email unavailable";
  const accountRole = account ? `${account.role.charAt(0).toUpperCase()}${account.role.slice(1)} Access` : "Role unavailable";

  useEffect(() => {
    function syncAccount() {
      setAccount(getStoredAuth()?.user ?? null);
    }

    syncAccount();
    window.addEventListener("storage", syncAccount);
    window.addEventListener("umurava-auth-changed", syncAccount);
    return () => {
      window.removeEventListener("storage", syncAccount);
      window.removeEventListener("umurava-auth-changed", syncAccount);
    };
  }, []);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const response = await listNotifications(30);
        setNotifs(response.data);
      } catch {
        setNotifs([]);
      }
    }

    void loadNotifications();

    function syncNotifications() {
      void loadNotifications();
    }

    window.addEventListener("umurava-auth-changed", syncNotifications);
    return () => {
      window.removeEventListener("umurava-auth-changed", syncNotifications);
    };
  }, []);

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  function dismiss(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  function closeAll() {
    setShowNotif(false);
    setShowProfile(false);
    setViewAll(false);
  }

  function handleLogout() {
    clearStoredAuth();
    closeAll();
    router.replace("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-line bg-surface px-4 md:px-8">
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
          <button type="button" aria-label="Help"
            className="flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:bg-surface-soft">
            <CircleHelp className="h-5 w-5" />
          </button>

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
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <h3 className="text-sm font-semibold text-ink">Notifications</h3>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-brand hover:underline">
                      <Check className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>

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
                        <Link href={`/notifications/${encodeURIComponent(n.id)}`} onClick={() => { markRead(n.id); closeAll(); }} className="mt-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
                            <p className={`text-sm ${!n.read ? "font-semibold text-ink" : "font-medium text-ink"}`}>{n.title}</p>
                          </div>
                          <p className="mt-0.5 text-xs text-ink-muted">{n.body}</p>
                          <p className="mt-1 text-[10px] text-ink-muted">{toRelativeTime(n.createdAt)}</p>
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

          <div className="relative flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm text-ink">{displayName}</p>
              <p className="text-xs text-ink-muted">{accountRole}</p>
            </div>
            <button onClick={() => { setShowProfile((v) => !v); setShowNotif(false); }}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
              <Avatar name={displayName} src={account?.profilePicture} online />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 z-30 w-56 rounded-xl border border-line bg-surface shadow-xl">
                <div className="border-b border-line px-4 py-3">
                  <p className="text-sm font-semibold text-ink">{displayName}</p>
                  <p className="text-xs text-ink-muted">{accountEmail}</p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-brand">{accountRole}</p>
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
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-danger hover:bg-danger/5"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {(showNotif || showProfile) && (
        <div className="fixed inset-0 z-[19]" onClick={closeAll} />
      )}
    </>
  );
}
