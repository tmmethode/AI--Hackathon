import { Activity, Bell, CircleHelp, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-line bg-white px-4 md:px-8">
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
          className="h-9 w-full rounded-md bg-surface-soft/50 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          aria-label="Help"
          className="flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:bg-surface-soft"
        >
          <CircleHelp className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:bg-surface-soft"
        >
          <Bell className="h-5 w-5" />
          <span aria-hidden className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger" />
        </button>
        <div className="mx-2 h-8 w-px bg-line" aria-hidden />
        <div className="hidden text-right sm:block">
          <p className="text-sm text-ink">Recruiter Pro</p>
          <p className="text-xs text-ink-muted">Admin Access</p>
        </div>
        <Avatar name="Recruiter Pro" online />
      </div>
    </header>
  );
}
