import { describe, expect, it, vi } from "vitest";
import { careerKnowledgeToDestinationGraph } from "../adapter";
import { careerRepository, knowledgeMetadata, seededAliasCount, StaticCareerRepository } from "../repositories";
import { resolveDestination, UnknownDestinationError } from "../resolution";
import type { CareerKnowledge, GeneratedCareerPersistence } from "../types";
import type { CompileDestinationInput, DestinationGraph, Evidence } from "@/domain/types";
import { getDemoPersona } from "@/data/demo";
import { matchResourcesToGaps } from "@/data/library/resources-library";
import { matchProjectsToGaps } from "@/data/library/projects-library";
import { matchExperienceToGaps } from "@/data/library/experience-library";
import { calculateCareerPathsWithOverlap } from "@/data/library/careers-library";
import { deriveVerifiedStates } from "@/domain/evidence-transition";
import { prioritizeGaps } from "@/domain/prioritization";
import { preserveEvidenceOnDestinationChange } from "@/domain/destination-switch";
import { DestinationGraphSchema } from "@/domain/schemas";
import { formatPlanningHorizonLabel, resolvePlanningHorizon } from "@/domain/planning-horizon";
import { buildTodaySchedule } from "@/domain/daily-scheduling";

const uxInput: CompileDestinationInput = {
  stage: "college", certainty: "exact", statedDestination: "UX Researcher", interests: ["research"],
};

function sharedGraph(id: string): DestinationGraph {
  const career = careerRepository.getByIdSync(id);
  if (!career) throw new Error(`missing test career ${id}`);
  return careerKnowledgeToDestinationGraph(career);
}

