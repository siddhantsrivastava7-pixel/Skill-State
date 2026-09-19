import type {
  CapabilityStateStatus,
  DestinationGraph,
  Evidence,
  SkillClaim,
  VerifiedCapabilityState,
} from "./types";

const rank: Record<CapabilityStateStatus, number> = {
  gap: 0,
  unverified: 1,
  "needs-proof": 2,
  developing: 3,
  verified: 4,
};

function proposedState(evidence: Evidence, signalIndex: number): CapabilityStateStatus {
  const signal = evidence.capabilitySignals[signalIndex];
  if (signal.signal === "unclear") return "unverified";
  if (signal.signal === "weakens") return "developing";

  if (evidence.type === "resume" || evidence.type === "certificate") {
    return "needs-proof";
  }
  if (evidence.type === "activity") return "unverified";
  if (evidence.type === "project" || evidence.type === "portfolio") {
    return signal.strength === "high" ? "verified" : "developing";
  }
  return signal.strength === "high" ? "verified" : "developing";
}

export function applyEvidenceToVerifiedStates(
  currentStates: Record<string, VerifiedCapabilityState>,
  evidence: Evidence,
  graph?: DestinationGraph
): Record<string, VerifiedCapabilityState> {
  const allowedIds = graph
    ? new Set(graph.capabilityNodes.map((node) => node.id))
    : null;
  const updated = { ...currentStates };

  evidence.capabilitySignals.forEach((signal, index) => {
    if (allowedIds && !allowedIds.has(signal.capabilityId)) return;
    const current = updated[signal.capabilityId];
    const candidate = proposedState(evidence, index);
    const state =
      current && rank[current.state] > rank[candidate]
        ? current.state
        : candidate;
    updated[signal.capabilityId] = {
      capabilityId: signal.capabilityId,
      state,
      evidenceIds: current?.evidenceIds.includes(evidence.id)
        ? current.evidenceIds
        : [...(current?.evidenceIds ?? []), evidence.id],
      explanation: signal.explanation,
      lastUpdatedAt: evidence.createdAt,
    };
  });

  return updated;
}

export function deriveVerifiedStates(
  graph: DestinationGraph,
  evidence: Evidence[],
  claimedStates: Record<string, SkillClaim> = {}
): Record<string, VerifiedCapabilityState> {
  const initial: Record<string, VerifiedCapabilityState> = Object.fromEntries(
    graph.capabilityNodes.map((node) => [
      node.id,
      {
        capabilityId: node.id,
        state: claimedStates[node.id] && claimedStates[node.id].selfReportedLevel !== "none"
          ? "needs-proof" as const
          : "unverified" as const,
        evidenceIds: [],
        explanation:
          claimedStates[node.id] && claimedStates[node.id].selfReportedLevel !== "none"
            ? "Claimed capability has no supporting evidence yet."
            : "No claim or verified evidence yet.",
        lastUpdatedAt: new Date(0).toISOString(),
      },
    ])
  );
  return evidence.reduce<Record<string, VerifiedCapabilityState>>(
    (states, item) => applyEvidenceToVerifiedStates(states, item, graph),
    initial
  );
}
