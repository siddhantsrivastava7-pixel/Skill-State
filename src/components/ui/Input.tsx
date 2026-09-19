import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-ink">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2 text-sm bg-surface text-ink border rounded-sm transition-colors duration-180 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-surface-soft disabled:text-ink-muted placeholder:text-ink-muted/50 ${
            error
              ? "border-brandRed focus:border-brandRed focus:ring-brandRed/20"
              : "border-border focus:border-accent"
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-brandRed">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-ink-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
