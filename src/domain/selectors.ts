import {
  ActionItem,
  AdaptivePlan,
  CapabilityNode,
  DestinationGraph,
  Evidence,
  Gap,
  SkillClaim,
  VerifiedCapabilityState,
} from "./types";

export interface DomainStateView {
  graph: DestinationGraph;
  claimedStates: Record<string, SkillClaim>;
  verifiedStates: Record<string, VerifiedCapabilityState>;
  evidence: Evidence[];
  gaps: Gap[];
  plan: AdaptivePlan;
}

export function selectVerifiedCapabilities(state: DomainStateView): CapabilityNode[] {
  return state.graph.capabilityNodes.filter(
    (node) => state.verifiedStates[node.id]?.state === "verified"
  );
}

export function selectDevelopingCapabilities(state: DomainStateView): CapabilityNode[] {
  return state.graph.capabilityNodes.filter(
    (node) => state.verifiedStates[node.id]?.state === "developing"
  );
}

export function selectNeedsProofCapabilities(state: DomainStateView): CapabilityNode[] {
  return state.graph.capabilityNodes.filter(
    (node) => state.verifiedStates[node.id]?.state === "needs-proof"
  );
}

export function selectGapCapabilities(state: DomainStateView): CapabilityNode[] {
  return state.graph.capabilityNodes.filter(
    (node) => state.verifiedStates[node.id]?.state === "gap"
  );
}

export function selectNext3Actions(plan: AdaptivePlan): ActionItem[] {
  return plan.now.slice(0, 3);
}
