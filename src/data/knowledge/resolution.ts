import type { AIProvider } from "@/agent/provider";
import type { CompileDestinationInput, DestinationGraph } from "@/domain/types";
import { DestinationGraphSchema } from "@/domain/schemas";
import { z } from "zod";
import { careerKnowledgeToDestinationGraph } from "./adapter";
import { CareerKnowledgeSchema } from "./schemas";
import type { CareerKnowledge, CareerRepository } from "./types";
import { careerRepository } from "./repositories";

export interface DestinationResolution {
  graph: DestinationGraph;
  source: "shared-knowledge" | "generated";
  persisted: boolean;
}

export class UnknownDestinationError extends Error {
  readonly code = "KNOWLEDGE_DESTINATION_UNAVAILABLE";

  constructor(destination: string) {
    super(`No reviewed shared destination is available for “${destination}”, and live compilation is unavailable.`);
    this.name = "UnknownDestinationError";
  }
}

const GeneratedDestinationGraphSchema = DestinationGraphSchema.superRefine((graph, context) => {
  const ids = new Set(graph.capabilityNodes.map((node) => node.id));
  if (ids.size === 0 || ids.size !== graph.capabilityNodes.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Generated destinations require unique capabilities." });
  }
  const references = [
    ...graph.capabilityNodes.flatMap((node) => [...node.prerequisites, ...node.unlocks]),
    ...graph.proofExpectations.map((proof) => proof.capabilityId),
    ...graph.sharedFoundationNodeIds,
  ];
  for (const reference of references) {
    if (!ids.has(reference)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown generated capability reference: ${reference}` });
    }
  }
});

function requestedDestination(input: CompileDestinationInput): string {
  return input.statedDestination?.trim() || input.statedField?.trim() || input.interests[0]?.trim() || "";
}

function generatedCareerFromGraph(graph: DestinationGraph): CareerKnowledge {
  return CareerKnowledgeSchema.parse({
    id: graph.destinationId,
    title: graph.destinationName,
    aliases: [],
    family: "Generated",
    summary: graph.summary,
    capabilities: graph.capabilityNodes.map((node) => ({
      capabilityId: node.id,
      targetLevel: node.stageExpected === "specialist" ? "strong" : node.stageExpected === "developing" ? "working" : "basic",
      importance: node.importance === "useful" ? "supporting" : node.importance,
      prerequisites: node.prerequisites,
    })),
    proofExpectations: graph.proofExpectations.map((item) => item.description),
    experienceExpectations: graph.experienceExpectations.map((item) => item.description),
    signalExpectations: [],
    adjacentCareerIds: graph.adjacentDestinations.map((item) => item.id),
    status: "generated",
    version: 1,
    lastReviewed: new Date().toISOString().slice(0, 10),
    reviewCadenceMonths: 3,
    generatedAt: new Date().toISOString(),
  });
}

export async function resolveDestination(
  input: CompileDestinationInput,
  options: {
    repository?: CareerRepository;
    provider?: Pick<AIProvider, "compileDestination">;
    allowCompilation: boolean;
  }
): Promise<DestinationResolution> {
  const repository = options.repository ?? careerRepository;
  const requested = requestedDestination(input);
  const known = requested ? await repository.findByTitleOrAlias(requested) : null;
  if (known) {
    return { graph: careerKnowledgeToDestinationGraph(known), source: "shared-knowledge", persisted: true };
  }

  if (!options.allowCompilation || !options.provider) throw new UnknownDestinationError(requested || "this path");
  const graph = GeneratedDestinationGraphSchema.parse(await options.provider.compileDestination(input));
  const persisted = await repository.saveGenerated(generatedCareerFromGraph(graph), graph);
  return { graph, source: "generated", persisted };
}
