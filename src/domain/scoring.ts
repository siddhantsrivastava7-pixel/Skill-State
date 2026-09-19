import {
  DestinationGraph,
  Evidence,
  VerifiedCapabilityState,
} from "./types";

export interface ReadinessDimensions {
  verifiedCount: number;
  developingCount: number;
  needsProofCount: number;
  gapCount: number;
  unverifiedCount: number;
  totalCapabilities: number;
  evidenceTotal: number;
  hasProjectProof: boolean;
  hasExperience: boolean;
}

/**
 * Calculates the four distinct readiness dimensions (Knowledge, Proof, Experience, Signal)
 * without collapsing them into a fake precision percentage.
 */
export function calculateReadinessDimensions(
  graph: DestinationGraph,
  verifiedStates: Record<string, VerifiedCapabilityState>,
  evidence: Evidence[]
): ReadinessDimensions {
  let verifiedCount = 0;
  let developingCount = 0;
  let needsProofCount = 0;
  let gapCount = 0;
  let unverifiedCount = 0;

  for (const node of graph.capabilityNodes) {
    const v = verifiedStates[node.id];
    const status = v?.state ?? "unverified";
    switch (status) {
      case "verified":
        verifiedCount++;
        break;
      case "developing":
        developingCount++;
        break;
      case "needs-proof":
        needsProofCount++;
        break;
      case "gap":
        gapCount++;
        break;
      case "unverified":
      default:
        unverifiedCount++;
        break;
    }
  }

  const hasProjectProof = evidence.some((e) => e.type === "project");
  const hasExperience = evidence.some(
    (e) => e.type === "experience" || e.type === "activity"
  );

  return {
    verifiedCount,
    developingCount,
    needsProofCount,
    gapCount,
    unverifiedCount,
    totalCapabilities: graph.capabilityNodes.length,
    evidenceTotal: evidence.length,
    hasProjectProof,
    hasExperience,
  };
}
