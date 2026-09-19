import React from "react";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  variant?: "accent" | "green" | "blue" | "orange";
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  max = 100,
  variant = "accent",
  size = "md",
  className = "",
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }[size];

  const variantStyles = {
    accent: "bg-accent",
    green: "bg-brandGreen",
    blue: "bg-brandBlue",
    orange: "bg-brandOrange",
  }[variant];

  return (
    <div
      className={`w-full bg-border/60 rounded-pill overflow-hidden ${sizeStyles} ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      {...props}
    >
      <div
        className={`h-full rounded-pill transition-all duration-300 ease-out ${variantStyles}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
