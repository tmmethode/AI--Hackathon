"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  UserPlus,
  ListOrdered,
  Settings,
  FileOutput,
  CirclePlus,
  Users,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Ingest Applicants", href: "/ingest", icon: UserPlus },
  { label: "Screening", href: "/screening", icon: ShieldCheck },
  { label: "Shortlists", href: "/shortlists", icon: ListOrdered },
  { label: "Candidates", href: "/candidates", icon: Users },
  { label: "Exports", href: "/exports", icon: FileOutput },
  { label: "User Management", href: "/users/new", icon: UserPlus },
  { label: "History & Settings", href: "/history", icon: Settings },
] as const;

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (open && previousPathname.current !== pathname) {
      onClose?.();
    }
    previousPathname.current = pathname;
  }, [open, onClose, pathname]);

  return (
    <aside
      aria-label="Primary navigation"
      className={`fixed inset-y-0 left-0 z-20 flex w-64 shrink-0 flex-col border-r border-line bg-surface-muted transition-transform duration-200 md:static md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex-1 overflow-y-auto p-3">
        <Link
          href="/jobs/new"
          onClick={onClose}
          className="mb-2 flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white shadow-card transition-colors hover:bg-brand-hover"
        >
          <CirclePlus className="h-4 w-4" aria-hidden />
          New Job
        </Link>
        <nav className="mt-2 flex flex-col gap-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                  active ? "bg-surface-soft text-ink-soft font-medium" : "text-ink hover:bg-surface-soft"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-line p-4">
        <div className="rounded-card border border-line bg-surface p-3 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Weekly Usage</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-soft">
            <div className="h-full bg-brand" style={{ width: "75%" }} />
          </div>
          <p className="mt-1.5 text-[10px] text-ink-muted">75/100 Screenings used</p>
        </div>
      </div>
    </aside>
  );
}
