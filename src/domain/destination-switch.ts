import {
  DestinationGraph,
  Evidence,
  Gap,
  SkillClaim,
  VerifiedCapabilityState,
} from "./types";
import { prioritizeGaps } from "./prioritization";
import { deriveVerifiedStates } from "./evidence-transition";

export interface DestinationChangeInput {
  currentEvidence: Evidence[];
  currentVerifiedStates: Record<string, VerifiedCapabilityState>;
  currentClaimedStates: Record<string, SkillClaim>;
  newGraph: DestinationGraph;
  targetTimelineMonths?: number;
}

export interface DestinationChangeResult {
  preservedEvidence: Evidence[];
  preservedClaimedStates: Record<string, SkillClaim>;
  updatedVerifiedStates: Record<string, VerifiedCapabilityState>;
  recomputedGaps: Gap[];
  preservedFoundationCount: number;
  newRequirementCount: number;
}

/**
 * Deterministically preserves all evidence, existing verified states, and claims
 * when a learner switches destinations (e.g. AI Engineer -> Data Engineer).
 *
 * Non-negotiable rule: No evidence is ever deleted on destination change.
 */
export function preserveEvidenceOnDestinationChange(
  input: DestinationChangeInput
): DestinationChangeResult {
  const {
    currentEvidence,
    currentVerifiedStates,
    currentClaimedStates,
    newGraph,
    targetTimelineMonths = 12,
  } = input;

  // 1. Preserve 100% of historical evidence
  const preservedEvidence: Evidence[] = [...currentEvidence];

  // 2. Preserve all claims
  const preservedClaimedStates: Record<string, SkillClaim> = {
    ...currentClaimedStates,
  };

  // 3. Re-derive the target graph from historical evidence, while retaining
  // evaluated states for capabilities shared by both destinations.
  const evidenceDerivedStates = deriveVerifiedStates(
    newGraph,
    preservedEvidence,
    preservedClaimedStates
  );
  const updatedVerifiedStates: Record<string, VerifiedCapabilityState> = {
    ...currentVerifiedStates,
  };

  let preservedFoundationCount = 0;
  let newRequirementCount = 0;

  for (const node of newGraph.capabilityNodes) {
    const existingState = currentVerifiedStates[node.id];
    const derivedState = evidenceDerivedStates[node.id];
    const hasEvaluatedHistory = Boolean(existingState?.evidenceIds.length);

    // The active state-transition engine is authoritative for evaluated
    // evidence. A destination switch must not reinterpret a failed assessment
    // as merely missing proof.
    updatedVerifiedStates[node.id] = hasEvaluatedHistory
      ? existingState
      : derivedState;

    if (updatedVerifiedStates[node.id].state === "verified") {
      preservedFoundationCount++;
    } else {
      newRequirementCount++;
    }
  }

  // 4. Deterministically recompute gaps for the new destination
  const recomputedGaps = prioritizeGaps({
    graph: newGraph,
    verifiedStates: updatedVerifiedStates,
    claimedStates: preservedClaimedStates,
    targetTimelineMonths,
  });

  return {
    preservedEvidence,
    preservedClaimedStates,
    updatedVerifiedStates,
    recomputedGaps,
    preservedFoundationCount,
    newRequirementCount,
  };
}
