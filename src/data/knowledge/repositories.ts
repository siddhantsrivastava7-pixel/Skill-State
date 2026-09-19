import capabilitiesData from "./data/capabilities.json";
import careersData from "./data/career-graphs.json";
import aliasesData from "./data/career-aliases.json";
import transitionsData from "./data/career-transitions.json";
import resourcesData from "./data/resources.json";
import resourcesByCapabilityData from "./data/resources-by-capability.json";
import resourceCoverageData from "./data/resource-coverage.json";
import metadataData from "./data/meta.json";
import {
  CapabilityDefinitionSchema,
  CareerKnowledgeSchema,
  CareerTransitionKnowledgeSchema,
  KnowledgeMetadataSchema,
  ResourceKnowledgeSchema,
} from "./schemas";
import { DestinationGraphSchema } from "@/domain/schemas";
import type {
  CapabilityDefinition,
  CapabilityRepository,
  CareerKnowledge,
  CareerRepository,
  CareerTransitionKnowledge,
  CareerTransitionRepository,
  GeneratedCareerPersistence,
  ResourceKnowledge,
  ResourceRepository,
} from "./types";
import type { DestinationGraph } from "@/domain/types";

const capabilities = CapabilityDefinitionSchema.array().parse(capabilitiesData);
const careers = CareerKnowledgeSchema.array().parse(careersData);
const transitions = CareerTransitionKnowledgeSchema.array().parse(transitionsData);
const resources = ResourceKnowledgeSchema.array().parse(resourcesData);

export const knowledgeMetadata = KnowledgeMetadataSchema.parse(metadataData);
export const resourceCoverage = resourceCoverageData;

export function normalizeCareerLookup(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const capabilityById = new Map(capabilities.map((item) => [item.id, item]));
const careerById = new Map(careers.map((item) => [item.id, item]));
const aliasToCareerId = new Map<string, string>();

for (const career of careers) {
  aliasToCareerId.set(normalizeCareerLookup(career.id), career.id);
  aliasToCareerId.set(normalizeCareerLookup(career.title), career.id);
  for (const alias of career.aliases) {
    aliasToCareerId.set(normalizeCareerLookup(alias), career.id);
  }
}
for (const [alias, careerId] of Object.entries(aliasesData)) {
  aliasToCareerId.set(normalizeCareerLookup(alias), careerId);
}
export const seededAliasCount = Object.keys(aliasesData).length;

const resourceById = new Map(resources.map((item) => [item.id, item]));
const resourcesByCapability = new Map<string, ResourceKnowledge[]>();
for (const [capabilityId, resourceIds] of Object.entries(resourcesByCapabilityData)) {
  const indexed = resourceIds.map((id) => resourceById.get(id));
  if (indexed.some((item) => !item)) throw new Error(`Invalid resource index for ${capabilityId}`);
  resourcesByCapability.set(capabilityId, indexed as ResourceKnowledge[]);
}

const transitionByPair = new Map(
  transitions.map((item) => [`${item.fromCareerId}->${item.toCareerId}`, item])
);

export class StaticCareerRepository implements CareerRepository {
  constructor(private readonly persistence?: GeneratedCareerPersistence) {}

  getByIdSync(id: string): CareerKnowledge | null {
    return careerById.get(id) ?? null;
  }

  findByTitleOrAliasSync(input: string): CareerKnowledge | null {
    const careerId = aliasToCareerId.get(normalizeCareerLookup(input));
    return careerId ? this.getByIdSync(careerId) : null;
  }

  listSync(): CareerKnowledge[] {
    return careers.slice();
  }

  async getById(id: string): Promise<CareerKnowledge | null> {
    return this.getByIdSync(id) ?? await this.persistence?.getById?.(id) ?? null;
  }

  async findByTitleOrAlias(input: string): Promise<CareerKnowledge | null> {
    return this.findByTitleOrAliasSync(input) ??
      await this.persistence?.findByTitleOrAlias?.(normalizeCareerLookup(input)) ??
      null;
  }

  async list(): Promise<CareerKnowledge[]> {
    return [...this.listSync(), ...(await this.persistence?.list?.() ?? [])];
  }

  async saveGenerated(careerInput: unknown, graphInput: DestinationGraph): Promise<boolean> {
    const career = CareerKnowledgeSchema.safeParse(careerInput);
    const graph = DestinationGraphSchema.safeParse(graphInput);
    if (!career.success || !graph.success || career.data.status !== "generated") return false;
    const graphIds = new Set(graph.data.capabilityNodes.map((node) => node.id));
    const careerIds = new Set(career.data.capabilities.map((item) => item.capabilityId));
    const references = [
      ...graph.data.capabilityNodes.flatMap((node) => [...node.prerequisites, ...node.unlocks]),
      ...graph.data.proofExpectations.map((proof) => proof.capabilityId),
      ...graph.data.sharedFoundationNodeIds,
    ];
    if (
      graphIds.size === 0 ||
      graphIds.size !== graph.data.capabilityNodes.length ||
      careerIds.size !== graphIds.size ||
      [...careerIds].some((id) => !graphIds.has(id)) ||
      references.some((id) => !graphIds.has(id))
    ) return false;
    if (!this.persistence) return false;
    await this.persistence.save(career.data, graph.data);
    return true;
  }
}

export class StaticCapabilityRepository implements CapabilityRepository {
  getByIdSync(id: string): CapabilityDefinition | null {
    return capabilityById.get(id) ?? null;
  }

  listSync(): CapabilityDefinition[] {
    return capabilities.slice();
  }

  async getById(id: string): Promise<CapabilityDefinition | null> {
    return this.getByIdSync(id);
  }

  async list(): Promise<CapabilityDefinition[]> {
    return this.listSync();
  }
}

export class StaticResourceRepository implements ResourceRepository {
  matchCapabilityIdsSync(capabilityIds: string[]): ResourceKnowledge[] {
    const seen = new Set<string>();
    const result: ResourceKnowledge[] = [];
    for (const capabilityId of capabilityIds) {
      for (const resource of resourcesByCapability.get(capabilityId) ?? []) {
        if (!seen.has(resource.id)) {
          seen.add(resource.id);
          result.push(resource);
        }
      }
    }
    return result;
  }

  async matchCapabilityIds(capabilityIds: string[]): Promise<ResourceKnowledge[]> {
    return this.matchCapabilityIdsSync(capabilityIds);
  }
}

export class StaticCareerTransitionRepository implements CareerTransitionRepository {
  betweenSync(fromCareerId: string, toCareerId: string): CareerTransitionKnowledge | null {
    return transitionByPair.get(`${fromCareerId}->${toCareerId}`) ?? null;
  }

  async between(fromCareerId: string, toCareerId: string): Promise<CareerTransitionKnowledge | null> {
    return this.betweenSync(fromCareerId, toCareerId);
  }
}

export const careerRepository = new StaticCareerRepository();
export const capabilityRepository = new StaticCapabilityRepository();
export const resourceRepository = new StaticResourceRepository();
export const careerTransitionRepository = new StaticCareerTransitionRepository();

export function isCareerKnowledgeStale(career: CareerKnowledge, now = new Date()): boolean {
  const reviewedAt = new Date(`${career.lastReviewed}T00:00:00Z`);
  const refreshAt = new Date(reviewedAt);
  refreshAt.setUTCMonth(refreshAt.getUTCMonth() + career.reviewCadenceMonths);
  return now.getTime() >= refreshAt.getTime();
}
