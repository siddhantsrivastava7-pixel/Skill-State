import React from "react";
import { Lightbulb, BarChart3 } from "lucide-react";
import { ActionItem } from "@/domain/types";

export interface WhyThisCardProps {
  selectedAction?: ActionItem;
  className?: string;
}

/**
 * WhyThisCard conforming to 06_COMPONENT_CATALOG.md, 04_DESIGN_SYSTEM.md, and skillstate-reference-ui.png:
 * - Dynamic explanation tied to the selected next action
 * - Bold key unlock statement
 * - Detailed reasoning paragraph
 * - Editorial callout pill: "One skill. Many possibilities."
 */
export function WhyThisCard({ selectedAction, className = "" }: WhyThisCardProps) {
  // Fallbacks if no action provided
  const whyNow =
    selectedAction?.whyNow ||
    "Python supports 7 of 8 possible paths and unlocks future projects.";

  // Contextual paragraph based on category or action content
  let explanation =
    "It's beginner-friendly, widely used, and gives you a strong foundation for AI, data, backend, and more. By learning it now, you keep more doors open.";

  let badgeText = "One skill. Many possibilities.";

  if (selectedAction) {
    if (selectedAction.category === "build") {
      explanation =
        "Building a functional prototype early converts theoretical knowledge into verifiable proof. It cements your programming logic while keeping your options open across software domains.";
      badgeText = "Tangible proof. Greater credibility.";
    } else if (selectedAction.category === "signal" || selectedAction.title.toLowerCase().includes("explore")) {
      explanation =
        "Comparing daily responsibilities and technical stacks between adjacent roles prevents early tunnel vision. You discover genuine interests before reaching the specialization decision point.";
      badgeText = "Informed clarity. Lower regret.";
    } else if (selectedAction.category === "prove") {
      explanation =
        "Verifying your existing capability through targeted proof tasks satisfies external expectations and closes the gap between self-reported knowledge and credible evidence.";
      badgeText = "Credible evidence. Zero guesswork.";
    }
  }

  return (
    <div
      className={`rounded-card border border-border bg-surface p-5 sm:p-6 shadow-card flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/60">
        <div className="w-8 h-8 rounded-full bg-orange-soft text-orange flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4 fill-orange" />
        </div>
        <div>
          <h3 className="text-base font-bold text-ink leading-none">Why this?</h3>
          <p className="text-xs text-ink-muted mt-1">Here&apos;s why we recommend this now</p>
        </div>
      </div>

      {/* Main Rationale Body */}
      <div className="space-y-3 my-auto py-3">
        <h4 className="text-sm sm:text-base font-bold text-ink leading-snug">
          {whyNow}
        </h4>
        <p className="text-xs text-ink-muted leading-relaxed">
          {explanation}
        </p>
      </div>

      {/* Editorial Pill Callout */}
      <div className="rounded-xl bg-green-soft/70 border border-green/20 p-3 flex items-center gap-2.5 text-xs text-ink">
        <div className="w-6 h-6 rounded-md bg-green/15 text-green flex items-center justify-center shrink-0">
          <BarChart3 className="w-3.5 h-3.5 text-green" />
        </div>
        <span className="font-semibold text-green">{badgeText}</span>
      </div>
    </div>
  );
}
