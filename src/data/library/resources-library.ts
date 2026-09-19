import type { DestinationGraph, Gap, VerifiedCapabilityState } from "@/domain/types";
import { resourceRepository } from "@/data/knowledge/repositories";
import type { ResourceKnowledge } from "@/data/knowledge/types";

export type ResourceFormat =
  | "project-guide"
  | "interactive-drill"
  | "case-study"
  | "documentation"
  | "article";

export interface CuratedResource {
  id: string;
  title: string;
  provider: string;
  format: ResourceFormat;
  targetGapCapabilityId: string;
  targetGapCapabilityName: string;
  learningObjective: string;
  whyThisResource: string;
  estimatedMinutes?: number;
  url: string;
  sourceType: "official" | "trusted";
  lastChecked: string;
}

export interface GroupedGapResources {
  gapCapabilityId: string;
  gapCapabilityName: string;
  gapPriority: string;
  gapReason: string;
  needsProof: boolean;
  resources: CuratedResource[];
}

function resourceFormat(type: string): ResourceFormat {
  if (type === "documentation" || type === "standard" || type === "library") return "documentation";
  if (type === "interactive") return "interactive-drill";
  if (type === "article" || type === "book") return "article";
  return "project-guide";
}

function adaptResource(
  resource: ResourceKnowledge,
  capabilityId: string,
  capabilityName: string
): CuratedResource {
  return {
    id: resource.id,
    title: resource.title,
    provider: resource.provider,
    format: resourceFormat(resource.type),
    targetGapCapabilityId: capabilityId,
    targetGapCapabilityName: capabilityName,
    learningObjective: resource.notes || `Build ${capabilityName} toward the required destination level.`,
    whyThisResource: `Curated ${resource.sourceType} source matched directly to the canonical ${capabilityName} capability.`,
    url: resource.url,
    sourceType: resource.sourceType,
    lastChecked: resource.lastChecked,
  };
}

export function resourcesForCapability(
  capabilityId: string,
  capabilityName = capabilityId
): CuratedResource[] {
  return resourceRepository
    .matchCapabilityIdsSync([capabilityId])
    .map((resource) => adaptResource(resource, capabilityId, capabilityName));
}

/**
 * Groups shared resources only under active canonical capability gaps. A state
 * that needs proof receives proof guidance, not an automatic course list.
 */
export function matchResourcesToGaps(
  gaps: Gap[],
  graph: DestinationGraph,
  verifiedStates: Record<string, VerifiedCapabilityState> = {}
): GroupedGapResources[] {
  return gaps.map((gap) => {
    const node = graph.capabilityNodes.find((item) => item.id === gap.capabilityId);
    const capabilityName = node?.name ?? gap.capabilityId;
    const needsProof =
      gap.gapType === "knowledge-no-proof" ||
      verifiedStates[gap.capabilityId]?.state === "needs-proof";
    return {
      gapCapabilityId: gap.capabilityId,
      gapCapabilityName: capabilityName,
      gapPriority: gap.priority,
      gapReason: gap.reason,
      needsProof,
      resources: needsProof ? [] : resourcesForCapability(gap.capabilityId, capabilityName),
    };
  });
}
