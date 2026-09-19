import { z } from "zod";

export const CapabilityDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  domain: z.string().min(1),
  description: z.string().min(1),
});

export const CareerCapabilityRequirementSchema = z.object({
  capabilityId: z.string().min(1),
  targetLevel: z.enum(["basic", "working", "strong"]),
  importance: z.enum(["supporting", "important", "core"]),
  prerequisites: z.array(z.string()),
});

export const CareerKnowledgeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  aliases: z.array(z.string()),
  family: z.string().min(1),
  summary: z.string().min(1),
  capabilities: z.array(CareerCapabilityRequirementSchema).min(1),
  proofExpectations: z.array(z.string()),
  experienceExpectations: z.array(z.string()),
  signalExpectations: z.array(z.string()),
  adjacentCareerIds: z.array(z.string()),
  status: z.enum(["seed-reviewed", "generated", "validated", "reviewed"]),
  version: z.number().int().positive(),
  lastReviewed: z.string().min(1),
  reviewCadenceMonths: z.number().int().positive(),
  generatedAt: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
});

export const ResourceKnowledgeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  provider: z.string().min(1),
  url: z.string().url(),
  capabilityIds: z.array(z.string()).min(1),
  type: z.string().min(1),
  cost: z.enum(["free", "freemium", "paid"]),
  level: z.enum(["beginner", "intermediate", "advanced", "mixed"]),
  notes: z.string(),
  sourceType: z.enum(["official", "trusted"]),
  lastChecked: z.string().min(1),
});

export const CareerTransitionKnowledgeSchema = z.object({
  fromCareerId: z.string().min(1),
  toCareerId: z.string().min(1),
  sharedCapabilityIds: z.array(z.string()),
  newCapabilityIds: z.array(z.string()),
  sharedCount: z.number().int().nonnegative(),
  targetRequiredCount: z.number().int().positive(),
  overlapFraction: z.number().min(0).max(1),
});

export const KnowledgeMetadataSchema = z.object({
  name: z.string(),
  version: z.string(),
  createdAt: z.string(),
  careerCount: z.number().int().nonnegative(),
  capabilityCount: z.number().int().nonnegative(),
  resourceCount: z.number().int().nonnegative(),
  transitionCount: z.number().int().nonnegative(),
  notes: z.array(z.string()),
  resourceCoveragePercent: z.number(),
  resourceCoverage: z.string(),
  resourceExpansionDate: z.string(),
});
