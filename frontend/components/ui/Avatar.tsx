import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  online?: boolean;
  className?: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function Avatar({ name, src, size = 36, online, className }: AvatarProps) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-brand-soft text-brand font-semibold ring-1 ring-inset ring-line/60", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-label={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        initials(name)
      )}
      {online && (
        <span
          aria-hidden
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-white"
        />
      )}
    </span>
  );
}
