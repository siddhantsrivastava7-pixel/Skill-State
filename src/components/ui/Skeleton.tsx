import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = "rectangular",
  width,
  height,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: "h-3.5 w-full rounded-sm",
    rectangular: "rounded-card",
    circular: "rounded-full",
  }[variant];

  return (
    <div
      className={`animate-pulse bg-border/60 ${variantStyles} ${className}`}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}
