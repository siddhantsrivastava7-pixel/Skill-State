"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Compass,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import { simulateWhatIf, WhatIfSimulationResult } from "@/domain/what-if";
import { preserveEvidenceOnDestinationChange } from "@/domain/destination-switch";
import {
  calculateCareerPathsWithOverlap,
  CareerPathItem,
} from "@/data/library/careers-library";
import { getClientAIProvider } from "@/agent/client-provider";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { InlineNotice } from "@/components/ui/InlineNotice";
import { formatPlanningHorizonLabel } from "@/domain/planning-horizon";
import { planDestinationSwitch } from "@/domain/destination-planning";

export interface WhatIfSimulatorProps {
  onApplied?: () => void;
  onClose?: () => void;
  initialDestinationId?: string;
  candidatePaths?: CareerPathItem[];
}

export function WhatIfSimulator({
  onApplied,
  onClose,
  initialDestinationId,
  candidatePaths,
}: WhatIfSimulatorProps) {
  const profile = useSkillStateStore((s) => s.profile);
  const destination = useSkillStateStore((s) => s.destination);
  const destinationGraph = useSkillStateStore((s) => s.destinationGraph);
  const claimedStates = useSkillStateStore((s) => s.claimedStates);
  const verifiedStates = useSkillStateStore((s) => s.verifiedStates);
  const evidence = useSkillStateStore((s) => s.evidence);
  const isDemoState = useSkillStateStore((s) => s.isDemoState);
  const changeDestination = useSkillStateStore((s) => s.changeDestination);
  const setProfile = useSkillStateStore((s) => s.setProfile);
  const setPlan = useSkillStateStore((s) => s.setPlan);

  const availableCandidates = useMemo(
    () => candidatePaths ?? calculateCareerPathsWithOverlap(destinationGraph, verifiedStates, isDemoState),
    [candidatePaths, destinationGraph, verifiedStates, isDemoState]
  );

  // Simulation parameters (purely local state, zero mutation to store during preview)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(() => {
    if (initialDestinationId) return initialDestinationId;
    const match = availableCandidates.find(
      (candidate) => candidate.graph.destinationName.toLowerCase() === destination.toLowerCase()
    );
    return match?.id ?? availableCandidates[0].id;
  });

  const [simWeeklyHours, setSimWeeklyHours] = useState<number>(profile.weeklyHours || 10);
  const [simTimelineMonths, setSimTimelineMonths] = useState<number>(
    profile.targetTimelineMonths || 12
  );
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [compiledGraphs, setCompiledGraphs] = useState<Record<string, typeof destinationGraph>>({});
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewRetryNonce, setPreviewRetryNonce] = useState(0);

  // Find candidate graph
  const selectedCandidate = useMemo(() => {
    return availableCandidates.find((candidate) => candidate.id === selectedCandidateId) ?? availableCandidates[0];
  }, [availableCandidates, selectedCandidateId]);

  useEffect(() => {
    if (!selectedCandidate.isPreview || isDemoState || compiledGraphs[selectedCandidate.id]) {
      setPreviewError("");
      setIsLoadingPreview(false);
      return;
    }

    let active = true;
    setIsLoadingPreview(true);
    setPreviewError("");
    getClientAIProvider()
      .compileDestination({
        stage: profile.stage,
        certainty: "exact",
        statedDestination: selectedCandidate.title,
        interests: profile.interests,
        timelineMonths: simTimelineMonths,
        planningHorizon: profile.planningHorizon,
      })
      .then((graph) => {
        if (active) {
          setCompiledGraphs((current) => ({ ...current, [selectedCandidate.id]: graph }));
        }
      })
      .catch((error) => {
        if (active) {
          setPreviewError(
            error instanceof Error
              ? error.message
              : "This adjacent destination preview could not be compiled."
          );
        }
      })
      .finally(() => {
        if (active) setIsLoadingPreview(false);
      });

    return () => {
      active = false;
    };
  }, [
    compiledGraphs,
    isDemoState,
    previewRetryNonce,
    profile.interests,
    profile.planningHorizon,
    profile.stage,
    selectedCandidate,
    simTimelineMonths,
  ]);

  const selectedGraph = compiledGraphs[selectedCandidate.id] ?? selectedCandidate.graph;

  // Execute pure simulation
  const simulation: WhatIfSimulationResult = useMemo(() => {
    return simulateWhatIf({
      currentEvidence: evidence,
      currentVerifiedStates: verifiedStates,
      currentClaimedStates: claimedStates,
      currentProfile: profile,
      candidateGraph: selectedGraph,
      simulatedWeeklyHours: simWeeklyHours,
      simulatedTimelineMonths: simTimelineMonths,
    });
  }, [
    evidence,
    verifiedStates,
    claimedStates,
    profile,
    selectedGraph,
    simWeeklyHours,
    simTimelineMonths,
  ]);

  // Apply to real plan upon explicit user action
  const handleApply = async () => {
    const startedAt = typeof performance === "undefined" ? 0 : performance.now();
    setIsApplying(true);
    setApplyError("");
    const nextProfile =
      simWeeklyHours !== profile.weeklyHours ||
      simTimelineMonths !== profile.targetTimelineMonths
        ? {
        ...profile,
        weeklyHours: simWeeklyHours,
        targetTimelineMonths: simTimelineMonths,
      }
        : profile;

    try {
      const switchResult = preserveEvidenceOnDestinationChange({
        currentEvidence: evidence,
        currentVerifiedStates: verifiedStates,
        currentClaimedStates: claimedStates,
        newGraph: selectedGraph,
        targetTimelineMonths: simTimelineMonths,
      });
      const nextPlan = await planDestinationSwitch({
        profile: nextProfile,
        graph: selectedGraph,
        verifiedStates: switchResult.updatedVerifiedStates,
        claimedStates: switchResult.preservedClaimedStates,
        gaps: switchResult.recomputedGaps,
        planningReason: "full-what-if",
      }, !selectedCandidate.isPreview, getClientAIProvider());

      setProfile(nextProfile);
      if (selectedGraph.destinationName !== destination) {
        changeDestination(selectedGraph.destinationName, selectedGraph);
      }
      setPlan(nextPlan);
      if (process.env.NODE_ENV === "development" && startedAt) {
        console.info(
          `[SkillState] Applied ${selectedCandidate.isPreview ? "generated" : "seeded"} destination in ${Math.round(performance.now() - startedAt)}ms.`
        );
      }
      setAppliedSuccess(true);
      setTimeout(() => {
        onApplied?.();
        onClose?.();
      }, 800);
    } catch (error) {
      setApplyError(
        error instanceof Error
          ? error.message
          : "The What-If journey could not be applied. Your current journey was not changed."
      );
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6 border-2 border-accent/30 bg-surface shadow-card space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-ink">What-If Journey Simulator</h2>
              <Badge variant="accent" size="sm">
                Non-Destructive Preview
              </Badge>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Simulate candidate career targets, weekly time commitments, or timelines with 100% evidence preservation.
            </p>
          </div>
        </div>

        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close Preview
          </Button>
        )}
      </div>

      {/* 2. Simulation Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-surface-soft/80 border border-border/70">
        {/* Destination Selector */}
        <div className="space-y-1.5">
          <label htmlFor="whatif-dest-select" className="block text-xs font-bold text-ink">
            Simulate Destination:
          </label>
          <select
            id="whatif-dest-select"
            value={selectedCandidateId}
            onChange={(e) => setSelectedCandidateId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-lg text-ink font-medium focus:outline-hidden focus:ring-2 focus:ring-accent/20 focus:border-accent"
          >
            {availableCandidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.graph.destinationName} ({c.field})
              </option>
            ))}
          </select>
          <span className="text-[10px] text-ink-muted block">
            Current: <strong className="text-ink">{destination}</strong>
          </span>
        </div>

        {/* Weekly Hours Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="whatif-hours-slider" className="text-xs font-bold text-ink">
              Weekly Study Commitment:
            </label>
            <span className="text-xs font-semibold text-accent">{simWeeklyHours} hrs/wk</span>
          </div>
          <input
            id="whatif-hours-slider"
            type="range"
            min={3}
            max={35}
            step={1}
            value={simWeeklyHours}
            onChange={(e) => setSimWeeklyHours(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-ink-muted">
            <span>Casual (5h)</span>
            <span>Balanced (15h)</span>
            <span>Intensive (30h+)</span>
          </div>
        </div>

        {/* Planning Horizon Selector */}
        <div className="space-y-1.5">
          <label htmlFor="whatif-timeline-select" className="block text-xs font-bold text-ink">
            Target Horizon:
          </label>
          <select
            id="whatif-timeline-select"
            value={simTimelineMonths}
            onChange={(e) => setSimTimelineMonths(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-lg text-ink font-medium focus:outline-hidden focus:ring-2 focus:ring-accent/20 focus:border-accent"
          >
            <option value={6}>6 Months (Accelerated)</option>
            <option value={12}>12 Months (Standard Horizon)</option>
            <option value={18}>18 Months (Comprehensive)</option>
            <option value={24}>24 Months (Deep Degree Track)</option>
          </select>
          <span className="text-[10px] text-ink-muted block">
            Current Target: <strong className="text-ink">{formatPlanningHorizonLabel(profile.planningHorizon, profile.targetTimelineMonths)}</strong>
          </span>
        </div>
      </div>

      {/* 3. Live Simulation Preview Metrics */}
      <div className="space-y-4">
        {isLoadingPreview && (
          <InlineNotice variant="info" title="Compiling adjacent destination preview">
            Building capability data for {selectedCandidate.title} without changing your active journey.
          </InlineNotice>
        )}
        {previewError && (
          <InlineNotice variant="danger" title="Destination preview unavailable">
            <span>{previewError} Your active journey remains unchanged.</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreviewRetryNonce((value) => value + 1)}
              className="ml-3"
            >
              Retry
            </Button>
          </InlineNotice>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Simulation Impact & Transferability
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <ShieldCheck className="w-4 h-4 text-brandGreen" />
            <span>100% Evidence Preserved</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Metric 1: Preserved Foundations */}
          <div className="p-4 rounded-xl border border-brandGreen/30 bg-brandGreen-soft/40 space-y-1">
            <span className="text-[11px] font-semibold text-brandGreen uppercase tracking-wider block">
              Preserved Foundations
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-brandGreen">
                {simulation.preservedFoundationCount}
              </span>
              <span className="text-xs text-ink-muted">
                ({simulation.transferOverlapPercentage}% transfer)
              </span>
            </div>
            <p className="text-[11px] text-ink-muted leading-tight">
              Verified capabilities that carry over immediately with zero duplicate learning.
            </p>
          </div>

          {/* Metric 2: New Requirements */}
          <div className="p-4 rounded-xl border border-brandOrange/30 bg-brandOrange-soft/40 space-y-1">
            <span className="text-[11px] font-semibold text-brandOrange uppercase tracking-wider block">
              New Requirements
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-brandOrange">
                {simulation.newRequirementCount}
              </span>
              <span className="text-xs text-ink-muted">capabilities to bridge</span>
            </div>
            <p className="text-[11px] text-ink-muted leading-tight">
              Target competencies requiring learning, proof tasks, and verification.
            </p>
          </div>

          {/* Metric 3: Projected Duration */}
          <div className="p-4 rounded-xl border border-accent/30 bg-accent-soft/40 space-y-1">
            <span className="text-[11px] font-semibold text-accent uppercase tracking-wider block">
              Projected Timeline
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-accent">
                {simulation.projectedTimelineMonths} mo
              </span>
              {simulation.timelineDeltaMonths !== 0 && (
                <span
                  className={`text-xs font-semibold ${
                    simulation.timelineDeltaMonths < 0 ? "text-brandGreen" : "text-brandOrange"
                  }`}
                >
                  ({simulation.timelineDeltaMonths > 0 ? "+" : ""}
                  {simulation.timelineDeltaMonths} mo vs target)
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-muted leading-tight">
              Estimated duration at {simulation.simulatedWeeklyHours} hrs/week focused commitment.
            </p>
          </div>
        </div>

        {/* Detailed Preserved Capabilities Chips */}
        <div className="p-3.5 rounded-xl bg-surface-soft border border-border/70 space-y-2">
          <span className="text-xs font-bold text-ink block">
            Transferable Verified Foundations:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {simulation.preservedFoundations.length === 0 ? (
              <span className="text-xs text-ink-muted">
                No matching verified capabilities for this target path yet.
              </span>
            ) : (
              simulation.preservedFoundations.map((n) => (
                <span
                  key={n.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-brandGreen-soft text-brandGreen border border-brandGreen/20 font-medium"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {n.name}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Simulated Milestones Preview */}
        <div className="p-3.5 rounded-xl bg-surface-soft border border-border/70 space-y-2.5">
          <span className="text-xs font-bold text-ink block">
            Simulated Milestone Roadmap:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {simulation.milestonesPreview.map((ms, idx) => (
              <div
                key={ms.id}
                className="p-2.5 rounded-lg border border-border bg-surface text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">
                    M{idx + 1}: {ms.title}
                  </span>
                  <Badge variant="default" size="sm">
                    Target: Month {ms.targetMonth}
                  </Badge>
                </div>
                <span className="text-[11px] text-ink-muted block">
                  Evidence requirements: {ms.evidenceNeeded.length} capability(ies)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Action Footer */}
      {applyError && (
        <InlineNotice variant="danger" title="What-If recomputation failed">
          {applyError} Your current journey remains unchanged.
        </InlineNotice>
      )}

      <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-ink-muted">
          <span>
            {simulation.isSameDestination
              ? "Simulating pacing adjustments for your current destination."
              : `Switching to ${simulation.candidateDestinationName} will recompute your roadmap while retaining all historical evidence.`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Discard Preview
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            disabled={isApplying || isLoadingPreview || Boolean(previewError)}
            className="text-xs gap-1.5 min-w-[170px] shadow-xs"
          >
            {isApplying ? (
              "Recomputing…"
            ) : appliedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Applied to Journey!
              </>
            ) : (
              <>
                Apply to My Journey <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
