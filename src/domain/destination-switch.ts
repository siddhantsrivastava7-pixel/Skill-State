import {
  DestinationGraph,
  Evidence,
  Gap,
  SkillClaim,
  VerifiedCapabilityState,
} from "./types";
import { prioritizeGaps } from "./prioritization";

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

  // 3. Reconcile verified capability states against the new destination graph
  const updatedVerifiedStates: Record<string, VerifiedCapabilityState> = {
    ...currentVerifiedStates,
  };

  let preservedFoundationCount = 0;
  let newRequirementCount = 0;

  for (const node of newGraph.capabilityNodes) {
    const existingVerified = updatedVerifiedStates[node.id];
    if (existingVerified && existingVerified.state === "verified") {
      preservedFoundationCount++;
      continue;
    }

    // Check if any existing evidence references this capability
    const matchingEvidence = preservedEvidence.filter((ev) =>
      ev.capabilitySignals.some((sig) => sig.capabilityId === node.id)
    );

    if (matchingEvidence.length > 0) {
      const supportingSignals = matchingEvidence.flatMap((ev) =>
        ev.capabilitySignals.filter(
          (sig) => sig.capabilityId === node.id && sig.signal === "supports"
        )
      );

      const hasStrongSupport = supportingSignals.some(
        (sig) => sig.strength === "high"
      );

      updatedVerifiedStates[node.id] = {
        capabilityId: node.id,
        state: hasStrongSupport ? "verified" : "needs-proof",
        evidenceIds: matchingEvidence.map((e) => e.id),
        explanation: `Preserved from previous evidence: supported by ${matchingEvidence.length} item(s).`,
        lastUpdatedAt: new Date().toISOString(),
      };
      if (hasStrongSupport) {
        preservedFoundationCount++;
      } else {
        newRequirementCount++;
      }
    } else if (!updatedVerifiedStates[node.id]) {
      // Unverified requirement in new destination
      updatedVerifiedStates[node.id] = {
        capabilityId: node.id,
        state: "unverified",
        evidenceIds: [],
        explanation: "New requirement for selected destination; no evidence recorded.",
        lastUpdatedAt: new Date().toISOString(),
      };
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