describe("SkillState shared knowledge v1.1", () => {
  it("loads the complete v1.1 shared baseline once", () => {
    expect(knowledgeMetadata).toMatchObject({
      version: "1.1.0", careerCount: 54, capabilityCount: 125, resourceCount: 97, transitionCount: 324,
    });
    expect(careerRepository.listSync()).toHaveLength(54);
    expect(seededAliasCount).toBe(153);
  });

  it("resolves known UX Researcher without calling the compiler", async () => {
    const compileDestination = vi.fn();
    const result = await resolveDestination(uxInput, { allowCompilation: true, provider: { compileDestination } });
    expect(result.source).toBe("shared-knowledge");
    expect(result.graph.destinationId).toBe("ux-researcher");
    expect(compileDestination).not.toHaveBeenCalled();
  });

  it("resolves the User Researcher alias to UX Researcher", async () => {
    const result = await resolveDestination({ ...uxInput, statedDestination: "User Researcher" }, { allowCompilation: false });
    expect(result.graph.destinationId).toBe("ux-researcher");
  });

  it("calls live compilation exactly once for an unknown destination", async () => {
    const compileDestination = vi.fn().mockResolvedValue({
      ...sharedGraph("ux-researcher"), destinationId: "quantum-experience-designer", destinationName: "Quantum Experience Designer",
    });
    const result = await resolveDestination(
      { ...uxInput, statedDestination: "Quantum Experience Designer" },
      { allowCompilation: true, provider: { compileDestination } }
    );
    expect(compileDestination).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ source: "generated", persisted: false });
  });

  it("does not admit invalid generated career data into persistence", async () => {
    const save = vi.fn();
    const persistence: GeneratedCareerPersistence = { save };
    const repository = new StaticCareerRepository(persistence);
    const graph = { ...sharedGraph("ux-researcher"), capabilityNodes: [] };
    const career: CareerKnowledge = {
      ...(careerRepository.getByIdSync("ux-researcher") as CareerKnowledge),
      id: "generated-invalid", title: "Generated Invalid", status: "generated",
    };
    await expect(repository.saveGenerated(career, graph)).resolves.toBe(false);
    expect(save).not.toHaveBeenCalled();
  });

  it("serves seeded careers when AI compilation is unavailable", async () => {
    await expect(resolveDestination(uxInput, { allowCompilation: false })).resolves.toMatchObject({ source: "shared-knowledge" });
    await expect(resolveDestination(
      { ...uxInput, statedDestination: "Unknown Future Role" }, { allowCompilation: false }
    )).rejects.toBeInstanceOf(UnknownDestinationError);
  });

  it("builds Persona B and C from the shared career repository", () => {
    expect(getDemoPersona("persona-b").graph.destinationId).toBe("ai-engineer");
    expect(getDemoPersona("persona-c").graph.destinationId).toBe("financial-analyst");
    expect(getDemoPersona("persona-b").graph.capabilityNodes.map((node) => node.id)).toContain("model-evaluation");
    expect(getDemoPersona("persona-c").graph.capabilityNodes.map((node) => node.id)).toContain("financial-modeling");
  });

  it("uses the shared AI Engineer graph for Persona B", () => {
    expect(getDemoPersona("persona-b").graph.capabilityNodes.map((node) => node.id)).toEqual(
      sharedGraph("ai-engineer").capabilityNodes.map((node) => node.id)
    );
  });

  it("uses the shared Financial Analyst graph for Persona C", () => {
    expect(getDemoPersona("persona-c").graph.capabilityNodes.map((node) => node.id)).toEqual(
      sharedGraph("financial-analyst").capabilityNodes.map((node) => node.id)
    );
  });

  it("matches resources by exact canonical capability ID", () => {
    const graph = sharedGraph("ux-researcher");
    const capabilityId = "ux-research-methods";
    const groups = matchResourcesToGaps(
      [{ capabilityId, gapType: "never-learned", priority: "high", reason: "Missing", blocksCapabilityIds: [] }],
      graph
    );
    expect(groups[0].resources.length).toBeGreaterThan(0);
    expect(groups[0].resources.every((resource) => resource.targetGapCapabilityId === capabilityId)).toBe(true);
  });

  it("matches UX resources only through canonical IDs without AI catalog leakage", () => {
    const graph = sharedGraph("ux-researcher");
    const states = deriveVerifiedStates(graph, [], {});
    const gaps = prioritizeGaps({ graph, verifiedStates: states, claimedStates: {} });
    const resources = matchResourcesToGaps(gaps, graph, states);
    const projects = matchProjectsToGaps(gaps, graph);
    const experiences = matchExperienceToGaps(gaps, graph, states);
    expect(resources.flatMap((group) => group.resources).every((item) =>
      graph.capabilityNodes.some((node) => node.id === item.targetGapCapabilityId)
    )).toBe(true);
    expect(JSON.stringify({ resources, projects, experiences })).not.toMatch(/FastAPI|linear algebra repair|DCF\/WACC/i);
  });

  it("does not recommend coursework for a Needs Proof state", () => {
    const graph = sharedGraph("ux-researcher");
    const capabilityId = graph.capabilityNodes[0].id;
    const groups = matchResourcesToGaps(
      [{ capabilityId, gapType: "knowledge-no-proof", priority: "high", reason: "Needs proof", blocksCapabilityIds: [] }],
      graph,
      { [capabilityId]: { capabilityId, state: "needs-proof", evidenceIds: [], explanation: "Claim only", lastUpdatedAt: "2026-09-19" } }
    );
    expect(groups[0]).toMatchObject({ needsProof: true, resources: [] });
  });

  it("preserves historical evidence when changing to a shared career", () => {
    const current = sharedGraph("ai-engineer");
    const target = sharedGraph("data-engineer");
    const evidence: Evidence[] = [{
      id: "evidence-python", type: "project", title: "Python project", createdAt: "2026-09-19",
      capabilitySignals: [{ capabilityId: "programming-python", signal: "supports", strength: "high", explanation: "Working project" }],
    }];
    const switched = preserveEvidenceOnDestinationChange({
      currentEvidence: evidence,
      currentVerifiedStates: deriveVerifiedStates(current, evidence, {}),
      currentClaimedStates: {}, newGraph: target,
    });
    expect(switched.preservedEvidence).toEqual(evidence);
    expect(switched.updatedVerifiedStates["programming-python"].state).toBe("verified");
  });

  it("computes overlap from concrete verified intersections and keeps known What-If local", () => {
    const graph = sharedGraph("ux-researcher");
    const verifiedStates = Object.fromEntries(graph.capabilityNodes.map((node) => [node.id, {
      capabilityId: node.id,
      state: node.id === "human-centered-design" ? "verified" as const : "unverified" as const,
      evidenceIds: [], explanation: "test", lastUpdatedAt: "2026-09-19",
    }]));
    const before = JSON.stringify(verifiedStates);
    const paths = calculateCareerPathsWithOverlap(graph, verifiedStates, false);
    expect(paths.slice(1).every((path) => path.isPreview === false)).toBe(true);
    for (const path of paths) {
      const count = path.graph.capabilityNodes.filter((node) => verifiedStates[node.id]?.state === "verified").length;
      expect(path.overlapPercentage).toBe(path.graph.capabilityNodes.length ? Math.round((count / path.graph.capabilityNodes.length) * 100) : 0);
    }
    expect(JSON.stringify(verifiedStates)).toBe(before);
  });

  it("keeps older persisted destination graphs schema-valid without rewriting IDs", () => {
    const oldGraph = { ...getDemoPersona("persona-b").graph, destinationId: "dest-ai-engineer" };
    expect(DestinationGraphSchema.safeParse(oldGraph).success).toBe(true);
    expect(oldGraph.destinationId).toBe("dest-ai-engineer");
  });

  it("keeps full-path configuration distinct from estimated journey duration", () => {
    const horizon = resolvePlanningHorizon({ mode: "full-path", stage: "professional" });
    expect(horizon.resolvedMonths).toBeUndefined();
    expect(formatPlanningHorizonLabel(horizon, 12)).toBe("Full path to goal");
  });

  it("never schedules more than deterministic daily capacity", () => {
    const action = {
      id: "large-action", category: "build" as const, title: "Large build", description: "A 21-hour action",
      whyNow: "Required", estimatedMinutes: 21 * 60, capabilityIds: ["programming-python"], status: "todo" as const,
    };
    const schedule = buildTodaySchedule([action, { ...action, id: "second" }], 28);
    expect(schedule.reduce((sum, item) => sum + item.scheduledMinutes, 0)).toBeLessThanOrEqual(336);
    expect(schedule.every((item) => item.scheduledMinutes <= 120)).toBe(true);
    expect(schedule[0].isPartial).toBe(true);
  });
});
