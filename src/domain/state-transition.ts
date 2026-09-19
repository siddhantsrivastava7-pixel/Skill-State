import {
  ActionItem,
  ActivityEvent,
  AdaptivePlan,
  CapabilityStateStatus,
  DestinationGraph,
  Evidence,
  SkillClaim,
  VerificationResult,
  VerificationSubmission,
  VerifiedCapabilityState,
} from "./types";
import { prioritizeGaps, ScoredGap } from "./prioritization";
import { calculateAffectedPlanItems } from "./plan-impact";

export interface VerificationTransitionInput {
  submission: VerificationSubmission;
  evaluationResult: VerificationResult;
  currentVerifiedStates: Record<string, VerifiedCapabilityState>;
  currentClaims: Record<string, SkillClaim>;
  currentEvidence: Evidence[];
  currentPlan: AdaptivePlan;
  graph: DestinationGraph;
  targetTimelineMonths?: number;
}

export interface VerificationTransitionResult {
  newEvidence: Evidence;
  updatedVerifiedStates: Record<string, VerifiedCapabilityState>;
  recomputedGaps: ScoredGap[];
  updatedPlan: AdaptivePlan;
  planChangeExplanation: string;
  activityEvent: ActivityEvent;
  stateTransition: {
    capabilityId: string;
    previousState: CapabilityStateStatus;
    newState: CapabilityStateStatus;
    passed: boolean;
  };
}

/**
 * End-to-end verification state transition engine:
 * claimed capability → verification task → submitted answer → evaluated evidence →
 * VerifiedCapabilityState update → Gap recomputation → AdaptivePlan update → visible explanation
 */
export function executeVerificationTransition(
  input: VerificationTransitionInput
): VerificationTransitionResult {
  const {
    submission,
    evaluationResult,
    currentVerifiedStates,
    currentClaims,
    currentEvidence,
    currentPlan,
    graph,
    targetTimelineMonths = 12,
  } = input;

  const capId = submission.capabilityId;
  const currentCapabilityNode = graph.capabilityNodes.find((n) => n.id === capId);
  const capName = currentCapabilityNode?.name ?? capId;

  const previousVerified = currentVerifiedStates[capId];
  const previousState: CapabilityStateStatus = previousVerified?.state ?? "unverified";
  const newState: CapabilityStateStatus = evaluationResult.proposedState;
  const passed = evaluationResult.passed;

  // 1. Create new assessment evidence
  const evidenceId = `ev-assessment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newEvidence: Evidence = {
    id: evidenceId,
    type: "assessment",
    title: `Verification Assessment: ${capName}`,
    createdAt: new Date().toISOString(),
    sourceText: submission.userResponse.slice(0, 300),
    capabilitySignals: [evaluationResult.evidenceSignal],
  };

  // 2. Update VerifiedCapabilityState
  const updatedEvidenceIds = [
    ...(previousVerified?.evidenceIds ?? []),
    evidenceId,
  ];

  const updatedVerifiedStates: Record<string, VerifiedCapabilityState> = {
    ...currentVerifiedStates,
    [capId]: {
      capabilityId: capId,
      state: newState,
      evidenceIds: updatedEvidenceIds,
      explanation: evaluationResult.explanation,
      lastUpdatedAt: new Date().toISOString(),
    },
  };

  // 3. Recompute Gaps
  const recomputedGaps = prioritizeGaps({
    graph,
    verifiedStates: updatedVerifiedStates,
    claimedStates: currentClaims,
    targetTimelineMonths,
  });

  // 4. Calculate Plan Impact & Adapt the Plan
  const impact = calculateAffectedPlanItems([capId], currentPlan, graph);

  let updatedNow: ActionItem[] = [...currentPlan.now];
  let planChangeExplanation = "";

  if (passed) {
    // Capability verified successfully:
    // Remove or complete existing repair actions for this capability
    updatedNow = updatedNow.map((action) => {
      if (action.capabilityIds.includes(capId) && action.status !== "done") {
        return {
          ...action,
          status: "done" as const,
        };
      }
      return action;
    });

    // Check if any downstream actions unlocked in weeks can be promoted to now
    const downstreamCapIds = currentCapabilityNode?.unlocks ?? [];
    const unlockedWeekActions: ActionItem[] = [];

    for (const week of currentPlan.weeks) {
      for (const action of week.actions) {
        if (
          action.capabilityIds.some((id) => downstreamCapIds.includes(id)) &&
          !updatedNow.some((a) => a.id === action.id)
        ) {
          unlockedWeekActions.push(action);
        }
      }
    }

    if (unlockedWeekActions.length > 0 && updatedNow.length < 4) {
      updatedNow.push(...unlockedWeekActions.slice(0, 4 - updatedNow.length));
    }

    planChangeExplanation = evaluationResult.planImpact ||
      `Verification confirmed practical competence in ${capName}. Prerequisite gap cleared and dependent milestones unlocked.`;
  } else {
    // Weak answer / gap exposed:
    // Insert or prioritize an immediate targeted repair action in plan.now
    const repairActionId = `act-repair-${capId}-${Date.now()}`;
    const repairAction: ActionItem = {
      id: repairActionId,
      category: "learn",
      title: `${capName} repair & validation`,
      description: evaluationResult.explanation,
      whyNow: `Assessment revealed an unverified deficit in ${capName}. Addressing this immediately prevents compounding errors in downstream tasks.`,
      estimatedMinutes: 90,
      capabilityIds: [capId],
      status: "todo",
    };

    // Filter out duplicate repair and insert at the top of plan.now
    const remaining = updatedNow.filter((a) => a.id !== repairActionId && !a.title.includes(`${capName} repair`));
    updatedNow = [repairAction, ...remaining].slice(0, 4);

    planChangeExplanation = evaluationResult.planImpact ||
      `Assessment exposed a critical gap in ${capName}. Inserted an immediate repair task into Today's Plan and rescheduled dependent deliverables.`;
  }

  const updatedPlan: AdaptivePlan = {
    ...currentPlan,
    now: updatedNow,
    summary: `${currentPlan.summary} (Adapted following ${capName} verification)`,
  };

  // 5. Create ActivityEvent for ledger
  const activityEvent: ActivityEvent = {
    id: `event-verif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: "VERIFICATION_COMPLETED",
    title: `Verification evaluated: ${capName}`,
    description: `${passed ? "Verified capability" : "Exposed capability deficit"}: ${evaluationResult.explanation}`,
    metadata: {
      capabilityId: capId,
      passed,
      previousState,
      newState,
      planChangeExplanation,
    },
  };

  return {
    newEvidence,
    updatedVerifiedStates,
    recomputedGaps,
    updatedPlan,
    planChangeExplanation,
    activityEvent,
    stateTransition: {
      capabilityId: capId,
      previousState,
      newState,
      passed,
    },
  };
}
