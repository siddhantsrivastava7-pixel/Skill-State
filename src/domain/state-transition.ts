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

export interface ImpactItem {
  id: string;
  title: string;
  description: string;
  category: "added" | "reprioritized" | "moved-later" | "unchanged";
  isDirectChange: boolean;
  badge?: string;
}

export interface ImpactBreakdown {
  directChanges: Array<{
    title: string;
    description: string;
  }>;
  existingGapsReprioritized: Array<{
    capabilityId: string;
    capabilityName: string;
    reason: string;
    priority: string;
  }>;
  categories: {
    added: ImpactItem[];
    reprioritized: ImpactItem[];
    movedLaterOrUnchanged: ImpactItem[];
  };
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
  impactBreakdown: ImpactBreakdown;
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

  // Identify existing gaps reprioritized by the recomputation (excluding current capId)
  const existingGapsReprioritized: Array<{
    capabilityId: string;
    capabilityName: string;
    reason: string;
    priority: string;
  }> = [];

  for (const gap of recomputedGaps) {
    if (gap.capabilityId !== capId) {
      const node = graph.capabilityNodes.find((n) => n.id === gap.capabilityId);
      existingGapsReprioritized.push({
        capabilityId: gap.capabilityId,
        capabilityName: node?.name ?? gap.capabilityId,
        reason: gap.reason,
        priority: gap.priority,
      });
    }
  }

  // 4. Calculate Plan Impact & Adapt the Plan
  let updatedNow: ActionItem[] = [...currentPlan.now];
  const addedItems: ImpactItem[] = [];
  const reprioritizedItems: ImpactItem[] = [];
  const movedLaterOrUnchangedItems: ImpactItem[] = [];
  const directChangesList: Array<{ title: string; description: string }> = [];

  // Direct evidence added
  addedItems.push({
    id: `item-ev-${evidenceId}`,
    title: `Assessment Evidence: ${capName}`,
    description: `Recorded verified evidence signal (${evaluationResult.evidenceSignal.signal}, ${evaluationResult.evidenceSignal.strength} strength).`,
    category: "added",
    isDirectChange: true,
    badge: "Evidence Added",
  });

  directChangesList.push({
    title: `Evidence Attached: ${capName}`,
    description: `Submitted response evaluated with ${evaluationResult.evidenceSignal.signal} signal on ${capName}.`,
  });

  let repairAction: ActionItem | null = null;
  let unlockedWeekActions: ActionItem[] = [];

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

    directChangesList.push({
      title: `Capability Confirmed: ${capName}`,
      description: previousState === newState
        ? `Capability state remains ${newState}. Prerequisite confirmed.`
        : `State updated from ${previousState} to ${newState}.`,
    });

    // Check if any downstream actions unlocked in weeks can be promoted to now
    const downstreamCapIds = currentCapabilityNode?.unlocks ?? [];

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
      const promoted = unlockedWeekActions.slice(0, 4 - updatedNow.length);
      updatedNow.push(...promoted);

      for (const p of promoted) {
        addedItems.push({
          id: `item-promoted-${p.id}`,
          title: p.title,
          description: `Promoted from upcoming milestones following ${capName} verification.`,
          category: "added",
          isDirectChange: true,
          badge: "Unlocked Action",
        });
      }
    }
  } else {
    // Weak answer / gap exposed:
    // Insert or prioritize an immediate targeted repair action in plan.now
    const repairActionId = `act-repair-${capId}-${Date.now()}`;
    repairAction = {
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

    addedItems.push({
      id: `item-action-${repairActionId}`,
      title: `${capName} repair & validation`,
      description: `Targeted repair task inserted at top of Today's Plan to address evaluated gap.`,
      category: "added",
      isDirectChange: true,
      badge: "New Action in Today's Plan",
    });

    directChangesList.push({
      title: `Gap Identified: ${capName}`,
      description: previousState === newState
        ? `Capability state remains ${newState}. Immediate repair task inserted into Today's Plan.`
        : `State updated from ${previousState} to ${newState}. Direct repair action added to Today's Plan.`,
    });
  }

  // 2. Reprioritized Category (Existing gaps reprioritized by plan recomputation)
  for (const eg of existingGapsReprioritized) {
    reprioritizedItems.push({
      id: `item-reprioritized-${eg.capabilityId}`,
      title: eg.capabilityName,
      description: `Existing gap (${eg.priority} priority) reprioritized as foundational requirement during plan recomputation (not created by this assessment).`,
      category: "reprioritized",
      isDirectChange: false,
      badge: `Existing Gap · ${eg.priority}`,
    });
  }

  // Any other actions in updatedNow that are not direct changes
  for (const action of updatedNow) {
    if (repairAction && action.id === repairAction.id) continue;
    if (unlockedWeekActions.some((u) => u.id === action.id)) continue;
    // If it's an existing action in plan.now
    if (!reprioritizedItems.some((r) => r.id === action.id) && !movedLaterOrUnchangedItems.some((m) => m.id === action.id)) {
      if (!passed && (action.category === "build" || action.category === "experience")) {
        movedLaterOrUnchangedItems.push({
          id: `item-moved-${action.id}`,
          title: action.title,
          description: `Moved later / scheduled after foundational repairs are completed.`,
          category: "moved-later",
          isDirectChange: false,
          badge: "Rescheduled",
        });
      } else {
        movedLaterOrUnchangedItems.push({
          id: `item-stable-${action.id}`,
          title: action.title,
          description: `Maintained in Today's Plan as active focus item.`,
          category: "unchanged",
          isDirectChange: false,
          badge: "Active",
        });
      }
    }
  }

  // 5. Semantic Explanation (Distinguishing direct changes vs existing gaps reprioritized)
  const directExplanation = passed
    ? `Direct impact: Verification confirmed practical competence in ${capName} (${newState}). Added assessment evidence, cleared ${capName} gap, and unlocked downstream milestones.`
    : `Direct impact: Verification evaluated ${capName} as ${newState}. Added assessment evidence and inserted an immediate repair action into Today's Plan.`;

  const existingGapsExplanation = existingGapsReprioritized.length > 0
    ? ` Existing gaps (${existingGapsReprioritized.map((g) => g.capabilityName).join(", ")}) were reprioritized as foundational requirements during plan recomputation (not created by this assessment).`
    : "";

  const planChangeExplanation = `${directExplanation}${existingGapsExplanation}`;

  const updatedPlan: AdaptivePlan = {
    ...currentPlan,
    now: updatedNow,
    summary: `${currentPlan.summary} (Adapted following ${capName} verification)`,
  };

  // 6. Create ActivityEvent for ledger
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
      directChanges: directChangesList,
      existingGapsReprioritized,
    },
  };

  const impactBreakdown: ImpactBreakdown = {
    directChanges: directChangesList,
    existingGapsReprioritized,
    categories: {
      added: addedItems,
      reprioritized: reprioritizedItems,
      movedLaterOrUnchanged: movedLaterOrUnchangedItems,
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
    impactBreakdown,
  };
}
