import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function JobRowSkeleton({ index }: { index: number }) {
  return (
    <li
      className={`grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-[2fr_1.1fr_1.1fr_0.9fr_100px_40px] md:items-center md:gap-4 ${
        index === 0 ? "bg-brand-soft/20" : ""
      }`}
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" delayIndex={index} />
        <Skeleton className="h-3 w-28" delayIndex={index + 1} />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton shape="circle" className="h-6 w-6" delayIndex={index + 2} />
        <Skeleton className="h-4 w-24" delayIndex={index + 3} />
      </div>
      <Skeleton className="h-4 w-28" delayIndex={index + 4} />
      <div className="space-y-2">
        <Skeleton className="h-4 w-10" delayIndex={index + 5} />
        <Skeleton className="h-3 w-16" delayIndex={index + 6} />
      </div>
      <div className="md:flex md:justify-center">
        <Skeleton shape="pill" className="h-6 w-16" delayIndex={index + 7} />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-8 w-8" delayIndex={index + 8} />
      </div>
    </li>
  );
}

function JobsSidebarSkeleton() {
  return (
    <>
      <Card className="p-5">
        <Skeleton className="mx-auto h-3 w-28" />
        <div className="mt-4 flex items-start justify-between">
          <Skeleton shape="pill" className="h-6 w-24" delayIndex={1} />
          <Skeleton shape="pill" className="h-6 w-16" delayIndex={2} />
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-7 w-48" delayIndex={3} />
          <Skeleton className="h-3 w-24" delayIndex={4} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" delayIndex={5} />
            <Skeleton className="h-4 w-28" delayIndex={6} />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" delayIndex={7} />
            <Skeleton className="h-4 w-24" delayIndex={8} />
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center gap-2">
            <Skeleton shape="circle" className="h-4 w-4" delayIndex={9} />
            <Skeleton className="h-4 w-32" delayIndex={10} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Skeleton shape="pill" className="h-6 w-20" delayIndex={11} />
            <Skeleton shape="pill" className="h-6 w-16" delayIndex={12} />
            <Skeleton shape="pill" className="h-6 w-24" delayIndex={13} />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Skeleton className="h-10 w-full" delayIndex={14} />
          <Skeleton className="h-10 w-full" delayIndex={15} />
        </div>
        <div className="mt-2">
          <Skeleton className="h-10 w-full" delayIndex={16} />
        </div>
      </Card>

      <Card className="bg-brand-soft p-5">
        <Skeleton className="h-4 w-40 bg-white/50" delayIndex={17} />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-3 w-full bg-white/50" delayIndex={18} />
          <Skeleton className="h-3 w-11/12 bg-white/50" delayIndex={19} />
          <Skeleton className="h-3 w-4/5 bg-white/50" delayIndex={20} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 bg-white/50" delayIndex={21} />
            <Skeleton className="h-4 w-28 bg-white/50" delayIndex={22} />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 bg-white/50" delayIndex={23} />
            <Skeleton className="h-4 w-24 bg-white/50" delayIndex={24} />
          </div>
        </div>
      </Card>

      <Card className="flex items-center justify-between p-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" delayIndex={25} />
          <Skeleton className="h-7 w-14" delayIndex={26} />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="ml-auto h-4 w-20" delayIndex={27} />
          <Skeleton className="ml-auto h-3 w-16" delayIndex={28} />
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
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" delayIndex={1} />
        </div>
        <div className="hidden gap-3 md:flex">
          <Skeleton className="h-10 w-32" delayIndex={2} />
          <Skeleton className="h-10 w-36" delayIndex={3} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex items-center rounded-md border border-line bg-surface p-2 shadow-sm">
          <Skeleton className="h-10 flex-1" delayIndex={4} />
          <div className="ml-2 hidden items-center gap-2 border-l border-line pl-2 md:flex">
            <Skeleton shape="pill" className="h-7 w-12" delayIndex={5} />
            <Skeleton shape="pill" className="h-7 w-16" delayIndex={6} />
            <Skeleton shape="pill" className="h-7 w-14" delayIndex={7} />
            <Skeleton shape="pill" className="h-7 w-14" delayIndex={8} />
          </div>
        </div>

        <div className="hidden lg:block" />

        <Card className="overflow-hidden">
          <div role="table" className="min-w-0">
            <div className="hidden grid-cols-[2fr_1.1fr_1.1fr_0.9fr_100px_40px] gap-4 bg-surface-soft/40 px-5 py-3 md:grid">
              <Skeleton className="h-3 w-24" delayIndex={9} />
              <Skeleton className="h-3 w-16" delayIndex={10} />
              <Skeleton className="h-3 w-16" delayIndex={11} />
              <Skeleton className="h-3 w-16" delayIndex={12} />
              <Skeleton className="mx-auto h-3 w-12" delayIndex={13} />
              <Skeleton className="ml-auto h-3 w-3" delayIndex={14} />
            </div>

            <ul className="divide-y divide-line">
              {Array.from({ length: 5 }, (_, index) => (
                <JobRowSkeleton key={index} index={index} />
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-line bg-surface px-5 py-4">
            <Skeleton className="h-4 w-36" delayIndex={15} />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" delayIndex={16} />
              <Skeleton className="h-8 w-8" delayIndex={17} />
              <Skeleton className="h-8 w-8" delayIndex={18} />
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
