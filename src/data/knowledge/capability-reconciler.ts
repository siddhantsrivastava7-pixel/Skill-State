import type { CapabilityNode, DestinationGraph } from "@/domain/types";
import { DestinationGraphSchema } from "@/domain/schemas";
import { capabilityRepository } from "./repositories";
import type { CapabilityDefinition } from "./types";

export type CapabilityMappingMethod = "exact-id" | "exact-name" | "alias" | "semantic";

export interface CapabilityMapping {
  generatedId: string;
  canonicalId: string;
  method: CapabilityMappingMethod;
}

export interface CapabilityReconciliationResult {
  graph: DestinationGraph;
  mappings: CapabilityMapping[];
  novelCapabilityIds: string[];
}

const CAPABILITY_ALIASES: Record<string, string> = {
  "ml foundations": "machine-learning",
  "machine learning foundations": "machine-learning",
  "version control": "git-version-control",
  "git version control": "git-version-control",
  "software collaboration and version control": "git-version-control",
  "data cleaning and preparation": "data-wrangling",
  "data preparation": "data-wrangling",
  "natural language processing": "nlp-llms",
};

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function semanticallyEquivalent(
  generated: CapabilityNode,
  canonical: CapabilityDefinition
): boolean {
  const text = normalize(`${generated.name} ${generated.description}`);
  switch (canonical.id) {
    case "programming-python":
      return text.includes("python") &&
        ["program", "code", "script", "language"].some((term) => text.includes(term));
    case "machine-learning":
      return (text.includes("machine learning") || text.includes("supervised model") || text.includes("unsupervised model")) &&
        !text.includes("language model") && !text.includes("nlp");
    case "git-version-control":
      return text.includes("version control") &&
        ["git", "branch", "commit", "repository", "code review"].some((term) => text.includes(term));
    case "data-wrangling":
      return ["clean", "reshape", "prepare", "validate"].filter((term) => text.includes(term)).length >= 2 &&
        (text.includes("data") || text.includes("dataset"));
    case "nlp-llms":
      return text.includes("natural language processing") ||
        (text.includes("language model") && (text.includes("retrieval") || text.includes("nlp")));
    default:
      return false;
  }
}

function findCanonicalCapability(
  node: CapabilityNode,
  canonicalCapabilities: CapabilityDefinition[]
): { capability: CapabilityDefinition; method: CapabilityMappingMethod } | null {
  const normalizedId = normalize(node.id).replace(/ /g, "-");
  const exactId = canonicalCapabilities.find((item) => item.id === normalizedId);
  if (exactId) return { capability: exactId, method: "exact-id" };

  const normalizedName = normalize(node.name);
  const exactName = canonicalCapabilities.find((item) => normalize(item.name) === normalizedName);
  if (exactName) return { capability: exactName, method: "exact-name" };

  const aliasId = CAPABILITY_ALIASES[normalizedName] ?? CAPABILITY_ALIASES[normalize(node.id)];
  const alias = aliasId
    ? canonicalCapabilities.find((item) => item.id === aliasId)
    : undefined;
  if (alias && semanticallyEquivalent(node, alias)) {
    return { capability: alias, method: "alias" };
  }

  const semanticMatches = canonicalCapabilities.filter((item) =>
    semanticallyEquivalent(node, item)
  );
  return semanticMatches.length === 1
    ? { capability: semanticMatches[0], method: "semantic" }
    : null;
}

const importanceRank = { useful: 0, important: 1, core: 2 } as const;
const stageRank = { foundation: 0, developing: 1, specialist: 2 } as const;

function mergeNodes(current: CapabilityNode, incoming: CapabilityNode): CapabilityNode {
  const stageExpected = !current.stageExpected
    ? incoming.stageExpected
    : !incoming.stageExpected
      ? current.stageExpected
      : stageRank[incoming.stageExpected] > stageRank[current.stageExpected]
        ? incoming.stageExpected
        : current.stageExpected;
  return {
    ...current,
    description: current.description === incoming.description
      ? current.description
      : `${current.description} ${incoming.description}`,
    importance: importanceRank[incoming.importance] > importanceRank[current.importance]
      ? incoming.importance
      : current.importance,
    ...(stageExpected ? { stageExpected } : {}),
    prerequisites: Array.from(new Set([...current.prerequisites, ...incoming.prerequisites])),
    unlocks: Array.from(new Set([...current.unlocks, ...incoming.unlocks])),
  };
}

/** Conservatively reuses canonical identities while retaining genuinely novel capabilities. */
export function reconcileGeneratedDestinationGraph(
  graph: DestinationGraph,
  canonicalCapabilities = capabilityRepository.listSync()
): CapabilityReconciliationResult {
  const idMappings = new Map<string, string>();
  const mappings: CapabilityMapping[] = [];
  const novelCapabilityIds: string[] = [];

  for (const node of graph.capabilityNodes) {
    const match = findCanonicalCapability(node, canonicalCapabilities);
    if (match) {
      idMappings.set(node.id, match.capability.id);
      mappings.push({ generatedId: node.id, canonicalId: match.capability.id, method: match.method });
    } else {
      idMappings.set(node.id, node.id);
      novelCapabilityIds.push(node.id);
    }
  }

  const remap = (id: string) => idMappings.get(id) ?? id;
  const nodesById = new Map<string, CapabilityNode>();
  for (const node of graph.capabilityNodes) {
    const mappedId = remap(node.id);
    const canonical = canonicalCapabilities.find((item) => item.id === mappedId);
    const mapped: CapabilityNode = {
      ...node,
      id: mappedId,
      ...(canonical
        ? {
            name: canonical.name,
            family: canonical.domain,
            description: node.description === canonical.description
              ? canonical.description
              : `${canonical.description} Destination context: ${node.description}`,
          }
        : {}),
      prerequisites: node.prerequisites.map(remap).filter((id) => id !== mappedId),
      unlocks: node.unlocks.map(remap).filter((id) => id !== mappedId),
    };
    const existing = nodesById.get(mappedId);
    nodesById.set(mappedId, existing ? mergeNodes(existing, mapped) : mapped);
  }

  const finalIds = new Set(nodesById.keys());
  const capabilityNodes = Array.from(nodesById.values()).map((node) => ({
    ...node,
    prerequisites: Array.from(new Set(node.prerequisites)).filter((id) => finalIds.has(id)),
    unlocks: Array.from(new Set(node.unlocks)).filter((id) => finalIds.has(id)),
  }));

  const reconciled = DestinationGraphSchema.parse({
    ...graph,
    capabilityNodes,
    proofExpectations: graph.proofExpectations.map((proof) => ({
      ...proof,
      capabilityId: remap(proof.capabilityId),
    })),
    adjacentDestinations: graph.adjacentDestinations.map((destination) => ({
      ...destination,
      sharedCapabilityIds: Array.from(new Set(destination.sharedCapabilityIds.map(remap)))
        .filter((id) => finalIds.has(id)),
    })),
    sharedFoundationNodeIds: Array.from(new Set(graph.sharedFoundationNodeIds.map(remap)))
      .filter((id) => finalIds.has(id)),
  });

  return { graph: reconciled, mappings, novelCapabilityIds };
}
