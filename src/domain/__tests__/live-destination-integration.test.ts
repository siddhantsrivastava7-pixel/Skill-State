import { describe, expect, it, vi } from "vitest";
import type OpenAI from "openai";
import { OpenAIProvider } from "@/agent/openai-provider";
import { getDemoPersona } from "@/data/demo";
import {
  SEEDED_EXPERIENCE_CATALOG,
  matchExperienceToGaps,
} from "@/data/library/experience-library";
import {
  SEEDED_PROJECTS_CATALOG,
  matchProjectsToGaps,
} from "@/data/library/projects-library";
import { matchResourcesToGaps } from "@/data/library/resources-library";
import {
  calculateCareerPathsWithOverlap,
  SEEDED_CAREER_PATHS_CATALOG,
} from "@/data/library/careers-library";
import { deriveVerifiedStates } from "@/domain/evidence-transition";
import { prioritizeGaps } from "@/domain/prioritization";
import {
  uxResearcherGraph,
  uxResearcherPlan,
  uxResearcherProfile,
} from "./fixtures/ux-researcher";

describe("unseeded live destination integration", () => {
  const verifiedStates = deriveVerifiedStates(uxResearcherGraph, [], {});
  const gaps = prioritizeGaps({
    graph: uxResearcherGraph,
    verifiedStates,
    claimedStates: {},
    targetTimelineMonths: uxResearcherProfile.targetTimelineMonths,
  });

  it("populates every capability state and gap without inventing evidence", () => {
    expect(uxResearcherGraph.destinationName).toBe("UX Researcher");
    expect(uxResearcherGraph.capabilityNodes.map((node) => node.id)).toEqual(
      expect.arrayContaining([
        "user-research-methods",
        "research-planning",
        "interviewing-usability",
        "research-synthesis",
        "findings-communication",
        "research-portfolio",
      ])
    );
    expect(Object.keys(verifiedStates)).toHaveLength(uxResearcherGraph.capabilityNodes.length);
    expect(Object.values(verifiedStates).every((state) => state.state === "unverified")).toBe(true);
    expect(Object.values(verifiedStates).every((state) => state.evidenceIds.length === 0)).toBe(true);
    expect(gaps).toHaveLength(uxResearcherGraph.capabilityNodes.length);
  });

  it("keeps every downstream recommendation grounded in the active graph", () => {
    const activeIds = new Set(uxResearcherGraph.capabilityNodes.map((node) => node.id));
    const resources = matchResourcesToGaps(gaps, uxResearcherGraph);
    const projects = matchProjectsToGaps(gaps, uxResearcherGraph, uxResearcherPlan);
    const experiences = matchExperienceToGaps(gaps, uxResearcherGraph, verifiedStates);
    const careers = calculateCareerPathsWithOverlap(uxResearcherGraph, verifiedStates, false);

    expect(resources).toHaveLength(gaps.length);
    expect(resources.every((group) => activeIds.has(group.gapCapabilityId))).toBe(true);
    expect(resources.flatMap((group) => group.resources).every((resource) =>
      activeIds.has(resource.targetGapCapabilityId)
    )).toBe(true);

    expect(projects).not.toHaveLength(0);
    expect(projects.every((project) => project.targetCapabilityIds.every((id) => activeIds.has(id)))).toBe(true);
    expect(projects.some((project) => project.targetCapabilityIds.includes("research-planning"))).toBe(true);
    expect(projects.some((project) => project.targetCapabilityIds.includes("research-synthesis"))).toBe(true);
    expect(projects.some((project) => project.targetCapabilityIds.includes("research-portfolio"))).toBe(true);

    expect(experiences).not.toHaveLength(0);
    expect(experiences.every((opportunity) => opportunity.targetCapabilityIds.every((id) => activeIds.has(id)))).toBe(true);
    expect(experiences.every((opportunity) => opportunity.isDemoOpportunity)).toBe(true);

    expect(careers.slice(1).map((career) => career.title)).toEqual(
      uxResearcherGraph.adjacentDestinations.map((destination) => destination.title)
    );

    const seededProjectIds = new Set(SEEDED_PROJECTS_CATALOG.map((project) => project.id));
    const seededExperienceIds = new Set(SEEDED_EXPERIENCE_CATALOG.map((opportunity) => opportunity.id));
    expect(projects.every((project) => !seededProjectIds.has(project.id))).toBe(true);
    expect(experiences.every((opportunity) => !seededExperienceIds.has(opportunity.id))).toBe(true);
  });

  it("accepts an arbitrary active capability ID in live verification output", async () => {
    const parse = vi.fn().mockResolvedValue({
      output_parsed: {
        data: {
          tasks: [
            {
              id: "task-user-research-methods",
              capabilityId: "user-research-methods",
              capabilityName: "User Research Methods",
              type: "scenario",
              prompt: "Describe a suitable research plan and how you would validate the findings.",
              options: null,
              rubric: "Selects a suitable method and explains validation and ethics.",
            },
          ],
        },
        meta: {
          confidence: "high",
          evidenceContradictory: false,
          unresolvedMappings: false,
          ambiguous: false,
        },
      },
    });
    const provider = new OpenAIProvider(
      { apiKey: "test", miniModel: "mini-from-env", reasoningModel: "reasoning-from-env" },
      { responses: { parse } } as unknown as OpenAI
    );

    const tasks = await provider.generateVerification({
      capabilityIds: ["user-research-methods"],
      context: JSON.stringify({ capability: uxResearcherGraph.capabilityNodes[0] }),
    });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].capabilityId).toBe("user-research-methods");
    expect(tasks[0].options).toBeUndefined();
  });

  it("preserves explicit Persona A/B/C demo behavior", () => {
    for (const personaId of ["persona-a", "persona-b", "persona-c"] as const) {
      const persona = getDemoPersona(personaId);
      expect(persona.graph.capabilityNodes.length).toBeGreaterThan(0);
      expect(persona.plan.now.length).toBeGreaterThan(0);
    }
    const demoPaths = calculateCareerPathsWithOverlap(
      getDemoPersona("persona-b").graph,
      getDemoPersona("persona-b").verifiedStates,
      true
    );
    expect(demoPaths.length).toBeGreaterThanOrEqual(SEEDED_CAREER_PATHS_CATALOG.length);
    expect(demoPaths.every((path) => path.isPreview === false)).toBe(true);
  });
});
