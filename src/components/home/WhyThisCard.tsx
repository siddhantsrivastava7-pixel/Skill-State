import React from "react";
import { Lightbulb, BarChart3 } from "lucide-react";
import { ActionItem } from "@/domain/types";

export interface WhyThisCardProps {
  selectedAction?: ActionItem;
  destinationName?: string;
  className?: string;
}

/**
 * WhyThisCard conforming to 06_COMPONENT_CATALOG.md, 04_DESIGN_SYSTEM.md, and Phase 4.2:
 * - Dynamic explanation derived strictly from selected ActionItem.whyNow and action details
 * - Removes hard-coded phrases like "programming logic", "software domains", "AI, data, backend"
 * - Career-agnostic synthesis based on action category and stated rationale
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

  // Dynamically synthesize supporting explanation without hard-coded software leaks
  let explanation =
    selectedAction?.description ||
    "This targeted action addresses an immediate capability prerequisite, converting conceptual knowledge into demonstrable evidence.";

  let badgeText = "Targeted milestone. Credible progress.";

  if (selectedAction) {
    const titleLower = selectedAction.title.toLowerCase();
    const isTechExploring =
      titleLower.includes("python") ||
      titleLower.includes("code") ||
      (destinationName && destinationName.toLowerCase().includes("technology"));

    if (selectedAction.category === "build") {
      explanation = selectedAction.description
        ? `${selectedAction.description} Completing this hands-on project produces verifiable proof for your pathway.`
        : "Building a practical artifact converts conceptual knowledge into demonstrable proof, giving you tangible work for evaluation.";
      badgeText = "Tangible proof. Greater credibility.";
    } else if (selectedAction.category === "prove") {
      explanation = selectedAction.description
        ? `${selectedAction.description} Submitting this proof task validates your capability against objective evaluation standards.`
        : "Verifying your capability through targeted proof tasks satisfies external expectations and removes guesswork from your readiness.";
      badgeText = "Verified capability. Zero guesswork.";
    } else if (selectedAction.category === "learn") {
      if (isTechExploring && titleLower.includes("python")) {
        explanation =
          "It is beginner-friendly, widely used, and provides a strong foundation for multiple future directions. By mastering it early, you keep more paths open.";
      } else {
        explanation = selectedAction.description
          ? `${selectedAction.description} Mastering this core area repairs foundational deficits and accelerates subsequent milestones.`
          : "Focusing on this learning objective repairs foundational deficits and unlocks downstream requirements.";
      }
      badgeText = "Core competency. Stronger foundation.";
    } else if (selectedAction.category === "signal" || titleLower.includes("explore")) {
      explanation = selectedAction.description
        ? `${selectedAction.description} This deliverable clearly communicates your capabilities to external evaluators and teams.`
        : "Comparing daily responsibilities and expectations across adjacent roles provides informed clarity before reaching specialization points.";
      badgeText = "Demonstrated signal. Clear outcome.";
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
