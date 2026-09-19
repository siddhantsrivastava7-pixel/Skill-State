import React from "react";
import { CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert } from "lucide-react";

export interface LaterStageBannerProps {
  verifiedCount: number;
  needsStrengtheningCount: number;
  missingCount: number;
  needsProofCount: number;
  className?: string;
}

/**
 * LaterStageBanner conforming to 05_SCREEN_SPECS.md (Variant C):
 * - Displays "You are not starting from zero."
 * - Breaks down capabilities into: verified, needs strengthening, missing, needs proof
 * - Explicitly avoids a single fake "readiness %"
 */
export function LaterStageBanner({
  verifiedCount,
  needsStrengtheningCount,
  missingCount,
  needsProofCount,
  className = "",
}: LaterStageBannerProps) {
  return (
    <div
      className={`rounded-card border border-border bg-surface p-4 sm:p-5 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${className}`}
      role="region"
      aria-label="Prior capability baseline"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
          <h2 className="text-sm sm:text-base font-bold text-ink tracking-tight">
            You are not starting from zero.
          </h2>
        </div>
        <p className="text-xs text-ink-muted">
          Your existing background and coursework provide a verified foundation. Here is your baseline:
        </p>
      </div>

      {/* Metric badges: verified, needs strengthening, missing, needs proof */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
        {/* 1. Verified */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-soft border border-green/20 text-xs text-ink">
          <CheckCircle2 className="w-3.5 h-3.5 text-green shrink-0" />
          <span className="font-semibold text-green">{verifiedCount}</span>
          <span className="text-ink-muted">Verified</span>
        </div>

        {/* 2. Needs strengthening */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-ink">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-semibold text-amber-700">{needsStrengtheningCount}</span>
          <span className="text-ink-muted">Needs strengthening</span>
        </div>

        {/* 3. Missing */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-soft border border-border text-xs text-ink">
          <HelpCircle className="w-3.5 h-3.5 text-ink-muted shrink-0" />
          <span className="font-semibold text-ink">{missingCount}</span>
          <span className="text-ink-muted">Missing</span>
        </div>

        {/* 4. Needs proof */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-soft border border-accent/20 text-xs text-ink">
          <ShieldAlert className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="font-semibold text-accent">{needsProofCount}</span>
          <span className="text-ink-muted">Needs proof</span>
        </div>
      </div>
    </div>
  );
}
