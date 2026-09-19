import {
  CapabilityNode,
  DestinationGraph,
  Evidence,
  LearnerProfile,
  PlanMilestone,
  SkillClaim,
  VerifiedCapabilityState,
} from "./types";
import { preserveEvidenceOnDestinationChange } from "./destination-switch";
import { prioritizeGaps, ScoredGap } from "./prioritization";

export interface WhatIfSimulationInput {
  currentEvidence: Evidence[];
  currentVerifiedStates: Record<string, VerifiedCapabilityState>;
  currentClaimedStates: Record<string, SkillClaim>;
  currentProfile: LearnerProfile;
  candidateGraph: DestinationGraph;
  simulatedWeeklyHours?: number;
  simulatedTimelineMonths?: number;
}

export interface WhatIfSimulationResult {
  candidateDestinationName: string;
  candidateDestinationId: string;
  preservedFoundations: CapabilityNode[];
  preservedFoundationCount: number;
  newRequiredCapabilities: CapabilityNode[];
  newRequirementCount: number;
  transferOverlapPercentage: number;
  recomputedGaps: ScoredGap[];
  simulatedWeeklyHours: number;
  projectedTimelineMonths: number;
  timelineDeltaMonths: number;
  milestonesPreview: PlanMilestone[];
  simulatedPlanSummary: string;
  isSameDestination: boolean;
}

/**
 * Pure, non-destructive What-If simulator.
 * Preserves 100% of historical evidence and verified capability states.
 * Previews future roadmap, transfer overlap, and projected timeline without mutating store state.
 */
export function simulateWhatIf(input: WhatIfSimulationInput): WhatIfSimulationResult {
  const {
    currentEvidence,
    currentVerifiedStates,
    currentClaimedStates,
    currentProfile,
    candidateGraph,
    simulatedWeeklyHours = currentProfile.weeklyHours || 10,
    simulatedTimelineMonths = currentProfile.targetTimelineMonths || 12,
  } = input;

  // 1. Reconcile evidence and verified states against candidate graph (non-destructive)
  const switchResult = preserveEvidenceOnDestinationChange({
    currentEvidence,
    currentVerifiedStates,
    currentClaimedStates,
    newGraph: candidateGraph,
    targetTimelineMonths: simulatedTimelineMonths,
  });

  // 2. Identify preserved foundations vs new requirements
  const preservedFoundations: CapabilityNode[] = [];
  const newRequiredCapabilities: CapabilityNode[] = [];

  for (const node of candidateGraph.capabilityNodes) {
    const vState = switchResult.updatedVerifiedStates[node.id];
    if (vState && vState.state === "verified") {
      preservedFoundations.push(node);
    } else {
      newRequiredCapabilities.push(node);
    }
  }

  const totalNodes = candidateGraph.capabilityNodes.length;
  const transferOverlapPercentage =
    totalNodes > 0 ? Math.round((preservedFoundations.length / totalNodes) * 100) : 0;

  // 3. Recompute gaps for candidate destination
  const recomputedGaps = prioritizeGaps({
    graph: candidateGraph,
    verifiedStates: switchResult.updatedVerifiedStates,
    claimedStates: switchResult.preservedClaimedStates,
    targetTimelineMonths: simulatedTimelineMonths,
  });

  // 4. Calculate projected duration based on weekly hours
  // Average ~35 hours of focused learning & verification per unverified capability
  const totalEstimatedHours = newRequiredCapabilities.length * 35;
  const effectiveWeeklyHours = Math.max(1, simulatedWeeklyHours);
  const projectedWeeks = Math.max(4, Math.ceil(totalEstimatedHours / effectiveWeeklyHours));
  const projectedTimelineMonths = Math.max(1, Math.round(projectedWeeks / 4.33));

  const currentTargetMonths = currentProfile.targetTimelineMonths || 12;
  const timelineDeltaMonths = projectedTimelineMonths - currentTargetMonths;

  // 5. Generate simulated milestone timeline
  const milestonesPreview: PlanMilestone[] = [
    {
      id: `sim-ms-1`,
      title: "Foundations & Prerequisite Bridges",
      targetMonth: Math.max(1, Math.round(projectedTimelineMonths * 0.25)),
      evidenceNeeded: newRequiredCapabilities.slice(0, 2).map((n) => n.id),
    },
    {
      id: `sim-ms-2`,
      title: `Core ${candidateGraph.destinationName} Competencies`,
      targetMonth: Math.max(2, Math.round(projectedTimelineMonths * 0.5)),
      evidenceNeeded: newRequiredCapabilities.slice(2, 4).map((n) => n.id),
    },
    {
      id: `sim-ms-3`,
      title: "Production Portfolio & System Proof",
      targetMonth: Math.max(3, Math.round(projectedTimelineMonths * 0.75)),
      evidenceNeeded: candidateGraph.proofExpectations.map((p) => p.capabilityId),
    },
    {
      id: `sim-ms-4`,
      title: `${candidateGraph.destinationName} Professional Readiness`,
      targetMonth: projectedTimelineMonths,
      evidenceNeeded: candidateGraph.capabilityNodes.map((n) => n.id),
    },
  ];

  const isSameDestination =
    currentProfile.statedDestination?.toLowerCase() ===
    candidateGraph.destinationName.toLowerCase();

  const simulatedPlanSummary = `Simulated path to ${candidateGraph.destinationName}: ${
    preservedFoundations.length
  } of ${totalNodes} capabilities already verified (${transferOverlapPercentage}% transfer). ${
    newRequiredCapabilities.length
  } new requirements to bridge. Projected timeline: ${projectedTimelineMonths} months at ${effectiveWeeklyHours}h/week.`;

  return {
    candidateDestinationName: candidateGraph.destinationName,
    candidateDestinationId: candidateGraph.destinationId,
    preservedFoundations,
    preservedFoundationCount: preservedFoundations.length,
    newRequiredCapabilities,
    newRequirementCount: newRequiredCapabilities.length,
    transferOverlapPercentage,
    recomputedGaps,
    simulatedWeeklyHours: effectiveWeeklyHours,
    projectedTimelineMonths,
    timelineDeltaMonths,
    milestonesPreview,
    simulatedPlanSummary,
    isSameDestination,
  };
}
