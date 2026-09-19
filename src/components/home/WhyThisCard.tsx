import React from "react";
import { Lightbulb, BarChart3 } from "lucide-react";
import { ActionItem } from "@/domain/types";

export interface WhyThisCardProps {
  selectedAction?: ActionItem;
  destinationName?: string;
  className?: string;
}

/**
 * WhyThisCard conforming to reusable UI architecture:
 * - Content comes strictly from selectedAction.whyNow and selectedAction.description
 * - Contains NO career- or persona-specific action strings or branching
 * - Editorial badge derived generically from ActionCategory
 */
export function WhyThisCard({
  selectedAction,
  destinationName,
  className = "",
}: WhyThisCardProps) {
  // Primary rationale directly from the selected ActionItem
  const whyNow =
    selectedAction?.whyNow ||
    (destinationName
      ? `Builds essential foundations aligned with ${destinationName}.`
      : "Builds essential foundational capabilities and unlocks subsequent milestones.");

  // Supporting explanation directly from the selected ActionItem description
  const explanation =
    selectedAction?.description ||
    "This targeted action addresses an immediate capability prerequisite, converting conceptual knowledge into demonstrable evidence.";

  // Editorial pill callout derived generically from category
  let badgeText = "Targeted milestone. Credible progress.";

  if (selectedAction) {
    switch (selectedAction.category) {
      case "build":
        badgeText = "Tangible proof. Greater credibility.";
        break;
      case "prove":
        badgeText = "Verified capability. Zero guesswork.";
        break;
      case "learn":
        badgeText = "Core competency. Stronger foundation.";
        break;
      case "signal":
        badgeText = "Demonstrated signal. Clear outcome.";
        break;
      case "experience":
        badgeText = "Practical application. Real-world context.";
        break;
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
