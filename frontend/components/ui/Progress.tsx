import { cn } from "@/lib/cn";

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
}

export function Progress({ value, className, barClassName }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-soft", className)}
    >
      <div className={cn("h-full bg-brand transition-[width]", barClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}
