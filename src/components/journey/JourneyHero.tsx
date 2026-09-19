"use client";

import React from "react";
import { Sprout } from "lucide-react";
import { HillBackgroundSvg } from "./HillBackgroundSvg";
import { JourneyPath, JourneyStage, CareerBranch } from "./JourneyPath";
import Link from "next/link";

export interface JourneyHeroProps {
  mode: "exploring" | "exact";
  userName: string;
  userStageDetail: string;
  userFieldOrGoal: string;
  headline?: string;
  subhead?: string;
  profileNote?: string;
  stages: JourneyStage[];
  branches: CareerBranch[];
  selectedBranchId?: string;
  onBranchPreview: (id: string) => void;
  className?: string;
}

/**
 * JourneyHero conforming to 06_COMPONENT_CATALOG.md, 04_DESIGN_SYSTEM.md, and skillstate-reference-ui.png:
 * - Editorial greeting, headline, and subhead
 * - Top right profile note card with quote and attribution
 * - Dominant scenic journey card with HillBackgroundSvg, quotes, and interactive JourneyPath
 */
export function JourneyHero({
  mode,
  userName,
  userStageDetail,
  userFieldOrGoal,
  headline,
  subhead,
  profileNote,
  stages,
  branches,
  selectedBranchId,
  onBranchPreview,
  className = "",
}: JourneyHeroProps) {
  // Default copy based on mode
  const defaultHeadline =
    mode === "exploring"
      ? "Explore your future without closing doors too early."
      : `Your shortest credible path to ${userFieldOrGoal}.`;

  const defaultSubhead =
    mode === "exploring"
      ? "Build strong foundations, try different paths, and keep your options open before you specialize."
      : "Targeted capability repair, verifiable proof artifacts, and milestone execution.";

  const defaultProfileNote =
    mode === "exploring"
      ? "Keep exploring. A wider foundation gives you more freedom later."
      : "Focus on closing critical capability gaps and generating verifiable proof.";

  return (
    <section className={`space-y-4 ${className}`} aria-label="Career Journey Hero">
      {/* ========================================================================= */}
      {/* TOP HEADER ROW: Greeting, Headline, Subhead + Profile Note Card           */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Headline Area */}
        <div className="max-w-2xl space-y-1.5">
          <div className="text-xs sm:text-sm font-medium text-ink-muted flex items-center gap-1.5">
            Good morning, {userName}! <span>👋</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-semibold text-ink tracking-tight leading-[1.18]">
            {headline || defaultHeadline}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-xl">
            {subhead || defaultSubhead}
          </p>
        </div>

        {/* Right Profile Note Card */}
        <div className="w-full lg:w-auto lg:min-w-[320px] bg-surface rounded-card border border-border p-3.5 shadow-subtle flex flex-col justify-between shrink-0">
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
                <Sprout className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-ink text-xs sm:text-sm block truncate">
                  {userName}
                </span>
                <span className="text-[11px] text-ink-muted block truncate">
                  {userStageDetail} • {userFieldOrGoal}
                </span>
              </div>
            </div>
            <Link
              href="/onboarding"
              className="text-xs font-medium text-ink-muted hover:text-ink px-2.5 py-1 rounded-pill border border-border/80 hover:bg-surface-soft transition-colors"
            >
              Edit
            </Link>
          </div>

          <div className="pt-2">
            <p className="text-xs text-ink-muted italic font-serif leading-relaxed">
              &ldquo;{profileNote || defaultProfileNote}&rdquo;
            </p>
            <span className="text-[10px] text-ink-muted/80 block text-right font-medium mt-1">
              — SkillState
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DOMINANT JOURNEY VISUALIZATION CARD                                      */}
      {/* ========================================================================= */}
      <div className="relative w-full rounded-card border border-border/90 bg-surface shadow-card overflow-hidden min-h-[390px] p-4 sm:p-6 flex flex-col justify-between">
        {/* Layered Scenic Landscape Background */}
        <HillBackgroundSvg />

        {/* Top Scenic Motivational Quote */}
        <div className="relative z-10 select-none pointer-events-none">
          <p className="font-serif italic text-ink/70 text-xs sm:text-sm tracking-wide">
            &ldquo; A strong foundation gives you the freedom to choose. &rdquo;
          </p>
        </div>

        {/* The Signature Branching Journey Path */}
        <div className="relative z-10 my-auto py-2">
          <JourneyPath
            mode={mode}
            stages={stages}
            branches={branches}
            selectedBranchId={selectedBranchId}
            onBranchPreview={onBranchPreview}
          />
        </div>

        {/* Bottom Right Scenic Brand Note */}
        <div className="relative z-10 flex justify-end select-none pointer-events-none pt-1">
          <span className="font-serif italic text-ink/75 text-xs sm:text-sm tracking-wider">
            Different paths. A brighter you.
          </span>
        </div>
      </div>
    </section>
  );
}
