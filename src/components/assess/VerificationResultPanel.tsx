"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  PlusCircle,
  RefreshCw,
  Clock,
  ShieldAlert,
  FileCheck,
  Check,
} from "lucide-react";
import { VerificationTransitionResult } from "@/domain/state-transition";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface VerificationResultPanelProps {
  result: VerificationTransitionResult;
}

export function VerificationResultPanel({ result }: VerificationResultPanelProps) {
  const { stateTransition, newEvidence, planChangeExplanation, updatedPlan, impactBreakdown } = result;
  const { previousState, newState, passed, capabilityId } = stateTransition;

  const isStateUnchanged = previousState === newState;

  const { added = [], reprioritized = [], movedLaterOrUnchanged = [] } =
    impactBreakdown?.categories ?? {};

  const directChanges = impactBreakdown?.directChanges ?? [];
  const existingGaps = impactBreakdown?.existingGapsReprioritized ?? [];

  return (
    <div className="p-5 rounded-card border-2 border-accent/40 bg-accent-soft/30 shadow-card animate-in fade-in duration-200 space-y-5">
      {/* 1. Header & State Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-accent/20">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
              passed
                ? "bg-brandGreen-soft text-brandGreen"
                : "bg-brandOrange-soft text-brandOrange"
            }`}
          >
            {passed ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">
              {passed
                ? "Verification Confirmed: Capability Verified"
                : "Verification Evaluated: Gap Exposed"}
            </h3>

            {/* If previousState === newState, do not headline State updated X -> X.
                Instead display: Capability state remains: Developing */}
            {isStateUnchanged ? (
              <div className="mt-0.5 space-y-1">
                <p className="text-xs text-ink font-semibold">
                  Capability state remains:{" "}
                  <span
                    className={
                      passed
                        ? "text-brandGreen capitalize"
                        : "text-brandOrange capitalize"
                    }
                  >
                    {newState}
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                  <span className="inline-flex items-center gap-1 font-medium text-ink">
                    <FileCheck className="w-3 h-3 text-accent" />
                    New evidence recorded: {newEvidence.title}
                  </span>
                  <span>·</span>
                  <span>
                    Gap impact:{" "}
                    <strong className="text-ink">
                      {passed
                        ? "Prerequisite status verified"
                        : "Reinforcement required before downstream progression"}
                    </strong>
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-muted mt-0.5">
                State updated:{" "}
                <strong className="text-ink capitalize">{previousState}</strong>
                {" "}→{" "}
                <strong
                  className={
                    passed
                      ? "text-brandGreen capitalize"
                      : "text-brandOrange capitalize"
                  }
                >
                  {newState}
                </strong>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/">
            <Button size="sm" variant="primary" className="text-xs gap-1.5 shadow-xs">
              View Updated Home Plan <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <Link href="/skills">
            <Button size="sm" variant="secondary" className="text-xs gap-1.5">
              View Capability Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Visible "Why your plan changed" callout */}
      <div className="p-4 rounded-xl bg-surface border border-accent/30 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
            Why your plan changed
          </h4>
        </div>

        <p className="text-xs text-ink font-medium leading-relaxed">
          {planChangeExplanation}
        </p>

        {/* Semantic distinction between direct changes vs reprioritized existing gaps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Direct changes caused by submitted verification */}
          <div className="p-3 rounded-lg bg-surface-soft border border-border/70 space-y-1.5">
            <span className="text-[11px] font-bold text-ink uppercase tracking-wider flex items-center gap-1">
              <Check className="w-3 h-3 text-accent" />
              Direct Changes from Verification
            </span>
            <div className="space-y-1 text-xs">
              {directChanges.map((dc, idx) => (
                <div key={idx} className="text-ink">
                  <strong className="text-ink font-semibold">{dc.title}: </strong>
                  <span className="text-ink-muted">{dc.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Existing gaps that were reprioritized (explicitly not created by this assessment) */}
          <div className="p-3 rounded-lg bg-surface-soft border border-border/70 space-y-1.5">
            <span className="text-[11px] font-bold text-ink uppercase tracking-wider flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-brandOrange" />
              Reprioritized Existing Gaps
            </span>
            {existingGaps.length === 0 ? (
              <p className="text-xs text-ink-muted">
                No unrelated existing gaps reprioritized.
              </p>
            ) : (
              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-ink-muted italic block">
                  Re-evaluated during plan recomputation (pre-existing, not created by this assessment):
                </span>
                {existingGaps.map((eg, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 text-ink">
                    <div>
                      <strong className="text-ink font-semibold">{eg.capabilityName}</strong>
                      <span className="text-ink-muted block text-[11px]">{eg.reason}</span>
                    </div>
                    <Badge variant="orange" size="sm" className="shrink-0 text-[10px]">
                      {eg.priority} priority
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. The Three Categories Breakdown: Added | Reprioritized | Moved later / Unchanged */}
        <div className="pt-3 border-t border-border/60 space-y-2.5">
          <span className="text-xs font-bold text-ink block uppercase tracking-wider">
            Plan Impact Categories
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Category 1: Added */}
            <div className="p-3 rounded-lg bg-brandGreen-soft/30 border border-brandGreen/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brandGreen flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5" />
                  Added
                </span>
                <span className="text-[10px] text-ink-muted font-medium">
                  {added.length} item{added.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="space-y-1.5">
                {added.length === 0 ? (
                  <p className="text-[11px] text-ink-muted">No new additions.</p>
                ) : (
                  added.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded bg-surface border border-brandGreen/20 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-ink text-[11px] truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge variant="green" size="sm" className="text-[9px] px-1 py-0 shrink-0">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-ink-muted leading-tight line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Category 2: Reprioritized */}
            <div className="p-3 rounded-lg bg-brandOrange-soft/30 border border-brandOrange/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brandOrange flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reprioritized
                </span>
                <span className="text-[10px] text-ink-muted font-medium">
                  {reprioritized.length} item{reprioritized.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="space-y-1.5">
                {reprioritized.length === 0 ? (
                  <p className="text-[11px] text-ink-muted">No priority shifts.</p>
                ) : (
                  reprioritized.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded bg-surface border border-brandOrange/20 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-ink text-[11px] truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge variant="orange" size="sm" className="text-[9px] px-1 py-0 shrink-0">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-ink-muted leading-tight line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Category 3: Moved later / Unchanged */}
            <div className="p-3 rounded-lg bg-surface-soft border border-border/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-ink-muted" />
                  Moved later / Unchanged
                </span>
                <span className="text-[10px] text-ink-muted font-medium">
                  {movedLaterOrUnchanged.length} item{movedLaterOrUnchanged.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="space-y-1.5">
                {movedLaterOrUnchanged.length === 0 ? (
                  <p className="text-[11px] text-ink-muted">No deferred items.</p>
                ) : (
                  movedLaterOrUnchanged.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded bg-surface border border-border/60 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-ink text-[11px] truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge variant="default" size="sm" className="text-[9px] px-1 py-0 shrink-0">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-ink-muted leading-tight line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Updated Now actions preview */}
        <div className="mt-3 pt-3 border-t border-border/60">
          <span className="text-[11px] font-semibold text-ink-muted block mb-2">
            Active Today&apos;s Plan Actions:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {updatedPlan.now.map((action) => {
              const isNewRepair =
                action.id.includes("act-repair") ||
                action.title.toLowerCase().includes("repair");
              return (
                <div
                  key={action.id}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                    isNewRepair
                      ? "bg-accent-soft/60 border-accent text-accent font-semibold"
                      : "bg-surface-soft border-border text-ink"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{action.title}</span>
                      {isNewRepair && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-accent text-white font-bold shrink-0">
                          NEW
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-ink-muted block mt-0.5 capitalize">
                      {action.category} · {action.estimatedMinutes}m · {action.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
