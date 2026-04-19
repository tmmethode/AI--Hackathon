import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function HeaderSkeleton({ actionWidths }: { actionWidths: number[] }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" delayIndex={1} />
      </div>
      <div className="flex flex-wrap gap-3">
        {actionWidths.map((width, index) => (
          <Skeleton
            key={width + index}
            className="h-10"
            style={{ width }}
            delayIndex={index + 2}
          />
        ))}
      </div>
    </div>
  );
}

function MetricCardSkeleton({ index }: { index: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" delayIndex={index} />
          <Skeleton className="h-8 w-16" delayIndex={index + 1} />
        </div>
        <Skeleton shape="circle" className="h-8 w-8" delayIndex={index + 2} />
      </div>
    </Card>
  );
}

function ToolbarSkeleton({ showFilters = true }: { showFilters?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-36" />
        <Skeleton shape="pill" className="h-6 w-14" delayIndex={1} />
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-52" delayIndex={2} />
        {showFilters && <Skeleton className="h-8 w-20" delayIndex={3} />}
        {showFilters && <Skeleton className="h-8 w-20" delayIndex={4} />}
      </div>
    </div>
  );
}

function PaginationSkeleton() {
  return (
    <div className="flex items-center justify-between border-t border-line px-5 py-4">
      <Skeleton className="h-4 w-40" delayIndex={1} />
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8" delayIndex={2} />
        <Skeleton className="h-8 w-8" delayIndex={3} />
        <Skeleton className="h-8 w-8" delayIndex={4} />
      </div>
    </div>
  );
}

function IngestPreviewRowSkeleton({ index }: { index: number }) {
  return (
    <li className="grid grid-cols-1 gap-3 px-6 py-4 text-sm md:grid-cols-[1.5fr_0.8fr_1.4fr_1fr] md:items-center md:gap-4">
      <div className="flex items-center gap-3">
        <Skeleton shape="circle" className="h-8 w-8" delayIndex={index} />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" delayIndex={index + 1} />
          <Skeleton className="h-3 w-36" delayIndex={index + 2} />
        </div>
      </div>
      <Skeleton shape="pill" className="h-6 w-20" delayIndex={index + 3} />
      <div className="flex flex-wrap gap-1.5">
        <Skeleton shape="pill" className="h-6 w-16" delayIndex={index + 4} />
        <Skeleton shape="pill" className="h-6 w-20" delayIndex={index + 5} />
        <Skeleton shape="pill" className="h-6 w-14" delayIndex={index + 6} />
      </div>
      <Skeleton shape="pill" className="h-6 w-24" delayIndex={index + 7} />
    </li>
  );
}

function CandidateCardSkeleton({ index }: { index: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface shadow-sm">
      <div className="h-1 rounded-t-xl bg-brand/20" />
      <div className="flex flex-col gap-3.5 p-5">
        <div className="flex items-start gap-3.5">
          <Skeleton shape="circle" className="h-[52px] w-[52px]" delayIndex={index} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-4 w-32" delayIndex={index + 1} />
              <Skeleton shape="pill" className="h-6 w-24" delayIndex={index + 2} />
            </div>
            <Skeleton className="h-3 w-40" delayIndex={index + 3} />
            <Skeleton className="h-3 w-32" delayIndex={index + 4} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Skeleton shape="pill" className="h-6 w-16" delayIndex={index + 5} />
          <Skeleton shape="pill" className="h-6 w-20" delayIndex={index + 6} />
          <Skeleton shape="pill" className="h-6 w-14" delayIndex={index + 7} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" delayIndex={index + 8} />
            <Skeleton className="h-3 w-12" delayIndex={index + 9} />
          </div>
          <Skeleton className="h-1.5 w-full" delayIndex={index + 10} />
        </div>
        <Skeleton className="h-8 w-full" delayIndex={index + 11} />
      </div>
      <div className="flex items-center gap-1.5 border-t border-line px-4 py-3">
        <Skeleton className="h-8 flex-1" delayIndex={index + 12} />
        <Skeleton className="h-8 w-24" delayIndex={index + 13} />
        <Skeleton className="h-8 w-8" delayIndex={index + 14} />
        <Skeleton className="h-8 w-8" delayIndex={index + 15} />
      </div>
    </div>
  );
}

