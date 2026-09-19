import type { DestinationGraph } from "@/domain/types";

export type TargetLevel = "basic" | "working" | "strong";
export type KnowledgeImportance = "supporting" | "important" | "core";
export type CareerKnowledgeStatus = "seed-reviewed" | "generated" | "validated" | "reviewed";

export interface CapabilityDefinition {
  id: string;
  name: string;
  domain: string;
  description: string;
}

export interface CareerCapabilityRequirement {
  capabilityId: string;
  targetLevel: TargetLevel;
  importance: KnowledgeImportance;
  prerequisites: string[];
}

export interface CareerKnowledge {
  id: string;
  title: string;
  aliases: string[];
  family: string;
  summary: string;
  capabilities: CareerCapabilityRequirement[];
  proofExpectations: string[];
  experienceExpectations: string[];
  signalExpectations: string[];
  adjacentCareerIds: string[];
  status: CareerKnowledgeStatus;
  version: number;
  lastReviewed: string;
  reviewCadenceMonths: number;
  generatedAt?: string;
  provider?: string;
  model?: string;
}

export interface ResourceKnowledge {
  id: string;
  title: string;
  provider: string;
  url: string;
  capabilityIds: string[];
  type: string;
  cost: "free" | "freemium" | "paid";
  level: "beginner" | "intermediate" | "advanced" | "mixed";
  notes: string;
  sourceType: "official" | "trusted";
  lastChecked: string;
}

export interface CareerTransitionKnowledge {
  fromCareerId: string;
  toCareerId: string;
  sharedCapabilityIds: string[];
  newCapabilityIds: string[];
  sharedCount: number;
  targetRequiredCount: number;
  overlapFraction: number;
}

export interface KnowledgeMetadata {
  name: string;
  version: string;
  createdAt: string;
  careerCount: number;
  capabilityCount: number;
  resourceCount: number;
  transitionCount: number;
  notes: string[];
  resourceCoveragePercent: number;
  resourceCoverage: string;
  resourceExpansionDate: string;
}

export interface GeneratedCareerPersistence {
  save(career: CareerKnowledge, graph: DestinationGraph): Promise<void>;
  getById?(id: string): Promise<CareerKnowledge | null>;
  findByTitleOrAlias?(normalizedInput: string): Promise<CareerKnowledge | null>;
  list?(): Promise<CareerKnowledge[]>;
}

export interface CareerRepository {
  getById(id: string): Promise<CareerKnowledge | null>;
  findByTitleOrAlias(input: string): Promise<CareerKnowledge | null>;
  list(): Promise<CareerKnowledge[]>;
  saveGenerated(career: unknown, graph: DestinationGraph): Promise<boolean>;
}

export interface CapabilityRepository {
  getById(id: string): Promise<CapabilityDefinition | null>;
  list(): Promise<CapabilityDefinition[]>;
}

export interface ResourceRepository {
  matchCapabilityIds(capabilityIds: string[]): Promise<ResourceKnowledge[]>;
}

export interface CareerTransitionRepository {
  between(fromCareerId: string, toCareerId: string): Promise<CareerTransitionKnowledge | null>;
}
