import {
  CapabilityNode,
  DestinationGraph,
  Evidence,
  SkillClaim,
  VerifiedCapabilityState,
} from "./types";

export interface VerificationCandidateInput {
  graph: DestinationGraph;
  claimedStates: Record<string, SkillClaim>;
  verifiedStates: Record<string, VerifiedCapabilityState>;
  evidence: Evidence[];
  nearTermCapabilityIds?: string[];
}

export interface VerificationCandidate {
  node: CapabilityNode;
  score: number;
  reason: string;
}

/**
 * Deterministically selects maximum 3 capabilities for verification.
 * Priority hierarchy from 08_AGENT_SYSTEM.md Operation 3:
 * 1. Important capability with no evidence.
 * 2. Self-reported strong capability with weak/no evidence.
 * 3. Capability that unlocks many later capabilities.
 * 4. Capability currently blocking a near-term milestone.
 */
export function selectMax3VerificationCandidates(
  input: VerificationCandidateInput
): CapabilityNode[] {
  const {
    graph,
    claimedStates,
    verifiedStates,
    nearTermCapabilityIds = [],
  } = input;

  const candidates: VerificationCandidate[] = [];

  for (const node of graph.capabilityNodes) {
    const verified = verifiedStates[node.id];
    // Skip already fully verified capabilities
    if (verified?.state === "verified") {
      continue;
    }

    const claim = claimedStates[node.id];
    const evidenceCount = verified?.evidenceIds?.length ?? 0;
    const isNearTerm = nearTermCapabilityIds.includes(node.id);

    let score = 0;
    const reasons: string[] = [];

    // Criterion 1: Important/core capability with no evidence
    if (evidenceCount === 0 && (node.importance === "core" || node.importance === "important")) {
      score += node.importance === "core" ? 12 : 8;
      reasons.push(`Core requirement with zero verification`);
    }

    // Criterion 2: Self-reported strong capability with weak/no evidence
    if (claim?.selfReportedLevel === "strong" && evidenceCount === 0) {
      score += 10;
      reasons.push(`Claimed strong but unproven`);
    } else if (claim?.selfReportedLevel === "working" && evidenceCount === 0) {
      score += 5;
      reasons.push(`Claimed working knowledge without evidence`);
    }

    // Criterion 3: Unlocks many later capabilities
    if (node.unlocks.length > 0) {
      score += node.unlocks.length * 3;
      reasons.push(`Unlocks ${node.unlocks.length} subsequent capability(ies)`);
    }

    // Criterion 4: Blocking near-term milestone
    if (isNearTerm) {
      score += 6;
      reasons.push(`Prerequisite for near-term milestone`);
    }

    if (score > 0) {
      candidates.push({
        node,
        score,
        reason: reasons.join("; "),
      });
    }
  }

  // Sort descending by score, deterministic tie-breaking by node ID
  candidates.sort((a, b) => b.score - a.score || a.node.id.localeCompare(b.node.id));

  // Return max 3 candidates
  return candidates.slice(0, 3).map((c) => c.node);
}
