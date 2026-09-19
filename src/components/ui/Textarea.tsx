import React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = "", id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-ink">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
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

Textarea.displayName = "Textarea";
