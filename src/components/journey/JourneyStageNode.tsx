import React from "react";

export interface JourneyStageNodeProps {
  id: string;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  state: "complete" | "current" | "future" | "decision";
  isCurrent?: boolean;
  className?: string;
}

/**
 * JourneyStageNode conforming to 06_COMPONENT_CATALOG.md and 04_DESIGN_SYSTEM.md:
 * - 44px circular node with 3px inner ring
 * - Lucide icon
 * - State variations: current (with "You are here" tooltip), complete, future, decision
 * - Title and contextual descriptor below
 */
export function JourneyStageNode({
  title,
  subtitle,
  icon,
  state,
  isCurrent = false,
  className = "",
}: JourneyStageNodeProps) {
  const isNow = isCurrent || state === "current";

  // Node circular button styling based on state
  let nodeStyle = "bg-surface border-green/60 text-green";
  let ringStyle = "ring-4 ring-green-soft";

  if (isNow) {
    nodeStyle = "bg-green text-white border-white";
    ringStyle = "ring-4 ring-green/25 shadow-sm";
  } else if (state === "decision") {
    nodeStyle = "bg-emerald-500 text-white border-white";
    ringStyle = "ring-4 ring-emerald-500/20 shadow-sm";
  } else if (state === "complete") {
    nodeStyle = "bg-green text-white border-white";
    ringStyle = "ring-2 ring-green/20";
  } else {
    // future stage
    nodeStyle = "bg-surface text-ink-muted border-green/50";
    ringStyle = "ring-4 ring-surface-soft";
  }

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* "You are here" tooltip badge */}
      {isNow && (
        <div className="absolute -top-9 z-20 flex flex-col items-center animate-fade-in pointer-events-none">
          <div className="bg-surface text-ink text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-subtle border border-border/80 tracking-tight whitespace-nowrap">
            You are here
          </div>
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-surface -mt-[1px]" />
        </div>
      )}

      {/* 44px Circular Stage Node */}
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center border-[3px] transition-transform duration-200 hover:scale-105 ${nodeStyle} ${ringStyle}`}
      >
        {icon ? (
          <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
        ) : (
          <span className="w-2.5 h-2.5 rounded-full bg-current" />
        )}
      </div>

      {/* Label and Subtitle */}
      <div className="mt-2 text-center max-w-[140px] px-1">
        <h4 className="text-xs sm:text-sm font-bold text-ink leading-snug">{title}</h4>
        <p className="text-[11px] text-ink-muted leading-tight mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