function ScreeningAssetRowSkeleton({ index }: { index: number }) {
  return (
    <li className="flex items-center justify-between rounded-md border border-line bg-surface px-4 py-3">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" delayIndex={index} />
        <Skeleton className="h-3 w-24" delayIndex={index + 1} />
      </div>
      <Skeleton shape="pill" className="h-6 w-20" delayIndex={index + 2} />
    </li>
  );
}

function ShortlistCandidateRowSkeleton({ index }: { index: number }) {
  return (
    <li className="p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex items-center gap-3">
          <Skeleton shape="circle" className="h-8 w-8" delayIndex={index} />
          <Skeleton shape="circle" className="h-11 w-11" delayIndex={index + 1} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-40" delayIndex={index + 2} />
            <Skeleton shape="pill" className="h-6 w-20" delayIndex={index + 3} />
          </div>
          <Skeleton className="h-3 w-44" delayIndex={index + 4} />
          <div className="flex flex-wrap gap-1.5">
            <Skeleton shape="pill" className="h-6 w-16" delayIndex={index + 5} />
            <Skeleton shape="pill" className="h-6 w-20" delayIndex={index + 6} />
            <Skeleton shape="pill" className="h-6 w-14" delayIndex={index + 7} />
          </div>
          <Skeleton className="h-12 w-full" delayIndex={index + 8} />
        </div>
        <div className="flex gap-2 md:flex-col">
          <Skeleton className="h-8 w-20" delayIndex={index + 9} />
          <Skeleton className="h-8 w-24" delayIndex={index + 10} />
        </div>
      </div>
    </li>
  );
}

