import { CapabilityNode, DestinationGraph } from "./types";

export interface OptionalitySummary {
  capabilityId: string;
  capabilityName: string;
  supportedPathsCount: number;
  totalPathsCount: number;
  unlocksCount: number;
  explanation: string;
}

/**
 * Calculates how many destination pathways a given capability supports,
 * preserving optionality for uncertain/exploring learners.
 */
export function calculateCapabilityOptionality(
  capabilityId: string,
  graph: DestinationGraph
): OptionalitySummary {
  const node = graph.capabilityNodes.find((n) => n.id === capabilityId);
  const name = node?.name ?? capabilityId;
  const totalPathsCount = graph.adjacentDestinations.length + 1; // primary + adjacents

  let supportedPathsCount = 0;
  // If in shared foundation, supports all paths
  if (graph.sharedFoundationNodeIds.includes(capabilityId)) {
    supportedPathsCount = totalPathsCount;
  } else {
    supportedPathsCount = 1; // primary path
    for (const adj of graph.adjacentDestinations) {
      if (adj.sharedCapabilityIds.includes(capabilityId)) {
        supportedPathsCount++;
      }
    }
  }

  const unlocksCount = node?.unlocks.length ?? 0;
  const explanation = `${name} supports ${supportedPathsCount} of ${totalPathsCount} possible paths and unlocks ${unlocksCount} future capability(ies).`;

  return {
    capabilityId,
    capabilityName: name,
    supportedPathsCount,
    totalPathsCount,
    unlocksCount,
    explanation,
  };
}
