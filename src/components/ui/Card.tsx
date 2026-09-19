import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padded?: boolean;
  children: React.ReactNode;
}

export function Card({
  interactive = false,
  padded = true,
  className = "",
  children,
  ...props
}: CardProps) {
  const baseStyles =
    "bg-surface border border-border rounded-card shadow-card transition-all duration-200 ease-out";
  const interactiveStyles = interactive
    ? "hover:border-accent/40 hover:shadow-md cursor-pointer"
    : "";
  const paddingStyles = padded ? "p-5 sm:p-6" : "";

  return (
    <div
      className={`${baseStyles} ${interactiveStyles} ${paddingStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
