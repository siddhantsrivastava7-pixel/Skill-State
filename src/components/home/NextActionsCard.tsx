"use client";

import React from "react";
import { Zap, ChevronRight } from "lucide-react";
import { ActionItem } from "@/domain/types";

export interface NextActionsCardProps {
  actions: ActionItem[];
  selectedIndex: number;
  onSelectAction: (index: number) => void;
  className?: string;
}

/**
 * NextActionsCard conforming to 06_COMPONENT_CATALOG.md, 04_DESIGN_SYSTEM.md, and skillstate-reference-ui.png:
 * - Exactly 3 next actions
 * - Interactive: clicking an action updates the "Why this?" card
 * - Circular index badges, action titles, descriptors, and chevrons
 */
export function NextActionsCard({
  actions,
  selectedIndex,
  onSelectAction,
  className = "",
}: NextActionsCardProps) {
  // Ensure exactly 3 items are rendered (fallback to clean placeholders if needed)
  const displayActions = actions.slice(0, 3);

  return (
    <div
      className={`rounded-card border border-border bg-surface p-5 sm:p-6 shadow-card flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/60">
        <div className="w-8 h-8 rounded-full bg-green-soft text-green flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 fill-green" />
        </div>
        <div>
          <h3 className="text-base font-bold text-ink leading-none">Now</h3>
          <p className="text-xs text-ink-muted mt-1">Your next best steps</p>
        </div>
      </div>

      {/* 3 Action Items */}
      <div className="divide-y divide-border/50 my-2">
        {displayActions.map((action, idx) => {
          const isSelected = selectedIndex === idx;

          return (
            <button
              key={action.id || idx}
              type="button"
              onClick={() => onSelectAction(idx)}
              className={`w-full text-left py-3.5 px-2.5 rounded-xl transition-all duration-200 flex items-center justify-between gap-3 group ${
                isSelected
                  ? "bg-surface-soft border border-border/80 shadow-subtle"
                  : "hover:bg-surface-soft/60"
              }`}
              aria-label={`Action ${idx + 1}: ${action.title}`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Number Badge */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                    isSelected
                      ? "bg-green text-white"
                      : "bg-surface-soft text-ink-muted border border-border group-hover:border-green/40 group-hover:text-ink"
                  }`}
                >
                  {idx + 1}
                </div>

                {/* Text stack */}
                <div className="min-w-0 flex-1">
                  <h4
                    className={`text-xs sm:text-sm font-semibold line-clamp-2 transition-colors leading-snug ${
                      isSelected ? "text-ink font-bold" : "text-ink group-hover:text-green"
                    }`}
                  >
                    {action.title}
                  </h4>
                  <p className="text-[11px] text-ink-muted line-clamp-2 mt-0.5 leading-relaxed">
                    {action.description || action.whyNow}
                  </p>
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                  isSelected
                    ? "text-green translate-x-0.5"
                    : "text-ink-muted/60 group-hover:text-ink group-hover:translate-x-0.5"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="pt-2 text-[11px] text-ink-muted flex items-center justify-between">
        <span>Click an action to see reasoning</span>
        <span className="font-semibold text-green">Step {selectedIndex + 1} of 3</span>
      </div>
    </div>
  );
}
