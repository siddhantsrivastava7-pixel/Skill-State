import React from "react";
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

export interface InlineNoticeProps {
  variant?: "info" | "success" | "warning" | "danger" | "neutral";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function InlineNotice({
  variant = "info",
  title,
  children,
  className = "",
}: InlineNoticeProps) {
  const config = {
    info: {
      bg: "bg-brandBlue-soft",
      border: "border-brandBlue/20",
      text: "text-brandBlue",
      icon: <Info className="w-4 h-4 text-brandBlue flex-shrink-0 mt-0.5" />,
    },
    success: {
      bg: "bg-brandGreen-soft",
      border: "border-brandGreen/20",
      text: "text-brandGreen",
      icon: <CheckCircle2 className="w-4 h-4 text-brandGreen flex-shrink-0 mt-0.5" />,
    },
    warning: {
      bg: "bg-brandOrange-soft",
      border: "border-brandOrange/20",
      text: "text-brandOrange",
      icon: <AlertTriangle className="w-4 h-4 text-brandOrange flex-shrink-0 mt-0.5" />,
    },
    danger: {
      bg: "bg-brandRed-soft",
      border: "border-brandRed/20",
      text: "text-brandRed",
      icon: <AlertCircle className="w-4 h-4 text-brandRed flex-shrink-0 mt-0.5" />,
    },
    neutral: {
      bg: "bg-surface-soft",
      border: "border-border",
      text: "text-ink-muted",
      icon: <Info className="w-4 h-4 text-ink-muted flex-shrink-0 mt-0.5" />,
    },
  }[variant];

  return (
    <div
      className={`flex items-start gap-2.5 p-3.5 rounded-sm border ${config.bg} ${config.border} ${className}`}
      role="note"
    >
      {config.icon}
      <div className="flex-1 text-xs leading-relaxed text-ink">
        {title && <span className="font-semibold block mb-0.5">{title}</span>}
        <div>{children}</div>
      </div>
    </div>
  );
}
