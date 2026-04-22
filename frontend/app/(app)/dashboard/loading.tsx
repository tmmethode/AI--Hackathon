import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" delayIndex={1} />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" delayIndex={2} />
          <Skeleton className="h-10 w-36" delayIndex={3} />
          <Skeleton className="h-10 w-36" delayIndex={4} />
        </div>
      </div>

      <section className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between">
              <Skeleton shape="circle" className="h-9 w-9" delayIndex={index + 5} />
              <Skeleton shape="pill" className="h-6 w-24" delayIndex={index + 6} />
            </div>
            <Skeleton className="mt-7 h-4 w-32" delayIndex={index + 7} />
            <Skeleton className="mt-2 h-8 w-20" delayIndex={index + 8} />
          </Card>
        ))}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_314px]">
        <Card>
          <CardHeader
            title={<Skeleton className="h-6 w-48" delayIndex={20} />}
            description={<Skeleton className="mt-2 h-4 w-80 max-w-full" delayIndex={21} />}
            action={<Skeleton className="h-8 w-28" delayIndex={22} />}
          />
          <div className="divide-y divide-line">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className={`grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-[1.6fr_1fr_1.3fr_1fr_100px] md:items-center md:gap-4 ${
                  index % 2 === 1 ? "bg-surface-soft/30" : "bg-surface"
                }`}
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" delayIndex={index + 23} />
                  <Skeleton className="h-3 w-20" delayIndex={index + 24} />
                </div>
                <Skeleton className="h-4 w-24" delayIndex={index + 25} />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-10" delayIndex={index + 26} />
                  <Skeleton className="h-2 w-16" delayIndex={index + 27} />
                </div>
                <Skeleton shape="pill" className="h-6 w-20" delayIndex={index + 28} />
                <div className="md:text-right">
                  <Skeleton className="h-8 w-16" delayIndex={index + 29} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <Skeleton className="h-5 w-48" delayIndex={40} />
            <Skeleton className="mt-2 h-4 w-52" delayIndex={41} />
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="rounded-md border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Skeleton className="h-4 w-36" delayIndex={index + 42} />
                    <Skeleton shape="pill" className="h-6 w-14" delayIndex={index + 43} />
                  </div>
                  <Skeleton className="mt-2 h-3 w-32" delayIndex={index + 44} />
                  <Skeleton className="mt-3 h-8 w-full" delayIndex={index + 45} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <Skeleton className="h-4 w-28" delayIndex={46} />
            <div className="mt-4 flex flex-col gap-2">
              <Skeleton className="h-11 w-full" delayIndex={47} />
              <Skeleton className="h-11 w-full" delayIndex={48} />
              <Skeleton className="h-11 w-full" delayIndex={49} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
