import React from "react";

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
  clickable?: boolean;
  size?: "sm" | "md";
  children: React.ReactNode;
}

export function Pill({
  active = false,
  clickable = false,
  size = "md",
  className = "",
  children,
  ...props
}: PillProps) {
  const baseStyles =
    "inline-flex items-center font-medium rounded-pill transition-colors duration-180 ease-out select-none";

  const stateStyles = active
    ? "bg-accent text-white border border-accent"
    : clickable
    ? "bg-surface-soft text-ink-muted border border-border hover:bg-surface hover:text-ink cursor-pointer"
    : "bg-surface-soft text-ink-muted border border-border";

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs gap-1",
    md: "px-3.5 py-1.5 text-sm gap-1.5",
  }[size];

  return (
    <span
      className={`${baseStyles} ${stateStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
