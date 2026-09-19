import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "green" | "blue" | "orange" | "red";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export function Badge({
  variant = "default",
  size = "md",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center font-medium rounded-sm";

  const variantStyles = {
    default: "bg-surface-soft text-ink-muted border border-border",
    accent: "bg-accent-soft text-accent border border-accent/20",
    green: "bg-brandGreen-soft text-brandGreen border border-brandGreen/20",
    blue: "bg-brandBlue-soft text-brandBlue border border-brandBlue/20",
    orange: "bg-brandOrange-soft text-brandOrange border border-brandOrange/20",
    red: "bg-brandRed-soft text-brandRed border border-brandRed/20",
  }[variant];

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  }[size];

  return (
    <span
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