export function IngestPageSkeleton() {
  return (
    <div className="w-full px-6 py-5">
      <HeaderSkeleton actionWidths={[92, 148]} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-1 border-b border-line p-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-10 flex-1" delayIndex={index + 3} />
              ))}
            </div>
            <div className="space-y-4 p-6">
              <Skeleton className="h-4 w-80 max-w-full" delayIndex={8} />
              <Skeleton className="h-48 w-full" delayIndex={9} />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" delayIndex={10} />
                <Skeleton className="h-10 w-full" delayIndex={11} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-44" delayIndex={12} />
                <Skeleton className="h-4 w-72 max-w-full" delayIndex={13} />
              </div>
              <Skeleton className="h-8 w-24" delayIndex={14} />
            </div>
            <div>
              <div className="hidden grid-cols-[1.5fr_0.8fr_1.4fr_1fr] gap-4 bg-surface-soft/30 px-6 py-3 md:grid">
                <Skeleton className="h-3 w-20" delayIndex={15} />
                <Skeleton className="h-3 w-16" delayIndex={16} />
                <Skeleton className="h-3 w-24" delayIndex={17} />
                <Skeleton className="h-3 w-16" delayIndex={18} />
              </div>
              <ul className="divide-y divide-line">
                {Array.from({ length: 5 }, (_, index) => (
                  <IngestPreviewRowSkeleton key={index} index={index + 19} />
                ))}
              </ul>
            </div>
            <PaginationSkeleton />
          </Card>
        </div>

        <aside className="flex flex-col gap-5">
          <Card className="p-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2 h-3 w-44" delayIndex={1} />
            <Skeleton className="mt-3 h-10 w-full" delayIndex={2} />
            <div className="mt-3 flex items-center gap-3 rounded-md border border-line bg-surface-soft/30 p-3">
              <Skeleton shape="circle" className="h-9 w-9" delayIndex={3} />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" delayIndex={4} />
                <Skeleton className="h-3 w-28" delayIndex={5} />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" delayIndex={6} />
              <Skeleton shape="pill" className="h-6 w-12" delayIndex={7} />
            </div>
            <Skeleton className="mt-3 h-3 w-40" delayIndex={8} />
            <div className="mt-2 flex items-center gap-2">
              <Skeleton className="h-1.5 flex-1" delayIndex={9} />
              <Skeleton className="h-3 w-8" delayIndex={10} />
            </div>
            <Skeleton className="mt-2 h-3 w-48" delayIndex={11} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Skeleton className="h-20 w-full" delayIndex={12} />
              <Skeleton className="h-20 w-full" delayIndex={13} />
            </div>
            <Skeleton className="mt-4 h-16 w-full" delayIndex={14} />
            <Skeleton className="mt-3 h-8 w-full" delayIndex={15} />
          </Card>

          <Card className="p-5">
            <Skeleton className="h-4 w-32" delayIndex={16} />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-full" delayIndex={17} />
              <Skeleton className="h-3 w-11/12" delayIndex={18} />
              <Skeleton className="h-3 w-4/5" delayIndex={19} />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export function ScreeningPageSkeleton() {
  return (
    <div className="w-full px-6 py-5">
      <HeaderSkeleton actionWidths={[92, 132]} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="mb-5 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-80 max-w-full" delayIndex={1} />
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Skeleton className="h-10 w-full md:col-span-2" delayIndex={2} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-6 w-44" delayIndex={3} />
                <Skeleton className="h-4 w-72 max-w-full" delayIndex={4} />
              </div>
              <Skeleton shape="pill" className="h-6 w-20" delayIndex={5} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-20 w-full" delayIndex={index + 6} />
              ))}
            </div>
            <Skeleton className="mt-3 h-10 w-full" delayIndex={10} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Skeleton className="h-16 min-w-[200px] flex-1" delayIndex={11} />
              <div className="flex gap-1.5">
                <Skeleton shape="pill" className="h-6 w-16" delayIndex={12} />
                <Skeleton shape="pill" className="h-6 w-20" delayIndex={13} />
                <Skeleton shape="pill" className="h-6 w-16" delayIndex={14} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <Skeleton shape="circle" className="h-11 w-11" delayIndex={15} />
              <div className="space-y-2">
                <Skeleton className="h-6 w-44" delayIndex={16} />
                <Skeleton className="h-4 w-80 max-w-full" delayIndex={17} />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" delayIndex={18} />
              <Skeleton className="h-12 w-full" delayIndex={19} />
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card className="p-5">
            <Skeleton className="h-5 w-24" delayIndex={20} />
            <Skeleton className="mt-3 h-10 w-full" delayIndex={21} />
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 4 }, (_, index) => (
                <ScreeningAssetRowSkeleton key={index} index={index + 22} />
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <Skeleton className="h-4 w-28" delayIndex={26} />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-full" delayIndex={27} />
              <Skeleton className="h-3 w-11/12" delayIndex={28} />
              <Skeleton className="h-3 w-4/5" delayIndex={29} />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export function ShortlistsPageSkeleton() {
  return (
    <div className="w-full px-6 py-5">
      <Card className="mb-5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
              <Skeleton shape="circle" className="h-10 w-10" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-40" delayIndex={1} />
                  <Skeleton shape="pill" className="h-6 w-16" delayIndex={2} />
                </div>
                <Skeleton className="h-3 w-48" delayIndex={3} />
              </div>
              <Skeleton className="h-4 w-4" delayIndex={4} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Skeleton className="h-3 w-24" delayIndex={5} />
              <Skeleton className="h-3 w-20" delayIndex={6} />
              <Skeleton className="h-3 w-20" delayIndex={7} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-28" delayIndex={8} />
            <Skeleton className="h-10 w-24" delayIndex={9} />
            <Skeleton className="h-10 w-24" delayIndex={10} />
            <Skeleton className="h-10 w-40" delayIndex={11} />
          </div>
        </div>
      </Card>

      <section className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <MetricCardSkeleton key={index} index={index + 12} />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <ToolbarSkeleton />
          <ul className="divide-y divide-line">
            {Array.from({ length: 4 }, (_, index) => (
              <ShortlistCandidateRowSkeleton key={index} index={index + 20} />
            ))}
          </ul>
          <PaginationSkeleton />
        </Card>

        <aside className="flex flex-col gap-5">
          <Card className="p-5">
            <Skeleton className="h-6 w-36" delayIndex={30} />
            <Skeleton className="mt-3 h-20 w-full" delayIndex={31} />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-12 w-full" delayIndex={32} />
              <Skeleton className="h-12 w-full" delayIndex={33} />
              <Skeleton className="h-12 w-full" delayIndex={34} />
            </div>
          </Card>
          <Card className="p-5">
            <Skeleton className="h-4 w-28" delayIndex={35} />
            <div className="mt-4 grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-full" delayIndex={index + 36} />
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export function CandidatesPageSkeleton() {
  return (
    <div className="w-full px-6 py-5">
      <HeaderSkeleton actionWidths={[104, 160]} />

      <div className="relative mt-6">
        <Skeleton className="h-[68px] w-full" delayIndex={3} />
      </div>

      <section className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <MetricCardSkeleton key={index} index={index + 4} />
        ))}
      </section>

      <Card className="mt-6">
        <ToolbarSkeleton />
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <CandidateCardSkeleton key={index} index={index + 12} />
          ))}
        </div>
        <PaginationSkeleton />
      </Card>
    </div>
  );
}

