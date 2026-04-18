import { Card } from "@/components/ui/Card";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-soft/80 ${className}`} />;
}

function JobRowSkeleton({ index }: { index: number }) {
  return (
    <li
      className={`grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-[2fr_1.1fr_1.1fr_0.9fr_100px_40px] md:items-center md:gap-4 ${
        index === 0 ? "bg-brand-soft/20" : ""
      }`}
    >
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-3 w-28" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-6 w-6 rounded-full" />
        <SkeletonBlock className="h-4 w-24" />
      </div>
      <SkeletonBlock className="h-4 w-28" />
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-10" />
        <SkeletonBlock className="h-3 w-16" />
      </div>
      <div className="md:flex md:justify-center">
        <SkeletonBlock className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex justify-end">
        <SkeletonBlock className="h-8 w-8 rounded-md" />
      </div>
    </li>
  );
}

function JobsSidebarSkeleton() {
  return (
    <>
      <Card className="p-5">
        <SkeletonBlock className="mx-auto h-3 w-28" />
        <div className="mt-4 flex items-start justify-between">
          <SkeletonBlock className="h-6 w-24 rounded-full" />
          <SkeletonBlock className="h-6 w-16 rounded-full" />
        </div>
        <div className="mt-3 space-y-2">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-4 w-28" />
          </div>
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-4 w-24" />
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-4 w-4 rounded-full" />
            <SkeletonBlock className="h-4 w-32" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <SkeletonBlock className="h-6 w-20 rounded-full" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
            <SkeletonBlock className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
        <div className="mt-2">
          <SkeletonBlock className="h-10 w-full" />
        </div>
      </Card>

      <Card className="bg-brand-soft p-5">
        <SkeletonBlock className="h-4 w-40 bg-white/50" />
        <div className="mt-3 space-y-2">
          <SkeletonBlock className="h-3 w-full bg-white/50" />
          <SkeletonBlock className="h-3 w-11/12 bg-white/50" />
          <SkeletonBlock className="h-3 w-4/5 bg-white/50" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-24 bg-white/50" />
            <SkeletonBlock className="h-4 w-28 bg-white/50" />
          </div>
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-20 bg-white/50" />
            <SkeletonBlock className="h-4 w-24 bg-white/50" />
          </div>
        </div>
      </Card>

      <Card className="flex items-center justify-between p-5">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-7 w-14" />
        </div>
        <div className="space-y-2 text-right">
          <SkeletonBlock className="ml-auto h-4 w-20" />
          <SkeletonBlock className="ml-auto h-3 w-16" />
        </div>
      </Card>
    </>
  );
}

export default function Loading() {
  return (
    <div className="w-full px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <SkeletonBlock className="h-9 w-56" />
          <SkeletonBlock className="h-4 w-80 max-w-full" />
        </div>
        <div className="hidden gap-3 md:flex">
          <SkeletonBlock className="h-10 w-32" />
          <SkeletonBlock className="h-10 w-36" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex items-center rounded-md border border-line bg-surface p-2 shadow-sm">
          <SkeletonBlock className="h-10 flex-1" />
          <div className="ml-2 hidden items-center gap-2 border-l border-line pl-2 md:flex">
            <SkeletonBlock className="h-7 w-12" />
            <SkeletonBlock className="h-7 w-16" />
            <SkeletonBlock className="h-7 w-14" />
            <SkeletonBlock className="h-7 w-14" />
          </div>
        </div>

        <div className="hidden lg:block" />

        <Card className="overflow-hidden">
          <div role="table" className="min-w-0">
            <div className="hidden grid-cols-[2fr_1.1fr_1.1fr_0.9fr_100px_40px] gap-4 bg-surface-soft/40 px-5 py-3 md:grid">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="mx-auto h-3 w-12" />
              <SkeletonBlock className="ml-auto h-3 w-3" />
            </div>

            <ul className="divide-y divide-line">
              {Array.from({ length: 5 }, (_, index) => (
                <JobRowSkeleton key={index} index={index} />
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-line bg-surface px-5 py-4">
            <SkeletonBlock className="h-4 w-36" />
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-8 w-8" />
              <SkeletonBlock className="h-8 w-8" />
              <SkeletonBlock className="h-8 w-8" />
            </div>
          </div>
        </Card>

        <aside aria-label="Quick inspection" className="flex flex-col gap-4">
          <JobsSidebarSkeleton />
        </aside>
      </div>
    </div>
  );
}
