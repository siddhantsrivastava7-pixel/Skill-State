import type { DestinationGraph, VerifiedCapabilityState } from "@/domain/types";
import { careerKnowledgeToDestinationGraph } from "@/data/knowledge/adapter";
import { careerRepository } from "@/data/knowledge/repositories";

export interface CareerPathItem {
  id: string;
  title: string;
  field: string;
  description: string;
  planningDecisionPointMonths?: number;
  targetHorizonMonths: number;
  graph: DestinationGraph;
  sharedCapabilities: string[];
  overlapPercentage: number;
  unverifiedCapabilitiesCount: number;
  isPreview?: boolean;
}

function requiredSharedGraph(id: string): DestinationGraph {
  const career = careerRepository.getByIdSync(id);
  if (!career) throw new Error(`Missing shared career knowledge: ${id}`);
  return careerKnowledgeToDestinationGraph(career);
}

export const dataEngineerGraph = requiredSharedGraph("data-engineer");

export const SEEDED_CAREER_PATHS_CATALOG = [
  "ai-engineer",
  "data-engineer",
  "financial-analyst",
  "software-engineer",
].map((id) => {
  const career = careerRepository.getByIdSync(id);
  if (!career) throw new Error(`Missing shared career knowledge: ${id}`);
  return { id: `career-${id}`, field: career.family, graph: careerKnowledgeToDestinationGraph(career) };
});

function previewFromAdjacent(
  currentGraph: DestinationGraph,
  adjacent: DestinationGraph["adjacentDestinations"][number]
): DestinationGraph {
  const sharedNodes = adjacent.sharedCapabilityIds
    .map((id) => currentGraph.capabilityNodes.find((node) => node.id === id))
    .filter((node): node is DestinationGraph["capabilityNodes"][number] => Boolean(node));
  return {
    destinationId: adjacent.id,
    destinationName: adjacent.title,
    summary: adjacent.descriptor,
    confidence: "medium",
    capabilityNodes: sharedNodes,
    proofExpectations: [],
    experienceExpectations: [],
    adjacentDestinations: [],
    sharedFoundationNodeIds: sharedNodes.map((node) => node.id),
  };
}

/** Uses concrete canonical capability intersections; known careers never need AI compilation. */
export function calculateCareerPathsWithOverlap(
  currentGraph: DestinationGraph,
  verifiedStates: Record<string, VerifiedCapabilityState>,
  isDemoState = false,
  additionalGraphs: DestinationGraph[] = []
): CareerPathItem[] {
  const currentKnowledge =
    careerRepository.getByIdSync(currentGraph.destinationId) ??
    careerRepository.findByTitleOrAliasSync(currentGraph.destinationName);

  const adjacentCatalog = currentGraph.adjacentDestinations.map((adjacent) => {
    const known = careerRepository.getByIdSync(adjacent.id) ?? careerRepository.findByTitleOrAliasSync(adjacent.title);
    return {
      id: `career-adjacent-${adjacent.id}`,
      field: known?.family ?? "Adjacent destination",
      graph: known ? careerKnowledgeToDestinationGraph(known) : previewFromAdjacent(currentGraph, adjacent),
      isPreview: !known,
    };
  });

  const catalog = [
    {
      id: `career-current-${currentGraph.destinationId}`,
      field: currentKnowledge?.family ?? "Current destination",
      graph: currentGraph,
      isPreview: false,
    },
    ...adjacentCatalog,
  ];

  if (isDemoState) {
    for (const seeded of SEEDED_CAREER_PATHS_CATALOG) {
      if (!catalog.some((item) => item.graph.destinationId === seeded.graph.destinationId)) {
        catalog.push({ ...seeded, isPreview: false });
      }
    }
  }

  for (const graph of additionalGraphs) {
    if (!graph.destinationId || catalog.some((item) => item.graph.destinationId === graph.destinationId)) continue;
    const knowledge = careerRepository.getByIdSync(graph.destinationId) ??
      careerRepository.findByTitleOrAliasSync(graph.destinationName);
    catalog.push({
      id: `career-catalog-${graph.destinationId}`,
      field: knowledge?.family ?? "Saved destination",
      graph,
      isPreview: false,
    });
  }

  return catalog.map((item) => {
    const verifiedMatching = item.graph.capabilityNodes.filter(
      (node) => verifiedStates[node.id]?.state === "verified"
    );
    const totalNodes = item.graph.capabilityNodes.length;
    return {
      id: item.id,
      title: item.graph.destinationName,
      field: item.field,
      description: item.graph.summary,
      planningDecisionPointMonths: item.graph.decisionPointMonths,
      targetHorizonMonths: item.graph.decisionPointMonths ?? 12,
      graph: item.graph,
      sharedCapabilities: verifiedMatching.map((node) => node.name),
      overlapPercentage: totalNodes > 0 ? Math.round((verifiedMatching.length / totalNodes) * 100) : 0,
      unverifiedCapabilitiesCount: totalNodes - verifiedMatching.length,
      isPreview: item.isPreview,
    };
  });
}