export function RegisterUserPageSkeleton() {
  return (
    <div className="w-full px-6 py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" delayIndex={1} />
        </div>
        <Skeleton shape="pill" className="h-6 w-40" delayIndex={2} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden">
            <div className="border-b border-line px-6 py-5">
              <div className="flex items-start gap-4">
                <Skeleton shape="circle" className="h-12 w-12" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-40" delayIndex={1} />
                  <Skeleton className="h-4 w-80 max-w-full" delayIndex={2} />
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Skeleton className="h-16 w-full" delayIndex={3} />
                <Skeleton className="h-16 w-full" delayIndex={4} />
                <Skeleton className="h-16 w-full md:col-span-2" delayIndex={5} />
                <Skeleton className="h-16 w-full" delayIndex={6} />
                <Skeleton className="h-16 w-full" delayIndex={7} />
                <Skeleton className="h-16 w-full" delayIndex={8} />
                <Skeleton className="h-16 w-full" delayIndex={9} />
              </div>

              <div className="space-y-3">
                <Skeleton className="h-14 w-full" delayIndex={10} />
                <Skeleton className="h-14 w-full" delayIndex={11} />
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
                <Skeleton className="h-11 w-36" delayIndex={12} />
                <Skeleton className="h-11 w-28" delayIndex={13} />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-line px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Skeleton shape="circle" className="h-12 w-12" delayIndex={14} />
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-44" delayIndex={15} />
                    <Skeleton className="h-4 w-96 max-w-full" delayIndex={16} />
                  </div>
                </div>
                <Skeleton className="h-10 w-32" delayIndex={17} />
              </div>
            </div>

            <div className="border-b border-line px-6 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Skeleton className="h-10 w-full md:max-w-md" delayIndex={18} />
                <div className="flex gap-2">
                  <Skeleton shape="pill" className="h-6 w-20" delayIndex={19} />
                  <Skeleton shape="pill" className="h-6 w-20" delayIndex={20} />
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="rounded-2xl border border-line bg-surface-soft/40 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-5 w-40" delayIndex={index + 21} />
                        <Skeleton shape="pill" className="h-6 w-16" delayIndex={index + 22} />
                        <Skeleton shape="pill" className="h-6 w-20" delayIndex={index + 23} />
                      </div>
                      <Skeleton className="h-4 w-64" delayIndex={index + 24} />
                      <Skeleton className="h-4 w-56" delayIndex={index + 25} />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-10 w-28" delayIndex={index + 26} />
                      <Skeleton className="h-10 w-36" delayIndex={index + 27} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {Array.from({ length: 4 }, (_, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center gap-3">
                <Skeleton shape="circle" className="h-10 w-10" delayIndex={index + 28} />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-36" delayIndex={index + 29} />
                  <Skeleton className="h-4 w-52" delayIndex={index + 30} />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <Skeleton className="h-14 w-full" delayIndex={index + 31} />
                <Skeleton className="h-14 w-full" delayIndex={index + 32} />
                <Skeleton className="h-14 w-full" delayIndex={index + 33} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
