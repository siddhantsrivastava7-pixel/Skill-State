import {
  CapabilityNode,
  DestinationGraph,
  Gap,
  GapPriority,
  GapType,
  SkillClaim,
  VerifiedCapabilityState,
} from "./types";

export interface PrioritizeGapsInput {
  graph: DestinationGraph;
  verifiedStates: Record<string, VerifiedCapabilityState>;
  claimedStates: Record<string, SkillClaim>;
  targetTimelineMonths?: number;
}

export interface ScoredGap extends Gap {
  score: number;
}

/**
 * Deterministic Gap Prioritization
 * Formula from 08_AGENT_SYSTEM.md:
 * importance × downstream unlocks × deficit severity × timeline urgency
 */
export function prioritizeGaps(input: PrioritizeGapsInput): ScoredGap[] {
  const { graph, verifiedStates, claimedStates, targetTimelineMonths = 12 } = input;
  const nodesById = new Map<string, CapabilityNode>();
  for (const node of graph.capabilityNodes) {
    nodesById.set(node.id, node);
  }

  const scoredGaps: ScoredGap[] = [];

  for (const node of graph.capabilityNodes) {
    const verified = verifiedStates[node.id];
    const claim = claimedStates[node.id];

    // If capability is already solidly verified, it is not a gap
    if (verified && verified.state === "verified") {
      continue;
    }

    // Determine Gap Type
    let gapType: GapType = "never-learned";
    let severityWeight = 1.0;

    const claimedLevel = claim?.selfReportedLevel ?? "none";
    const verifiedState = verified?.state ?? "unverified";
    const evidenceCount = verified?.evidenceIds?.length ?? 0;

    if (claimedLevel === "strong" && evidenceCount === 0) {
      gapType = "false-confidence";
      severityWeight = 3.5;
    } else if (claimedLevel !== "none" && evidenceCount === 0) {
      gapType = "knowledge-no-proof";
      severityWeight = 2.5;
    } else if (verifiedState === "developing") {
      gapType = "weak";
      severityWeight = 2.0;
    } else if (verifiedState === "needs-proof") {
      gapType = "knowledge-no-proof";
      severityWeight = 2.2;
    } else if (claimedLevel === "none" && verifiedState === "unverified") {
      gapType = "never-learned";
      severityWeight = 3.0;
    } else {
      gapType = "never-learned";
      severityWeight = 2.5;
    }

    // 1. Importance multiplier
    const importanceWeight =
      node.importance === "core" ? 3.0 : node.importance === "important" ? 2.0 : 1.0;

    // 2. Downstream unlocks multiplier (1 + unlocks count * 0.4)
    const downstreamCount = node.unlocks.length;
    const unlockWeight = 1.0 + downstreamCount * 0.4;

    // 3. Timeline urgency multiplier
    // Foundations are more urgent when timeline is shorter or if foundation stage
    let urgencyWeight = 1.0;
    if (node.stageExpected === "foundation" || graph.sharedFoundationNodeIds.includes(node.id)) {
      urgencyWeight = targetTimelineMonths <= 12 ? 1.8 : 1.4;
    } else if (node.stageExpected === "developing") {
      urgencyWeight = 1.2;
    }

    const score = Number(
      (importanceWeight * unlockWeight * severityWeight * urgencyWeight).toFixed(2)
    );

    // Map score to priority band
    let priority: GapPriority = "low";
    if (score >= 14.0) {
      priority = "critical";
    } else if (score >= 8.0) {
      priority = "high";
    } else if (score >= 4.0) {
      priority = "medium";
    } else {
      priority = "low";
    }

    const reason = generateDeterministicGapReason(node, gapType, priority);

    scoredGaps.push({
      capabilityId: node.id,
      gapType,
      priority,
      reason,
      blocksCapabilityIds: node.unlocks,
      score,
    });
  }

  // Sort strictly by score descending; break ties deterministically by node id
  scoredGaps.sort((a, b) => b.score - a.score || a.capabilityId.localeCompare(b.capabilityId));

  return scoredGaps;
}

function generateDeterministicGapReason(
  node: CapabilityNode,
  gapType: GapType,
  priority: GapPriority
): string {
  switch (gapType) {
    case "false-confidence":
      return `${node.name} is claimed at a high level but lacks verifiable evidence; required as a ${priority} prerequisite.`;
    case "knowledge-no-proof":
      return `${node.name} concepts are known but lack demonstrated project proof.`;
    case "weak":
      return `${node.name} is currently developing and needs reinforcement before advanced topics.`;
    case "missing-experience":
      return `${node.name} requires practical exposure in a realistic project or team setting.`;
    case "never-learned":
    default:
      return `${node.name} is a ${node.importance} competency required for this destination.`;
  }
}
