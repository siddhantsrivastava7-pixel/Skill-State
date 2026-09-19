import { DestinationGraphSchema } from "@/domain/schemas";
import type { DestinationGraph, ExperienceExpectation } from "@/domain/types";
import type { CareerKnowledge } from "./types";
import {
  capabilityRepository,
  careerRepository,
  careerTransitionRepository,
} from "./repositories";

const importanceMap = {
  core: "core",
  important: "important",
  supporting: "useful",
} as const;

const levelMap = {
  basic: "foundation",
  working: "developing",
  strong: "specialist",
} as const;

function experienceType(text: string): ExperienceExpectation["type"] {
  const normalized = text.toLowerCase();
  if (normalized.includes("intern")) return "internship";
  if (normalized.includes("hackathon")) return "hackathon";
  if (normalized.includes("open source") || normalized.includes("open-source")) return "open-source";
  if (normalized.includes("research") || normalized.includes("study")) return "research";
  return "team-project";
}

export function careerKnowledgeToDestinationGraph(career: CareerKnowledge): DestinationGraph {
  const unlocks = new Map<string, string[]>();
  for (const requirement of career.capabilities) {
    for (const prerequisite of requirement.prerequisites) {
      unlocks.set(prerequisite, [...(unlocks.get(prerequisite) ?? []), requirement.capabilityId]);
    }
  }

  const capabilityNodes = career.capabilities.map((requirement) => {
    const definition = capabilityRepository.getByIdSync(requirement.capabilityId);
    if (!definition) throw new Error(`Unknown shared capability: ${requirement.capabilityId}`);
    return {
      id: definition.id,
      name: definition.name,
      family: definition.domain,
      description: definition.description,
      importance: importanceMap[requirement.importance],
      stageExpected: levelMap[requirement.targetLevel],
      prerequisites: requirement.prerequisites,
      unlocks: unlocks.get(requirement.capabilityId) ?? [],
    };
  });

  const proofTargets = career.capabilities.filter((item) => item.importance === "core");
  const fallbackTargets = proofTargets.length > 0 ? proofTargets : career.capabilities;
  const proofDescriptions = [...career.proofExpectations, ...career.signalExpectations];

  const adjacentDestinations = career.adjacentCareerIds.flatMap((adjacentId, index) => {
    const adjacent = careerRepository.getByIdSync(adjacentId);
    if (!adjacent) return [];
    const transition = careerTransitionRepository.betweenSync(career.id, adjacentId);
    return [{
      id: adjacent.id,
      title: adjacent.title,
      descriptor: adjacent.summary,
      tone: (["purple", "green", "orange", "blue"] as const)[index % 4],
      overlapPercentage: transition ? Math.round(transition.overlapFraction * 100) : undefined,
      sharedCapabilityIds: transition?.sharedCapabilityIds ?? [],
    }];
  });

  return DestinationGraphSchema.parse({
    destinationId: career.id,
    destinationName: career.title,
    summary: career.summary,
    confidence: career.status === "generated" ? "medium" : "high",
    capabilityNodes,
    proofExpectations: proofDescriptions.map((description, index) => ({
      id: `${career.id}-proof-${index + 1}`,
      capabilityId: fallbackTargets[index % fallbackTargets.length].capabilityId,
      description,
      level: "working" as const,
    })),
    experienceExpectations: career.experienceExpectations.map((description, index) => ({
      id: `${career.id}-experience-${index + 1}`,
      title: description,
      description,
      type: experienceType(description),
    })),
    adjacentDestinations,
    sharedFoundationNodeIds: career.capabilities
      .filter((item) => item.targetLevel === "basic" || item.importance === "core")
      .map((item) => item.capabilityId),
  });
}
