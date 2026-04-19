import { type CSSProperties, type HTMLAttributes } from "react";

type SkeletonVariant = "shimmer" | "pulse";
type SkeletonShape = "block" | "circle" | "pill";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  shape?: SkeletonShape;
  /** Stagger index — adds a small per-row delay so lists feel alive. */
  delayIndex?: number;
}

const shapeClass: Record<SkeletonShape, string> = {
  block: "rounded-md",
  circle: "rounded-full",
  pill: "rounded-full",
};

export function Skeleton({
  variant = "shimmer",
  shape = "block",
  delayIndex,
  className = "",
  style,
  ...rest
}: SkeletonProps) {
  const animationClass =
    variant === "shimmer"
      ? "skeleton-shimmer"
      : "animate-pulse bg-surface-soft/80";

  const delayStyle: CSSProperties | undefined =
    typeof delayIndex === "number"
      ? { animationDelay: `${delayIndex * 90}ms` }
      : undefined;

  return (
    <div
      aria-hidden
      className={`${animationClass} ${shapeClass[shape]} ${className}`.trim()}
      style={{ ...delayStyle, ...style }}
      {...rest}
    />
  );
}
